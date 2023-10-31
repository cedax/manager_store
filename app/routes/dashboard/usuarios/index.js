const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard/usuarios/usuarios', { title: 'Dashboard - Usuarios', layout: './layouts/dashboard', req })
});


module.exports = router;