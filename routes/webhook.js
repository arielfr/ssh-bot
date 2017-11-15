const logger = require('winston-this')('webhook');
const config = require('config');
const express = require('express');
const router = express.Router();
const parseArgs = require('minimist');
const facebook = require('../services/facebook');
const ssh = require('../services/ssh');
const files = require('../utils/files');
const path = require('path');

const pemDirectory = path.join(__dirname, '../', 'pems');

router.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = config.get('verification_token');

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

router.post('/webhook', (req, res) => {
  const body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    logger.debug(`Message receive from page`);

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      const webhook_event = entry.messaging[0];
      const senderId = webhook_event.sender.id;

      // Check if it is a message
      if (webhook_event.message) {
        // If it is a text message
        if (webhook_event.message.text) {
          const text = webhook_event.message.text || '';
          const splitText = text.split(' ');
          const command = splitText[0].toLowerCase();
          const args = getArgs(splitText.slice(1));

          logger.info(`Command: ${command} | Arguments: ${JSON.stringify(args)}`);

          if (['ssh', 'cmd', 'reconnect', 'disconnect', 'help'].indexOf(command) !== -1) {
            if (command === 'help') {
              facebook.sendMessage(senderId, `Welcome to SSH!\n\nThis BOT will allow you to establish a SSH connection. We are currently supporting a PEM file and a password connection.\n\nIf you want to use a PEM file, you only need to send us the file as an attachment first. Then, use the ssh command "--pem" flag to indicate that you wanna use it\n\nAvailable Commands:`);

              facebook.sendList(senderId, [
                {
                  title: 'ssh (With PEM)',
                  subtitle: 'ssh --host=<VALUE> --user=<VALUE> --pem',
                },
                {
                  title: 'ssh (With Password)',
                  subtitle: 'ssh --host=<VALUE> --user=<VALUE> --password=<VALUE>',
                },
                {
                  title: 'cmd',
                  subtitle: 'cmd <COMMAND>. Example: cmd ls -la',
                },
                {
                  title: 'reconnect',
                  subtitle: 'If you already connect using SSH, you can run this without any argument',
                },
              ]);

              facebook.sendList(senderId, [
                {
                  title: 'disconnect',
                  subtitle: 'Close connection to server',
                },
                {
                  title: 'help',
                  subtitle: 'Get the available comments',
                }
              ]);
            }

            // SSH Command
            if (command === 'ssh' && args.host && args.user && (args.pem || args.password)) {
              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              ssh.createAndConnect(senderId, args.host, args.user, args.password, args.pem).then(() => {
                facebook.sendMessage(senderId, `You are now connected to ${args.host}@${args.user}`);
              }).catch((err) => {
                facebook.sendMessage(senderId, `Oops and error ocurr connecting to ${args.host}: ${err}`);
              });
            } else if (command === 'ssh') {
              facebook.sendMessage(senderId, `To connect you need to send us the "host", "user" and "pem" or "password" depending on your security`);
            }

            // Reconnect command
            if (command === 'reconnect') {
              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              ssh.reconnect(senderId).then((savedConnection) => {
                facebook.sendMessage(senderId, `You are now connected to ${savedConnection.host}@${savedConnection.username}`);
              }).catch((err) => {
                facebook.sendMessage(senderId, `Oops and error ocurr connecting to ${savedConnection.host}: ${err}`);
              });
            }

            // CMD Command
            if (command === 'cmd') {
              const terminalCommand = splitText.slice(1).join(' ');

              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              ssh.executeCommand(senderId, terminalCommand).then((result) => {
                let commandResult = result;

                if (result.length >= 640) {
                  facebook.sendMessage(senderId, `The result was more than 640 characters. We are stripping the message.`);

                  commandResult = result.substring(0, 640);
                } else if (result.length === 0) {
                  commandResult = `Sorry, but the command don't produce any output...`;
                }

                facebook.sendMessage(senderId, commandResult);
              }).catch((err) => {
                facebook.sendMessage(senderId, `${err}`);
              });
            }

            // Disconnect Comand
            if (command === 'disconnect') {
              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              ssh.disconnect(senderId).then(() => {
                facebook.sendMessage(senderId, `You are now disconnected. Hope to see you again.`);
              }).catch((err) => {
                console.log(err);
              });
            }
          } else {
            facebook.sendMessage(senderId, `Please type "help" to know all of the available commands`);
          }
        } else if (webhook_event.message.attachments) {
          const payloadUrl = webhook_event.message.attachments[0].payload.url;
          const savedFile = path.join(pemDirectory, `${senderId}.pem`);

          // Create Pem Directory if it doesnt exists
          files.createDir(pemDirectory).then(() => {
            facebook.sendAction(senderId, facebook.available_actions.TYPING);

            return files.downloadFile(payloadUrl, savedFile)
          }).then(() => {
            facebook.sendMessage(senderId, 'Pem file was successfully downloaded and saved. When you try to connect dont forget to send --pem argument');
          }).catch(err => {
            logger.error(err);
          });
        } else {
          logger.error(`Unknown type of message: ${Object.keys(webhook_event.message)}`);
        }
      } else if (webhook_event.postback) {
        logger.info(`postback received`);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

/**
 * Get arguments from an array of strings
 * @param arguments
 */
const getArgs = (arguments = []) => parseArgs(arguments);

module.exports = router;