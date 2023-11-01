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

module.exports = router;