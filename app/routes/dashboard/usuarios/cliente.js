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

        res.redirect('/dashboard/inventario/ventas?success=1&clienteRegistrado=' + nuevoCliente._id);
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

        // Define el ID del usuario que se debe omitir
        const idUsuarioOmitir = '6584ff01432f549c127ccb41';

        // Construye el filtro de búsqueda
        const filtroBusqueda = {
            $or: [
                { nombres: new RegExp(nombre, 'i') }, // Búsqueda por nombre (insensible a mayúsculas y minúsculas)
                { correo: new RegExp(correo, 'i') }, // Búsqueda por correo (insensible a mayúsculas y minúsculas)
                { numero: new RegExp(numero, 'i') }, // Búsqueda por número (insensible a mayúsculas y minúsculas)
            ],
            _id: { $ne: idUsuarioOmitir }, // Omitir el usuario con el ID especificado
        };

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