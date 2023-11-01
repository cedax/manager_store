const express = require('express');
const router = express.Router();
const Producto = require('../../../models/producto');
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

const createPayment = (req, res) => {
    const totalAmount = req.query.total;

    const payment = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: 'http://localhost:3000/', // URL de retorno después del pago exitoso
            cancel_url: 'http://localhost:3000/' // URL de retorno después de cancelar el pago
        },
        transactions: [{
            amount: {
                total: totalAmount,
                currency: 'MXN'
            },
            description: 'Compra de productos en manager store'
        }]
    };

    paypal.payment.create(payment, (error, payment) => {
        if (error) {
            throw error;
        } else {
            for (let link of payment.links) {
                if (link.rel === 'approval_url') {
                    res.redirect(link.href);
                }
            }
        }
    });
};

const executePayment = (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        payer_id: payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.error(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.redirect('/success-payment');
        }
    });
};

const handleCancel = (req, res) => {
    res.redirect('/cancel'); // Redirige al usuario a una página de cancelación
};

router.get('/pay', createPayment);
router.get('/success', executePayment);
router.get('/cancel', handleCancel);

router.get('/', async (req, res) => {
    const productosAgotados = await Producto.find({ existencia: 0 });
    const productos = await Producto.find();

    res.render('./dashboard/inventario/productos', {
        title: 'Inventario - Productos',
        layout: './layouts/dashboard',
        req,
        productosAgotados,
        productos
    })
});

// Ruta para manejar el envío del formulario y agregar un nuevo producto
router.post('/nuevo', async (req, res) => {
    try {
        const { nombre, precio, existencia } = req.body;
        const nuevoProducto = new Producto({ nombre, precio, existencia });
        await nuevoProducto.save();
        res.redirect('/dashboard/inventario/productos?prodNuevoSuccess=1#rg-prd');
    } catch (error) {
        res.status(500).json({ error: 'Error al crear un nuevo producto' });
    }
});

// Ruta para editar un producto (puedes crear una vista de edición)
router.get('/editar/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        // Renderiza la vista de edición con el producto a editar
        res.render('./dashboard/inventario/editar-producto', {
            title: 'Inventario - Editar producto',
            layout: './layouts/dashboard',
            req,
            producto
        })
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto para editar' });
    }
});

// Ruta para eliminar un producto
router.get('/eliminar/:id', async (req, res) => {
    try {
        await Producto.findByIdAndRemove(req.params.id);
        res.redirect('/dashboard/inventario/productos'); // Redirige de nuevo a la lista de productos
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

router.post('/editar/:id', async (req, res) => {
    try {
        const { nombre, precio, existencia } = req.body;
        const productoId = req.params.id; // Obtén el ID del producto de los parámetros de la URL
        const producto = await Producto.findById(productoId);

        // Actualiza los datos del producto con los valores del formulario
        producto.nombre = nombre;
        producto.precio = precio;
        producto.existencia = existencia;

        // Guarda el producto actualizado en la base de datos
        await producto.save();

        res.redirect('/dashboard/inventario/productos'); // Redirige de nuevo a la lista de productos
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el producto' });
    }
});

router.get('/json', async (req, res) => {
    const productos = await Producto.find();
    res.json(productos);
});

router.get('/json/:productId', async (req, res) => {
    const productId = req.params.productId;
    const product = await Producto.findById(productId);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Producto no encontrado' });
    }
});

module.exports = router;