const express = require('express');
const router = express.Router();
const Proveedor = require('../../../models/proveedor');

router.get('/', async (req, res) => {
    res.render('./dashboard/otros/proveedores', {
        title: 'Inventario - Proveedores',
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

module.exports = router;