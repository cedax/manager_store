const express = require('express');
const router = express.Router();
const productosRoutes = require('./productos');
const copiaSeguridadRoutes = require('./copia-seguridad');
const ventasRoutes = require('./ventas');
const estadisticasRoutes = require('./estadisticas');

const enConstruccionRoutes = require('../../en-construccion.js');

// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard/inventario/productos');
});

router.use('/productos', productosRoutes);

router.use('/copia-seguridad', copiaSeguridadRoutes);

router.use('/ventas', ventasRoutes);

router.use('/estadisticas', estadisticasRoutes);
//router.use('/estadisticas', enConstruccionRoutes);

module.exports = router;