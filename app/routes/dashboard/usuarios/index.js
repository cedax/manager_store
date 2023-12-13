const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');
const clientRoutes = require('./cliente');

router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard/usuarios/usuarios', { title: 'Dashboard - Usuarios', layout: './layouts/dashboard', req })
});

router.use('/cliente', clientRoutes);

module.exports = router;