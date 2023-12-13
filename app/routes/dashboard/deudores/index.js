const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard/deudores/deudores', { title: 'Dashboard - Deudores', layout: './layouts/dashboard', req })
});

module.exports = router;