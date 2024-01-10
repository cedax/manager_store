const express = require('express');
const router = express.Router();
const Producto = require('../../../models/producto');

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
        // Buscar si el nombre ya existe o coincide con alguno de la base de datos
        const producto = await Producto.findOne({ nombre: req.body.nombre });
        if (producto) {
            res.status(200).json({ success: false, message: 'El producto ya existe' });
            return;
        }

        // buscar si existe una coincidencia parcial en la base de datos
        const productoCoincidente = await Producto.findOne({ nombre: { $regex: req.body.nombre, $options: 'i' } });
        if (productoCoincidente) {
            res.status(200).json({ success: false, message: 'El nombre del producto es muy parecido a alguno ya registrado' });
            return;
        }

        const { nombre, precio, existencia } = req.body;
        const nuevoProducto = new Producto({ nombre, precio, existencia });
        await nuevoProducto.save();
        res.status(200).json({ success: true, message: 'Producto agregado correctamente' });
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
        //res.status(500).json({ error: 'Error al obtener el producto para editar' });

        res.render('./messages/error', {
            title: 'Error',
            layout: './layouts/dashboard',
            error: 'Error al obtener el producto para editar',
        })
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
    const productoId = req.params.id; // Obtén el ID del producto de los parámetros de la URL

    try {
        const { nombre, precio, existencia } = req.body;

        // Buscar si el nombre ya existe o coincide con alguno de la base de datos pero excluye al id actual
        const productoEdit = await Producto.findOne({ nombre: req.body.nombre, _id: { $ne: productoId } });
        
        if (productoEdit) {
            res.status(200).json({ success: false, message: 'El producto ya existe' });
            return;
        }

        // Buscar si existe algún producto con un nombre similar pero diferente al que se está registrando
        const productoExistente = await Producto.findOne({
            nombre: { $regex: new RegExp(nombre, 'i') }, // Búsqueda insensible a mayúsculas y minúsculas
            _id: { $ne: productoId } // Excluir el producto actual de la búsqueda
        });

        if (productoExistente) {
            res.status(200).json({ success: false, message: 'El nombre del producto es muy parecido a alguno ya registrado' });
            return;
        }

        const producto = await Producto.findById(productoId);

        // Actualiza los datos del producto con los valores del formulario
        producto.nombre = nombre;
        producto.precio = precio;
        producto.existencia = existencia;

        // Guarda el producto actualizado en la base de datos
        await producto.save();

        res.status(200).json({ success: true, message: 'Producto actualizado correctamente' });
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