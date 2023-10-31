const express = require('express');
const router = express.Router();
// Middlewares
const { isLoggedIn } = require('../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard/inventario');
});

const inventarioRoutes = require('./dashboard/inventario');
const deudoresRoutes = require('./dashboard/deudores');
const finanzasRoutes = require('./dashboard/finanzas');
const otrosRoutes = require('./dashboard/otros');
const usuariosRoutes = require('./dashboard/usuarios');

router.use('/inventario', inventarioRoutes);
router.use('/deudores', deudoresRoutes);
router.use('/finanzas', finanzasRoutes);
router.use('/otros', otrosRoutes);
router.use('/usuarios', usuariosRoutes);

module.exports = router;