const config = require('config');
const logger = require('winston-this')('facebook');
const fb = require('fb');
const request = require('request');
const isProduction = (process.env.NODE_ENV === 'production');
const fs = require('fs');

fb.setAccessToken(config.get('token'));
fb.options({version: 'v2.6'});

module.exports = {
  available_actions: {
    MARK_AS_READ: 'mark_seen',
    TYPING: 'typing_on',
    END_TYPING: 'typing_off',
  },
  /**
   * Send message to Facebook User
   * @param senderId
   * @param message
   */
  sendMessage: (senderId, message) => {
    if (isProduction) {
      fb.api('/me/messages', 'POST', {
        recipient: {
          id: senderId
        },
        message: {
          text: message
        },
      }, (res) => {
        if (!res || res.error) {
          logger.error(`An error ocurr on sendMessage: ${res.error.message}`);
          return;
        }

        logger.info(`Message sent to user: ${senderId}`);
      });
    } else {
      logger.info(message);
    }
  },
  /**
   * Send action to Facebook
   * @param sendId
   * @param action
   */
  sendAction: (senderId, action) => {
    if (isProduction) {
      fb.api('/me/messages', 'POST', {
        recipient: {
          id: senderId
        },
        sender_action: action,
      }, (res) => {
        if (!res || res.error) {
          logger.error(`An error ocurr on sendAction: ${res.error.message}`);
          return;
        }

        logger.info(`Reaction sent to user: ${senderId}`);
      });
    } else {
      logger.info(action);
    }
  },
  /**
   * Send a list template message
   * @param senderId
   * @param elements
   * @param isCompact
   */
  sendList: (senderId, elements, isCompact = true) => {
    if (isProduction) {
      fb.api('/me/messages', 'POST', {
        recipient: {
          id: senderId
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'list',
              top_element_style: isCompact ? 'compact' : 'large',
              elements: elements,
            }
          }
        },
      }, (res) => {
        if (!res || res.error) {
          logger.error(`An error ocurr on sendAction: ${res.error.message}`);
          return;
        }

        logger.info(`Reaction sent to user: ${senderId}`);
      });
    } else {
      logger.info(items);
    }
  },
  /**
   * Send generic template
   * @param senderId
   * @param elements
   */
  sendGeneric: (senderId, elements) => {
    if (isProduction) {
      fb.api('/me/messages', 'POST', {
        recipient: {
          id: senderId
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: elements,
            }
          }
        },
      }, (res) => {
        if (!res || res.error) {
          logger.error(`An error ocurr on sendAction: ${res.error.message}`);
          return;
        }

        logger.info(`Reaction sent to user: ${senderId}`);
      });
    } else {
      logger.info(items);
    }
  },
  sendAttachment: (senderId, attachmentId, type = 'image') => {
    if (isProduction) {
      fb.api('/me/messages', 'POST', {
        recipient: {
          id: senderId
        },
        message: {
          attachment: {
            type: type,
            payload: {
              attachment_id: attachmentId,
            }
          }
        },
      }, (res) => {
        if (!res || res.error) {
          logger.error(`An error ocurr sending the attachment: ${res.error.message}`);
          return;
        }

        logger.info(`Attachment sent to user: ${senderId}`);
      });
    } else {
      logger.info(attachmentId);
    }
  },
  uploadFile: (attachmentPath, type = 'image') => {
    const formData = {
      message: JSON.stringify({
        attachment: {
          type: type,
          payload: {
            is_reusable: true,
          }
        }
      }),
      filedata: fs.createReadStream(attachmentPath)
    };

    return new Promise((resolve, reject) => {
      request.post({
        url: `https://graph.facebook.com/v2.6/me/message_attachments?access_token=${config.get('token')}`,
        formData: formData,
      }, (err, response, body) => {
        if (err) {
          logger.error(JSON.parse(err).message);
          return reject(`An error ocurr generating the response`);
        }

        resolve(JSON.parse(body).attachment_id);
      });
    })
  }
};