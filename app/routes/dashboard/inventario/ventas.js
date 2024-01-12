const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Venta = require('../../../models/venta');
const axios = require('axios');
const Producto = require('../../../models/producto');
const https = require('https');

const instance = axios.create({
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    })
});

  
paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

const createPayment = (req, res) => {
    const totalAmount = req.query.total;
    const serverBaseUrl = `${req.connection.encrypted ? 'https' : 'http'}://${req.headers.host}`;
    const payment = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: serverBaseUrl+'/dashboard/inventario/ventas?payment=1',
            cancel_url: serverBaseUrl+'/dashboard/inventario/ventas?payment=2'
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
    res.redirect('/cancel');
};

router.get('/pay', createPayment);
router.get('/success', executePayment);
router.get('/cancel', handleCancel);

router.get('/', async (req, res) => {
    res.render('./dashboard/inventario/ventas', {
        title: 'Inventario - Ventas',
        layout: './layouts/dashboard',
        req
    })
});

router.get('/stats', async (req, res) => {
    try {
        const productStats = await Venta.obtenerEstadisticasProductosMasVendidos();
        res.json(productStats);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

function createInvoice(invoice, path) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });

    generateHeader(doc);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateFooter(doc);

    doc.end();
    doc.pipe(fs.createWriteStream(path));
}

function generateHeader(doc) {
    const pathToLogo = path.join(__dirname, '..', '..', '..', 'public', 'img', 'logo.png'); // Ruta absoluta al logo

    doc
        .image(pathToLogo, 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(20)
        .text("Sedax Inc.", 110, 57)
        .fontSize(10)
        .text("Sedax Inc.", 200, 50, { align: "right" })
        .text("Prolongacion Abasolo 380, Valle de Tepexpan, Tlalpan", 200, 65, { align: "right" })
        .text("Ciudad de México, CDMX, 14643", 200, 80, { align: "right" })
        .moveDown();
}

function generateCustomerInformation(doc, invoice) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Ticket", 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200;

    doc
        .fontSize(10)
        .text("Numero de ticket:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text("Fecha de emision:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Total:", 50, customerInformationTop + 30)
        .text(
            formatCurrency(parseInt(invoice.subtotal) + parseInt(invoice.paid)),
            150,
            customerInformationTop + 30
        );

    generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Producto",
        "Costo unitario",
        "Cantidad",
        "Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.item,
            formatCurrency(item.amount / item.quantity),
            item.quantity,
            formatCurrency(item.amount)
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        "",
        "Subtotal",
        "",
        formatCurrency(invoice.subtotal)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        "",
        "IVA (16%)",
        "",
        formatCurrency(invoice.paid)
    );

    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        duePosition,
        "",
        "Total",
        "",
        formatCurrency(parseInt(invoice.subtotal) + parseInt(invoice.paid))
    );
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "Gracias por su compra.",
            50,
            780,
            { align: "center", width: 500 }
        );
}

function generateTableRow(
    doc,
    y,
    item,
    unitCost,
    quantity,
    lineTotal
) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        .text(unitCost, 280, y, { width: 90, align: "right" })
        .text(quantity, 370, y, { width: 90, align: "right" })
        .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(cents) {
    return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return year + "/" + month + "/" + day;
}

// Función para ajustar el precio
function ajustarPrecio(price) {
    // Redondear el precio a dos decimales
    const roundedPrice = parseFloat(price).toFixed(2);

    // Obtener la parte entera y decimal
    const [parteEntera, parteDecimal] = roundedPrice.split('.');

    // Convertir la parte entera a un número con dos ceros adicionales
    const parteEnteraAjustada = parteEntera.padStart(2, '0');

    // Convertir la parte decimal a un número con dos ceros adicionales
    const parteDecimalAjustada = parteDecimal.padEnd(2, '0');

    // Combinar la parte entera y decimal ajustadas
    const precioAjustado = `${parteEnteraAjustada}${parteDecimalAjustada}`;

    return precioAjustado;
}

const descontarProducto = async function(compraData){
    // 1. Obtener la lista de productos comprados desde compraData
    const productosComprados = compraData.productos;

    // 2. Crear un mapa para rastrear la cantidad total de cada producto
    const cantidadPorProducto = new Map();

    // 3. Calcular la cantidad total para cada producto
    for (const productoComprado of productosComprados) {
        const productoId = productoComprado.id;

        // Incrementar la cantidad total para el producto actual
        cantidadPorProducto.set(productoId, (cantidadPorProducto.get(productoId) || 0) + 1);
    }

    // 4. Actualizar la cantidad de existencia en la base de datos para cada producto
    for (const [productoId, cantidad] of cantidadPorProducto.entries()) {
        // Obtener el producto desde la base de datos
        const productoEnDB = await Producto.findById(productoId);

        if (!productoEnDB) {
            console.error(`Producto con ID ${productoId} no encontrado en la base de datos`);
            continue; // O manejar el error según sea necesario
        }

        // Calcular la nueva cantidad de existencia
        const nuevaExistencia = productoEnDB.existencia - cantidad;

        // 5. Manejar casos en los que la cantidad de existencia pueda ser negativa o cero
        if (nuevaExistencia < 0) {
            console.warn(`Existencia negativa para el producto con ID ${productoId}. Ajustando a 0.`);
            productoEnDB.existencia = 0;
        } else {
            productoEnDB.existencia = nuevaExistencia;
        }

        // Guardar el producto actualizado en la base de datos
        await productoEnDB.save();
    }
}

// Ruta de la solicitud POST para crear el ticket
router.post('/efectivo', async (req, res) => {
    try {
        let resultFinal = {
            ventaRegistrada: false,
            ticket: '',
            error: '',
            correoEnviado: false,
            correoEnvio: ''
        };

        const compraData = req.body;

        if (compraData.clientId == '') {
            compraData.clientId = '6584ff01432f549c127ccb41';
        }

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');

        const pdfFolder = path.join(__dirname, '..', '..', '..', 'public', 'tickets', String(year), month, day);
        const pdfFileName = `ticket-${Date.now()}.pdf`;
        const pdfFilePath = path.join(pdfFolder, pdfFileName);

        fs.mkdirSync(pdfFolder, { recursive: true });

        const invoice = {
            shipping: {
                name: "",
                address: "",
                city: "",
                state: "",
                country: "",
                postal_code: 94111
            },
            items: [],
            subtotal: 8000,
            paid: 8000,
            invoice_nr: 1234
        };

        compraData.productos.forEach((producto) => {
            const price = ajustarPrecio(producto.price);

            invoice.items.push({
                item: producto.name,
                quantity: 1,
                amount: price
            });
        });

        invoice.subtotal = ajustarPrecio(compraData.subtotal);
        invoice.paid = ajustarPrecio(compraData.iva);

        createInvoice(invoice, pdfFilePath);

        const nuevaVenta = new Venta({
            idCliente: compraData.clientId,
            invoice: invoice,
        });

        await nuevaVenta.save();

        const serverBaseUrl = `${req.connection.encrypted ? 'https' : 'http'}://${req.headers.host}`;
        //const relativePath = path.relative('C:\\Users\\chlopez\\Desktop\\manager_store\\app\\public', pdfFilePath);
        // CAMBIO AWS
        const relativePath = path.relative('/home/ubuntu/projects/manager_store/app/public', pdfFilePath);
        const urlDelServidor = `${serverBaseUrl}/${relativePath.replace(/\\/g, '/')}`;
        
        resultFinal.ventaRegistrada = true;
        resultFinal.ticket = urlDelServidor;
        descontarProducto(compraData);

        if (compraData.correo) {
            let client_id = compraData.clientId;
            let correoCliente = '';

            try {
                //const response = await instance.get(`${serverBaseUrl}/dashboard/usuarios/cliente/correo/${client_id}`);

                const userId = client_id;

                const cliente = await Cliente.findById(userId);

                if (!cliente) {
                    correoCliente = ""    
                }else {
                    correoCliente = cliente.correo;
                }

                resultFinal.correoEnvio = correoCliente;
            } catch (error) {
                console.error(error);
                resultFinal.error = 'Error al obtener el correo del cliente';
            }

            if (correoCliente != '') {
                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'sedax.contact@gmail.com',
                        pass: 'itdldpbvhwqjcvsb'
                    }
                });

                try {
                    const mailOptions = {
                        from: 'sedax.contact@gmail.com',
                        to: correoCliente,
                        subject: 'Recibo de compra - No responder',
                        text: 'Gracias por tu compra. Adjunto encontrarás el ticket.',
                        attachments: [{ path: urlDelServidor }]
                    };

                    await transporter.sendMail(mailOptions);

                    resultFinal.correoEnviado = true;
                } catch (error) {
                    console.error(error);
                    resultFinal.error = 'Error al enviar el correo';
                }
            }
        }

        res.status(200).json(resultFinal);
    } catch (error) {
        console.error('Error en la función principal:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/totalVentas', async (req, res) => {
    try {
        // Obtener todas las ventas
        const ventas = await Venta.find();

        // Sumar los subtotales y los pagos
        const totalSubtotal = ventas.reduce((total, venta) => total + (parseFloat(venta.invoice.subtotal) / 100), 0);
        const totalPaid = ventas.reduce((total, venta) => total + (parseFloat(venta.invoice.paid) / 100), 0);

        // Crear el JSON de respuesta
        const totalVentasJson = {
            totalSubtotal: parseFloat(totalSubtotal.toFixed(2)),
            totalPaid: parseFloat(totalPaid.toFixed(2)),
            total: parseFloat((totalSubtotal + totalPaid).toFixed(2)),
        };

        res.json(totalVentasJson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el total de ventas' });
    }
});

router.get('/descargarPDF', async (req, res) => {
    try {
        let totalGeneral = 0;

        // Obtener todas las ventas
        const ventas = await Venta.find().populate('idCliente', 'nombres apellidos');

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();

        // Configurar encabezado
        doc.fontSize(16).text('Ingresos totales', { align: 'center' });
        doc.moveDown();

        // Verificar si hubo ventas hoy
        if (ventas.length === 0) {
            doc.fontSize(14).text('No se realizaron ventas.', { align: 'center' });
        } else {
            // Iterar sobre cada venta del día
            ventas.forEach((venta, index) => {
                const totalVenta = calcularTotalVenta(venta.invoice);

                // Agregar información de la venta al PDF
                doc.fontSize(14).text(`Venta ${index + 1} - Cliente: ${venta.idCliente ? `${venta.idCliente.nombres} ${venta.idCliente.apellidos}` : 'Cliente no registrado'}`, { underline: true });
                doc.moveDown();
                doc.fontSize(12).text('Detalle de la Venta:');

                // Iterar sobre cada producto en la venta
                venta.invoice.items.forEach(item => {
                    // Agregar información del producto al PDF
                    doc.text(`- ${item.quantity} x ${item.item} - $${item.amount / 100}`);
                });

                // Agregar total de la venta al PDF
                doc.fontSize(12).text(`Total de la Venta: $${(totalVenta / 100).toFixed(2)}`);
                doc.moveDown();

                // Calcular el total general
                totalGeneral += totalVenta;
            });

            // Agregar el total general al PDF
            doc.fontSize(16).text(`Total: $${(totalGeneral / 100).toFixed(2)}`, { align: 'center' });
        }

        // Enviar el PDF como respuesta al cliente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas_hoy.pdf');
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error al generar el PDF de ventas hoy:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/generar-pdf-ventas-hoy', async (req, res) => {
    try {
        let totalGeneral = 0;

        // Obtener las ventas del día de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ventasHoy = await Venta.find({
            fechaDeVenta: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        }).populate('idCliente', 'nombres apellidos');

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();

        // Configurar encabezado
        doc.fontSize(16).text('Corte de caja del Día', { align: 'center' });
        doc.moveDown();

        // Verificar si hubo ventas hoy
        if (ventasHoy.length === 0) {
            doc.fontSize(14).text('No se realizaron ventas el día de hoy.', { align: 'center' });
        } else {
            // Iterar sobre cada venta del día
            ventasHoy.forEach((venta, index) => {
                const totalVenta = calcularTotalVenta(venta.invoice);

                // Agregar información de la venta al PDF
                doc.fontSize(14).text(`Venta ${index + 1} - Cliente: ${venta.idCliente ? `${venta.idCliente.nombres} ${venta.idCliente.apellidos}` : 'Cliente no registrado'}`, { underline: true });
                doc.moveDown();
                doc.fontSize(12).text('Detalle de la Venta:');

                // Iterar sobre cada producto en la venta
                venta.invoice.items.forEach(item => {
                    // Agregar información del producto al PDF
                    doc.text(`- ${item.quantity} x ${item.item} - $${item.amount / 100}`);
                });

                // Agregar total de la venta al PDF
                doc.fontSize(12).text(`Total de la Venta: $${(totalVenta / 100).toFixed(2)}`);
                doc.moveDown();

                // Calcular el total general
                totalGeneral += totalVenta;
            });

            // Agregar el total general al PDF
            doc.fontSize(16).text(`Total del dia: $${(totalGeneral / 100).toFixed(2)}`, { align: 'center' });
        }

        // Enviar el PDF como respuesta al cliente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas_hoy.pdf');
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error al generar el PDF de ventas hoy:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para calcular el total de una venta
function calcularTotalVenta(invoice) {
    return parseFloat(invoice.subtotal) + parseFloat(invoice.paid);
}

module.exports = router;