const config = require('config');
const logger = require('winston-this')('facebook');
const fb = require('fb');

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
  },
  /**
   * Send action to Facebook
   * @param sendId
   * @param action
   */
  sendAction: (senderId, action) => {
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
  }
};