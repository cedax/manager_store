const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middlewares/authentication');
const Venta = require('../../../models/venta');
const Producto = require('../../../models/producto');

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

    try {
        // Busca la venta por su ID
        const venta = await Venta.findById(ventaId);

        // Verifica si la venta existe
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Accede a los detalles de los productos vendidos en la venta
        const productosDevueltos = venta.invoice.items;

        // Actualiza el inventario para cada producto devuelto
        for (const productoDevuelto of productosDevueltos) {
            const nombreProducto = productoDevuelto.item;
            const cantidadDevuelta = productoDevuelto.quantity;

            // Busca el producto en la base de datos por su nombre
            const producto = await Producto.findOne({ nombre: nombreProducto });

            // Verifica si el producto existe
            if (!producto) {
                console.warn(`Producto con nombre "${nombreProducto}" no encontrado. La devolución se procesa sin actualizar el inventario.`);
                continue;
            }

            // Actualiza la existencia del producto
            producto.existencia += cantidadDevuelta;

            // Guarda el producto actualizado en la base de datos
            await producto.save();
        }

        // Elimina la venta de la base de datos
        await venta.deleteOne();

        // Respuesta exitosa
        res.json({ mensaje: 'Devolución realizada exitosamente. El inventario ha sido actualizado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la devolución' });
    }
});


module.exports = router;