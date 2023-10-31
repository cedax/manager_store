const express = require('express');
const router = express.Router();
const productosRoutes = require('./productos');
// Middlewares
const { isLoggedIn } = require('../../../middlewares/authentication');

router.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard/inventario/productos');
});

router.use('/productos', productosRoutes);

module.exports = router;