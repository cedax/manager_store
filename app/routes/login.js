const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureNotAuthenticated } = require('../middlewares/authentication');

router.get('/login', ensureNotAuthenticated, (req, res) => {
  res.render('login', { title: 'Login', layout: './layouts/auth', req })
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('login/?error=1');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

module.exports = router;