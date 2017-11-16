const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.send({
    ping: 'pong',
  });
});

module.exports = router;