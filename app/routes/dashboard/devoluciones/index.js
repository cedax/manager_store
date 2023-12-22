const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middlewares/authentication');
const Venta = require('../../../models/venta');

router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard/devoluciones/devoluciones', { title: 'Dashboard - Devoluciones', layout: './layouts/dashboard', req })
});

router.get('/ventas', async (req, res) => {
    try {
        const ventas = await Venta.find().populate('idCliente', 'nombres apellidos');
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las ventas' });
    }
});

router.post('/devolucion/:ventaId', async (req, res) => {
    const ventaId = req.params.ventaId;
    console.log(ventaId);
    try {
        // Busca la venta por su ID
        const venta = await Venta.findById(ventaId);

        // Verifica si la venta existe
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Elimina la venta de la base de datos
        await venta.deleteOne();

        // Respuesta exitosa
        res.json({ mensaje: 'Devolución realizada exitosamente, devuelva el dinero al cliente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la devolución' });
    }
});


module.exports = router;