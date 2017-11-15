const logger = require('winston-this')('ssh');
const nodeSSH = require('node-ssh');
const files = require('../utils/files');
const path = require('path');

const pemDirectory = path.join(__dirname, '../', 'pems');

const ssh = function () {
  this.connections = {};
  this.connectionsData = {};
};

/**
 * Create a connection and connect
 * @param senderId
 * @param host
 * @param username
 * @param password
 * @param pem
 * @returns {*}
 */
ssh.prototype.createAndConnect = function (senderId, host, username, password, pem) {
  if (!!this.connections[senderId]) {
    return Promise.reject('You already have a open session. Please send "disconnect" first');
  }

  // Create SHH Client
  this.connections[senderId] = new nodeSSH();

  return Promise.resolve().then(() => {
    return (pem) ? this.secureConnection(senderId, host, username) : this.passwordConnection(senderId, host, username, password);
  }).catch(err => {
    // If an error ocurr, delete the connection
    delete this.connections[senderId];
    return Promise.reject(err);
  });
};

/**
 * Connect to SSH with a PEM file
 * @param senderId
 * @param host
 * @param username
 * @returns {Promise.<TResult>}
 */
ssh.prototype.secureConnection = function (senderId, host, username) {
  // Construct pemLocation
  const pemLocation = path.join(pemDirectory, `./${senderId}.pem`);

  return Promise.resolve().then(() => {
    return files.fileExists(pemLocation);
  }).then((exists) => {
    if (exists) {
      return files.read(pemLocation);
    } else {
      return Promise.reject(`Pem file doesn't exists. Please upload one first. Just drag it into the conversation.`);
    }
  }).then((pemFile) => {
    logger.info(`Creating a secure connection: ${username}@${host}`);

    return this.connections[senderId].connect({
      host: host,
      username: username,
      privateKey: pemFile,
    });
  }).then(() => {
    // Save the connection
    this.connectionsData[senderId] = {
      host: host,
      username: username,
      pem: true,
    };
    return true;
  }).catch(err => {
    // If an error ocurr, delete the connection
    delete this.connections[senderId];

    return Promise.reject(err);
  });
};

/**
 * Create to SSH using a password
 * @param senderId
 * @param host
 * @param username
 * @param password
 * @returns {Promise.<TResult>}
 */
ssh.prototype.passwordConnection = function (senderId, host, username, password) {
  return Promise.resolve().then(() => {
    logger.info(`Creating a password connection: ${username}@${host}`);

    return this.connections[senderId].connect({
      host: host,
      username: username,
      password: password,
    });
  }).then(() => {
    // Save the connection
    this.connectionsData[senderId] = {
      host: host,
      username: username,
      password: password,
      pem: false,
    };
    return true;
  }).catch(err => {
    // If an error ocurr, delete the connection
    delete this.connections[senderId];

    return Promise.reject(err);
  });
};

/**
 * Reconnect using last connection data
 * @param senderId
 * @returns {Promise.<TResult>}
 */
ssh.prototype.reconnect = function (senderId) {
  return Promise.resolve().then(() => {
    const savedConnection = this.connectionsData[senderId];

    if (Object.keys(savedConnection).length > 0) {
      return this.createAndConnect(senderId, savedConnection.host, savedConnection.username, savedConnection.password, savedConnection.pem).then(() => {
        return savedConnection;
      }).catch((err) => {
        return Promise.reject(err);
      });
    } else {
      return Promise.reject(`Sorry, we can't find a previous connection...`);
    }
  });
};

/**
 * Execute command
 * @param senderId
 * @param command
 * @returns {*}
 */
ssh.prototype.executeCommand = function (senderId, command) {
  if (!this.connections[senderId]) {
    return Promise.reject('You dont have a open connection. Please connect first. Send "help" command to know the available commands');
  }

  return Promise.resolve().then(() => {
    logger.info(`Executing command: ${senderId} -> ${command}`);

    return this.connections[senderId].execCommand(command);
  }).then((result) => {
    if (result.stderr) {
      return Promise.reject(`There was an error executing ${command}: ${result.stderr}`);
    }

    return result.stdout;
  }).catch(err => {
    console.log(err);
    console.log(err.message)
    console.log(err.prototype)

    return Promise.reject(`There was an error executing ${command}: ${err}`);
  });
};

/**
 * Disconnect
 * @param senderId
 * @returns {*}
 */
ssh.prototype.disconnect = function (senderId) {
  if (!this.connections[senderId]) {
    return Promise.reject('You dont have a open connection. Please connect first. Send "help" command to know the available commands');
  }

  return Promise.resolve().then(() => {
    logger.info(`Disconnecting SSH from: ${senderId}`);

    return this.connections[senderId].dispose();
  }).then((result) => {
    // Delete the connection
    delete this.connections[senderId];

    return true;
  }).catch(err => {
    // Delete the connection
    delete this.connections[senderId];

    return Promise.reject(`There was an error disconnecting the SSH: ${err}`);
  });
};

module.exports = new ssh();