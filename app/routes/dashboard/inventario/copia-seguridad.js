const express = require('express');
const router = express.Router();

const Producto = require('../../../models/producto');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

router.get('/', async (req, res) => {
    res.render('./dashboard/inventario/copia-seguridad', {
        title: 'Inventario - Productos',
        layout: './layouts/dashboard',
        req
    })
});

router.post('/crear', async (req, res) => {
    try {
        const productos = await Producto.find();
        const csvWriter = createCsvWriter({
            path: 'productos.csv',
            header: [
                { id: 'nombre', title: 'Nombre' },
                { id: 'precio', title: 'Precio' },
                { id: 'existencia', title: 'Existencia' }
            ]
        });

        csvWriter.writeRecords(productos)
            .then(() => {
                res.download('productos.csv', 'productos.csv');
            })
            .catch(error => {
                res.status(500).json({ error: 'Error al crear la copia de seguridad', info: error });
            });

    } catch (error) {
        res.status(500).json({ error: 'Error al crear la copia de seguridad', info: error });
    }
});

module.exports = router;