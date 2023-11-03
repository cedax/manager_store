const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.render('./dashboard/inventario/estadisticas', {
        title: 'Inventario - Estadisticas',
        layout: './layouts/dashboard',
        req
    })
});

module.exports = router;