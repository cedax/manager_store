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
const devoluciones = require('./dashboard/devoluciones');
const enConstruccionRoutes = require('./en-construccion.js');

router.use('/inventario', inventarioRoutes);
router.use('/deudores', deudoresRoutes);
router.use('/finanzas', finanzasRoutes);
router.use('/otros', otrosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/devoluciones', devoluciones);


module.exports = router;