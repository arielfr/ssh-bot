const logger = require('winston-this')('webhook');
const config = require('config');
const express = require('express');
const router = express.Router();
const parseArgs = require('minimist');
const facebook = require('../services/facebook');
const ssh = require('../services/ssh');
const files = require('../utils/files');

const validCommands = ['ls', 'cat', 'cd'];
const commandTranslations = {
  ls: 'ls -la',
  cat: 'cat',
  cd: 'cd',
};

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
    logger.info(`Message receive from page`);

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      const webhook_event = entry.messaging[0];
      const recipientId = webhook_event.recipient.id;

      // Check if it is a message
      if (webhook_event.message) {
        // If it is a text message
        if (webhook_event.message.text) {
          const text = webhook_event.message.text || '';
          const splitText = text.split(' ');
          const command = splitText[0].toLowerCase();
          const args = getArgs(splitText.slice(1));

          logger.info(`Command: ${command} | Arguments: ${JSON.stringify(args)}`);

          if (command !== 'ssh') {
            // facebook.sendMessage(recipientId, 'El comando ingresado es invalido. Para conocer los comandos disponibles ingrese "help"');
          }

          if (command === 'ssh' && args.host && args.user && args.pem) {
            ssh.createAndConnect(recipientId, args.host, args.user, args.pem).then(() => {
              console.log('Connection Stablished');
            }).catch((err) => {
              console.log(err);
            });
          }

          if (command === 'cmd') {
            const isValid = validCommands.indexOf(args._[0]) !== -1;

            if (isValid) {
              const internalCommand = commandTranslations[args._[0]];

              ssh.executeCommand(recipientId, internalCommand).then((result) => {
                console.log(result);
              }).catch((err) => {
                console.log(err);
              });
            } else {
              console.log('The command is invalid or not supported. Send "help" to know all commands');
            }
          }

          if (command === 'disconnect') {
            ssh.disconnect(recipientId).then(() => {
              console.log('You are now disconnected');
            }).catch((err) => {
              console.log(err);
            });
          }
        } else if (webhook_event.message.attachments) {
          const payloadUrl = webhook_event.message.attachments[0].payload.url;
          const savedFile = `./${recipientId}.pem`;

          files.downloadFile(payloadUrl, savedFile).then(() => {
            return files.read(savedFile);
          }).then((fileContent) => {
            console.log(fileContent)
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