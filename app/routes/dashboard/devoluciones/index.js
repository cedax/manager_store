const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard/devoluciones/devoluciones', { title: 'Dashboard - Devoluciones', layout: './layouts/dashboard', req })
});

module.exports = router;