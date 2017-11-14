/**
 * Created by arey on 11/14/17.
 */
const express = require('express');
const logger = require('winston-this')('index');
const node_ssh = require('node-ssh');

// Express Application initialization
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, function () {
  logger.info('Example application listening on port 3000');
});

/*
const ssh = new node_ssh();

ssh.connect({
  host: '13.84.178.228',
  user: 'ubuntu',
  privateKey: '/Users/arey/.ssh/patas.pem',
}).then(() => {
  ssh.execCommand('cat .bashrc').then(function(result) {
    console.log('STDOUT: ' + result.stdout)
    console.log('STDERR: ' + result.stderr)

    ssh.dispose();
  });
});
*/