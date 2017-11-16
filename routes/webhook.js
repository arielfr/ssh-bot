const logger = require('winston-this')('webhook');
const config = require('config');
const express = require('express');
const router = express.Router();
const parseArgs = require('minimist');
const facebook = require('../services/facebook');
const ssh = require('../services/ssh');
const files = require('../utils/files');
const path = require('path');
const text2png = require('text2png');

const pemDirectory = path.join(__dirname, '../', 'pems');
const tempDirectory = path.join(__dirname, '../', 'temp');

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
          const text = webhook_event.message.text.replace(/—/g, '--') || '';
          const splitText = text.split(' ');
          const command = splitText[0].toLowerCase();
          const args = getArgs(splitText.slice(1));

          logger.info(`Command: ${command} | Arguments: ${JSON.stringify(args)}`);

          if (['ssh', 'cmd', 'reconnect', 'disconnect', 'help'].indexOf(command) !== -1) {
            if (command === 'help') {
              facebook.sendMessage(senderId, `Welcome to SSH!\n\nThis BOT will allow you to establish a SSH connection. We are currently supporting a PEM file and a password connection.\n\nIf you want to use a PEM file, you only need to send us the file as an attachment first. Then, use the ssh command "--pem" flag to indicate that you wanna use it\n\nOn Ubuntu servers when running .bashrc if your SSH is not interactive there maybe commands that are not exported. Run your commands with "--interactive"\n\nAvailable Commands:`);

              facebook.sendGeneric(senderId, [
                {
                  title: 'ssh (With PEM)',
                  subtitle: 'ssh --host=<VALUE> --user=<VALUE> --port=<VALUE> (optional) --pem',
                },
                {
                  title: 'ssh (With Password)',
                  subtitle: 'ssh --host=<VALUE> --user=<VALUE> --password=<VALUE> --port=<VALUE> (optional)',
                },
                {
                  title: 'cmd (response as text)',
                  subtitle: 'cmd <COMMAND>. Example: cmd ls -la',
                },
                {
                  title: 'cmd (response as image)',
                  subtitle: 'cmd <COMMAND> --image. Example: cmd ls -la --image',
                },
                {
                  title: 'cmd (interactive)',
                  subtitle: 'cmd <COMMAND> --interactive. Example: cmd node --version --interactive',
                },
                {
                  title: 'reconnect',
                  subtitle: 'If you already connect using SSH, you can run this without any argument',
                },
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

              ssh.createAndConnect(senderId, args.host, args.port, args.user, args.password, args.pem).then(() => {
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
              // Get the command that is going to be send to the bash
              let terminalCommand = splitText.slice(1).join(' ');

              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              // Remove the argument from the final terminal command
              if (args.image) {
                terminalCommand = terminalCommand.replace('--image', '');
              }

              if (args.interactive) {
                terminalCommand = terminalCommand.replace('--interactive', '');
              }

              ssh.executeCommand(senderId, terminalCommand, args.interactive).then((result) => {
                if (result.length === 0) {
                  logger.debug(`Response from command ${terminalCommand} was EMPTY`);

                  facebook.sendMessage(senderId, `Sorry, but the command (${terminalCommand}) don't produce any output...`);
                } else {
                  // This will send the response in image format
                  if (args.image) {
                    logger.debug(`The user specifies of ${terminalCommand} the result as image`);

                    files.createDir(tempDirectory).then(() => {
                      logger.debug(`Creating result from ${terminalCommand} to image`);

                      files.writeFile(path.join(tempDirectory, `${senderId}.png`), text2png(result, {
                        textColor: 'white',
                        bgColor: 'black',
                        font: config.get('font')
                      }));

                      logger.debug(`Uploading result from ${terminalCommand} to image`);

                      facebook.uploadFile(path.join(tempDirectory, `${senderId}.png`), facebook.valid_attachment_types.IMAGE_FILE).then((attachmentId) => {
                        facebook.sendAttachment(senderId, attachmentId, facebook.valid_attachment_types.IMAGE_FILE);
                      }).catch(() => {
                        facebook.sendMessage(senderId, `Oops and error ocurr trying to execute: ${terminalCommand}`);
                      });
                    });
                  } else {
                    if (result.length > 640) {
                      const toExecute = [];
                      // If the result is more than 3 messages, stripped
                      let strippedResult = (result.length > (640 * 2)) ? result.substring(0, (640 * 2)) : result;

                      let j = 0;
                      for (let i = 0; i < strippedResult.length; i++) {
                        if (i !== 0 && (i % 640) === 0) {
                          toExecute.push(facebook.sendMessage(senderId, strippedResult.substring(i - 640, j + 640)));
                          j = j + 640;
                        } else if ((i === (strippedResult.length - 1))) {
                          toExecute.push(facebook.sendMessage(senderId, strippedResult.substring((strippedResult.length - (i - j)), strippedResult.length)));
                        }
                      }

                      if (result.length > (640 * 2)) {
                        toExecute.push(facebook.sendMessage(senderId, `This message was bigger than 2 messages (1280 characters). Use --image instead`));
                      }

                      // Sending all messages
                      promiseSerial(toExecute);
                    } else {
                        facebook.sendMessage(senderId, result);
                    }
                  }
                }
              }).catch((err) => {
                if (err.message === 'No response from server') {
                  facebook.sendMessage(senderId, `The connection die. Please type "reconnect" to connect again or "help" to learn about the available commands`);
                } else {
                  facebook.sendMessage(senderId, `${err}`);
                }
              });
            }

            // Disconnect Comand
            if (command === 'disconnect') {
              facebook.sendAction(senderId, facebook.available_actions.TYPING);

              ssh.disconnect(senderId).then(() => {
                facebook.sendMessage(senderId, `You are now disconnected. Hope to see you again.`);
              }).catch((err) => {
                facebook.sendMessage(senderId, err);
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

/**
 * Resolve promises in serial mode
 * @param tasks
 * @returns {*}
 */
const promiseSerial = (tasks) => {
  return tasks.reduce((promiseChain, currentTask) => {
    return promiseChain.then(chainResults =>
      currentTask.then(currentResult =>
        [ ...chainResults, currentResult ]
      )
    );
  }, Promise.resolve([]));
};

module.exports = router;