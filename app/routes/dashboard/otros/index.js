const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard/otros/proveedores');
});

const routerproveedores = require('./proveedores');
router.use('/proveedores', routerproveedores);

const routerPedidos = require('./pedidos');
router.use('/pedidos', routerPedidos);

module.exports = router;