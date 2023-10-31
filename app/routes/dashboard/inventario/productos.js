const express = require('express');
const router = express.Router();
const Producto = require('../../../models/Producto');

router.get('/', (req, res) => {
  res.render('./dashboard/inventario/productos', { title: 'Inventario - Productos', layout: './layouts/dashboard', req })
});

// Ruta para manejar el envío del formulario y agregar un nuevo producto
router.post('/nuevo', async (req, res) => {
  try {
    const { nombre, precio, existencia } = req.body;
    const nuevoProducto = new Producto({ nombre, precio, existencia });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear un nuevo producto' });
  }
});

module.exports = router;