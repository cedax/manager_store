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

        res.redirect('/dashboard/inventario/ventas?success=1');
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

module.exports = router;


