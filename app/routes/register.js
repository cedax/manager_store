const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const axios = require('axios');

router.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('register', { title: 'Registro', layout: './layouts/auth', req })
    }
});

router.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    const recaptchaResponse = req.body.recaptchaResponse;

    if (password !== passwordConfirm) {
        return res.redirect('/register?error=1');
    }

    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_GOOGLE_SECRET_KEY}&response=${recaptchaResponse}`;

    axios.post(verificationURL)
        .then((response) => {
            if (response.data.success) {
                User.register(new User({ username: username }), password, (err, user) => {
                    if (err) {
                        if (err.message == 'A user with the given username is already registered') {
                            return res.redirect('/register?error=2');
                        } else {
                            return res.redirect('/register?error=3');
                        }
                    }
                    passport.authenticate('local')(req, res, () => {
                        res.redirect('/dashboard');
                    });
                });
            } else {
                return res.redirect('/register?error=4');
            }
        })
        .catch((error) => {
            return res.redirect('/register?error=3');
        });
});

module.exports = router;