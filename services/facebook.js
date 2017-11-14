const config = require('config');
const logger = require('winston-this')('facebook');
const fb = require('fb');

fb.setAccessToken(config.get('token'));
fb.options({version: 'v2.6'});

module.exports = {
  /**
   * Send message to Facebook User
   * @param recipientId
   * @param message
   */
  sendMessage: (recipientId, message) => {
    fb.api('/me/messages', 'POST', {
      recipient: {
        id: recipientId
      },
      message: message,
    }, (res) => {
      if (!res || res.error) {
        logger.error(`An error ocurr on sendMessage: ${res.error}`);
      }

      logger.info(`Message sent to user: ${recipientId}`);
    });
  }
};