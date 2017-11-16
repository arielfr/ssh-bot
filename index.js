const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston-this')('index');
const port = process.env.PORT || config.get('port');
const environment = process.env.NODE_ENV;

logger.info(`NODE_ENV: ${environment}`);

// Express Application initialization
const app = express();

// Adding body-parser
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send({
    credits: {
      developer: 'Ariel Rey',
      github: 'https://github.com/arielfr',
      code: 'https://github.com/arielfr/ssh-bot',
    }
  })
});

app.get('/ping', (req, res) => {
  res.send({
    ping: 'pong',
  });
});

app.use(require('./routes/webhook'));

app.use(function (err, req, res, next) {
  res.send('Oops, an error ocurred...');
});

app.use((req, res) => {
  res.redirect('/');
});

app.listen(port, function () {
  logger.info(`Application up and running on port ${port}`);
});