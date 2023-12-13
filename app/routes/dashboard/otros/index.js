const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');
const enConstruccionRoutes = require('../../en-construccion.js');

router.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard/otros/proveedores');
});

const routerproveedores = require('./proveedores');
router.use('/proveedores', routerproveedores);

const routerPedidos = require('./pedidos');
//router.use('/pedidos', routerPedidos);
router.use('/pedidos', enConstruccionRoutes);

module.exports = router;