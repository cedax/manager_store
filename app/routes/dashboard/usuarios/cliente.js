const express = require('express');
const router = express.Router();
const Cliente = require('../../../models/cliente');
const { v4: uuidv4 } = require('uuid');

// Ruta para procesar el formulario de registro
router.post('/registro', async (req, res) => {
    let clienteJson = {};
    console.log(req.body);
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

        res.status(200).json({
            status: true,
            id: nuevoCliente._id
        });
    } catch (error) {
        console.error('Error al registrar el cliente:', error);
        //let clienteJsonString = JSON.stringify(clienteJson);

        if (error.code === 11000 && error.keyPattern.correo) {
            res.status(200).json({
                status: false,
                error: 'Correo ya registrado'
            });
        } else if (error.code === 11000 && error.keyPattern.numero) {
            res.status(200).json({
                status: false,
                error: 'Número ya registrado'
            });
        } else {
            res.status(200).json({
                status: false,
                error: 'Error interno del servidor',
                code: error.code
            });

        }
    }
});

// Ruta para buscar clientes
router.post('/buscar', async (req, res) => {
    try {
        const { nombre, correo, numero } = req.body;

        // Define el ID del usuario que se debe omitir
        const idUsuarioOmitir = '6584ff01432f549c127ccb41';

        // Define un objeto de búsqueda con los campos proporcionados
        const filtroBusqueda = {
            _id: { $ne: idUsuarioOmitir } // Excluir el usuario con el ID especificado
        };

        if (nombre) filtroBusqueda.nombres = nombre;
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

router.get('/json', async (req, res) => {
    try {
        const clientes = await Cliente.find();

        const clientesFiltrados = clientes.filter(cliente => cliente._id.toString() !== '6584ff01432f549c127ccb41');

        res.json(clientesFiltrados);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});


// Ruta para agregar una nueva deuda a un cliente
router.post('/agregarDeuda/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    const { monto, fechaMaximaPago } = req.body;

    try {
        // Buscar el cliente por su ID
        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        // Crear una nueva deuda
        const nuevaDeuda = {
            monto,
            fechaMaximaPago,
            pagado: false,
        };

        // Agregar la nueva deuda al array de deudas del cliente
        cliente.deudas.push(nuevaDeuda);

        // Guardar el cliente actualizado en la base de datos
        const clienteActualizado = await cliente.save();

        res.status(201).json({
            mensaje: 'Deuda agregada con éxito',
            cliente: clienteActualizado,
        });
    } catch (error) {
        console.error('Error al agregar deuda:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

router.put('/pagarDeuda/:clienteId/:deudaId', async (req, res) => {
    const { clienteId, deudaId } = req.params;

    try {
        // Encuentra el cliente por ID
        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        // Encuentra la deuda por ID
        const deuda = cliente.deudas.find(d => d._id == deudaId);

        if (!deuda) {
            return res.status(404).json({ mensaje: 'Deuda no encontrada para este cliente' });
        }

        // Marcar la deuda como pagada
        deuda.pagado = true;

        // Guardar los cambios en el cliente
        await cliente.save();

        return res.json({ mensaje: `Deuda ${deudaId} del cliente ${clienteId} pagada con éxito` });
    } catch (error) {
        console.error('Error al pagar la deuda:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;