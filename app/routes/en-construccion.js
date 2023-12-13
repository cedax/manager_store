const express = require('express');
const router = express.Router();
const { ensureNotAuthenticated } = require('../middlewares/authentication');

router.get('/', (req, res) => {
  res.render('en-contruccion', {
    title: 'En construccion',
    layout: './layouts/dashboard',
    req
  });
});

module.exports = router;