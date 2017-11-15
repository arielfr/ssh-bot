const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston-this')('index');
const port = process.env.PORT || config.get('port');

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

app.listen(port, function () {
  logger.info(`Application up and running on port ${port}`);
});