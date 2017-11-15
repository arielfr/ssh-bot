const logger = require('winston-this')('ssh');
const nodeSSH = require('node-ssh');
const files = require('../utils/files');
const path = require('path');

const pemDirectory = path.join(__dirname, '../', 'pems');

const ssh = function () {
  this.connections = {};
};

ssh.prototype.createAndConnect = function (recipientId, host, user, pem) {
  if (!!this.connections[recipientId]) {
    return Promise.reject('You already have a open session. Please send "disconnect" first');
  }

  this.connections[recipientId] = new nodeSSH();

  return Promise.resolve().then(() => {
    logger.info(`Creating a connection: ${user}@${host}`);

    return this.connections[recipientId].connect({
      host: host,
      user: user,
      privateKey: files.read(path.join(pemDirectory, `./${recipientId}.pem`)),
    });
  }).then(() => {
    return true;
  }).catch(err => {
    // If an error ocurr, delete the connection
    delete this.connections[recipientId];

    return Promise.reject(`There was an error connecting to your SSH Server: ${err}`);
  });
};

ssh.prototype.executeCommand = function (recipientId, command) {
  if (!this.connections[recipientId]) {
    return Promise.reject('You dont have a open connection. Please connect first. Send "help" command to know the available commands');
  }

  return Promise.resolve().then(() => {
    logger.info(`Executing command: ${recipientId} -> ${command}`);

    return this.connections[recipientId].execCommand(command);
  }).then((result) => {
    if (result.stderr) {
      return result.stderr;
    }

    return result.stdout;
  }).catch(err => {
    return Promise.reject(`There was an error executing ${command}: ${err}`);
  });
};

ssh.prototype.disconnect = function (recipientId) {
  if (!this.connections[recipientId]) {
    return Promise.reject('You dont have a open connection. Please connect first. Send "help" command to know the available commands');
  }

  return Promise.resolve().then(() => {
    logger.info(`Disconnecting SSH from: ${recipientId}`);

    return this.connections[recipientId].dispose();
  }).then((result) => {
    // Delete the connection
    delete this.connections[recipientId];

    return true;
  }).catch(err => {
    // Delete the connection
    delete this.connections[recipientId];

    return Promise.reject(`There was an error disconnecting the SSH: ${err}`);
  });
};

module.exports = new ssh();