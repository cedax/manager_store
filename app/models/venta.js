// Define el modelo de venta
const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    idCliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: false,
    },
    invoice: {
        type: Object,
        required: true,
    },
    fechaDeVenta: {
        type: Date,
        default: Date.now,
    },
});

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;
