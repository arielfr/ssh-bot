const config = require('config');
const logger = require('winston-this')('facebook');
const fb = require('fb');
const isProduction = (process.NODE_ENV === 'production');

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
   */
  sendList: (senderId, elements) => {
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
              top_element_style: 'compact',
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
  }
};