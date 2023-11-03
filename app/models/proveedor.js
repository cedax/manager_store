const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
    nombre: String,
    correoElectronico: String,
    telefono: String
});

module.exports = mongoose.model('Proveedor', proveedorSchema);