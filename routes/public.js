const logger = require('winston-this')('public');
const express = require('express');
const router = express.Router();
const files = require('../utils/files');
const path = require('path');

router.get('/policy', (req, res, next) => {
  files.read(path.join(__dirname, '../', 'public', 'privacy-policy.html')).then((content) => {
    res.send(content);
  }).catch(err => {
    logger.error(err);
    next(new Error(err));
  });
});

module.exports = router;