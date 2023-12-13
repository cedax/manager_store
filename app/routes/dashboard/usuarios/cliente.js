const express = require('express');
const router = express.Router();
const Cliente = require('../../../models/cliente');
const { v4: uuidv4 } = require('uuid');

// Ruta para procesar el formulario de registro
router.post('/registro', async (req, res) => {
    let clienteJson = {};
    try {
        const { nombres, apellidos, correo, numero } = req.body;

        clienteJson = {
            nombres,
            apellidos,
            correo,
            numero
        }

        const nuevoCliente = new Cliente(clienteJson);

        await nuevoCliente.save();

        res.redirect('/dashboard/inventario/ventas?success=1&clienteRegistrado='+nuevoCliente._id);
    } catch (error) {
        let clienteJsonString = JSON.stringify(clienteJson);
        if (error.code === 11000 && error.keyPattern.correo) {
            res.redirect('/dashboard/inventario/ventas?error=1&cliente=' + clienteJsonString);  
        } else if (error.code === 11000 && error.keyPattern.numero) {
            res.redirect('/dashboard/inventario/ventas?error=2&cliente=' + clienteJsonString);
        } else {
            res.redirect('/dashboard/inventario/ventas?error=3&cliente=' + clienteJsonString);
        }
    }
});

// Ruta para buscar clientes
router.post('/buscar', async (req, res) => {
    try {
        const { nombre, correo, numero } = req.body;

        // Define un objeto de búsqueda con los campos proporcionados
        const filtroBusqueda = {};
        if (nombre) filtroBusqueda.nombres = nombres;
        if (correo) filtroBusqueda.correo = correo;
        if (numero) filtroBusqueda.numero = numero;

        // Utiliza Mongoose para buscar clientes que coincidan con el filtro
        const resultados = await Cliente.find(filtroBusqueda);

        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

router.get('/correo/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const cliente = await Cliente.findById(userId);

        if (!cliente) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({ correo: cliente.correo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;




