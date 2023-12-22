const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    numero: { type: String, required: true, unique: true },
    deudas: [
        {
            monto: { type: Number, required: true },
            fechaMaximaPago: { type: Date, required: true },
            pagado: { type: Boolean, default: false },
        },
    ],
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;