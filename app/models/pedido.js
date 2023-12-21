const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    productos: [{ nombre: String, cantidad: Number }],
    estado: { type: String, enum: ['pendiente', 'surtido'], default: 'pendiente' }
});

module.exports = mongoose.model('Pedido', pedidoSchema);