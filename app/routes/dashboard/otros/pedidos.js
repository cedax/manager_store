const express = require('express');
const router = express.Router();
const Proveedor = require('../../../models/proveedor');
const Pedido = require('../../../models/pedido');

router.get('/', async (req, res) => {
    res.render('./dashboard/otros/pedidos', {
        title: 'Inventario - Pedidos',
        layout: './layouts/dashboard',
        req
    })
});

// Endpoint para obtener la lista de proveedores
router.get('/obtener', async (req, res) => {
    try {
        const proveedores = await Proveedor.find();
        res.json(proveedores);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

router.get('/obtener/:id', async (req, res) => {
    try {
        const idProveedor = req.params.id;
        const proveedor = await Proveedor.findById(idProveedor);
        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        return res.json(proveedor);
    } catch (error) {
        console.error('Error al obtener el proveedor:', error);
        return res.status(500).json({ error: 'Error al obtener el proveedor' });
    }
});

router.post('/agregar', async (req, res) => {
    try {
        const { nombre, correoElectronico, telefono } = req.body;

        // Crea un nuevo proveedor
        const nuevoProveedor = new Proveedor({
            nombre,
            correoElectronico,
            telefono
        });

        // Guarda el proveedor en la base de datos
        const proveedorGuardado = await nuevoProveedor.save();

        res.json(proveedorGuardado);
    } catch (error) {
        console.error('Error al agregar el proveedor:', error);
        res.status(500).json({ error: 'Error al agregar el proveedor' });
    }
});

router.put('/editar/:id', async (req, res) => {
    try {
        const idProveedor = req.params.id;
        const { nombre, correoElectronico, telefono } = req.body;

        const proveedor = await Proveedor.findByIdAndUpdate(
            idProveedor,
            { nombre, correoElectronico, telefono },
            { new: true }
        );

        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        return res.json({ success: true, proveedor });
    } catch (error) {
        return res.status(500).json({ error: 'Error al editar el proveedor' });
    }
});


router.delete('/eliminar/:id', async (req, res) => {
    try {
        const idProveedor = req.params.id;
        const proveedor = await Proveedor.findByIdAndDelete(idProveedor);
        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar el proveedor:', error);
        return res.status(500).json({ error: 'Error al eliminar el proveedor' });
    }
});

// Endpoint para crear un nuevo pedido
router.post('/generarPedido', async (req, res) => {
    try {
        const { proveedor, productos } = req.body;
        
        const nuevoPedido = new Pedido({
            proveedor,
            productos,
            estado: 'pendiente' // Estado por defecto al crear un nuevo pedido
        });

        const pedidoGuardado = await nuevoPedido.save();
        res.json({ mensaje: 'Pedido generado con éxito', pedido: pedidoGuardado });
    } catch (error) {
        console.error('Error al generar el pedido:', error);
        res.status(500).json({ error: 'Error al generar el pedido.' });
    }
});

// Endpoint para obtener la lista de pedidos
router.get('/obtenerPedidos', async (req, res) => {
    try {
        const pedidos = await Pedido.find().populate('proveedor'); // Usamos populate para obtener los detalles del proveedor
        res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener la lista de pedidos:', error);
        res.status(500).json({ error: 'Error al obtener la lista de pedidos.' });
    }
});

// Endpoint para actualizar el estado de un pedido
router.put('/actualizarEstado/:pedidoId', async (req, res) => {
    try {
        const { estado } = req.body;
        const pedidoActualizado = await Pedido.findByIdAndUpdate(req.params.pedidoId, { estado }, { new: true });
        res.json({ mensaje: 'Estado actualizado con éxito', pedido: pedidoActualizado });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del pedido.' });
    }
});

// Endpoint para eliminar un pedido
router.delete('/eliminarPedido/:pedidoId', async (req, res) => {
    try {
        const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.pedidoId);
        if (pedidoEliminado) {
            res.json({ mensaje: 'Pedido eliminado con éxito' });
        } else {
            res.status(404).json({ error: 'Pedido no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        res.status(500).json({ error: 'Error al eliminar el pedido.' });
    }
});


module.exports = router;