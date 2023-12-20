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

ventaSchema.statics.obtenerEstadisticasProductosMasVendidos = async function () {
    try {
        // Agregación para contar la cantidad de cada producto vendido
        const result = await this.aggregate([
            { $unwind: '$invoice.items' },
            { $group: { _id: '$invoice.items.item', totalVendido: { $sum: '$invoice.items.quantity' } } },
            { $sort: { totalVendido: -1 } },
            { $limit: 5 } // Obtener los 5 productos más vendidos
        ]);

        // Formatear los resultados para el gráfico
        const labels = result.map(item => item._id);
        const data = result.map(item => item.totalVendido);

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas',
                    data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };
    } catch (error) {
        console.error(error);
        throw new Error('Error al obtener estadísticas de productos más vendidos');
    }
};

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;
