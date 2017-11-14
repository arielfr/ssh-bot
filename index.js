const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston-this')('index');

// Express Application initialization
const app = express();

// Adding body-parser
app.use(bodyParser.json());

app.get('/ping', (req, res) => {
  res.send({
    ping: 'pong',
  });
});

app.use(require('./routes/webhook'));

app.listen(config.get('port'), function () {
  logger.info(`Application up and running on port ${config.get('port')}`);
});