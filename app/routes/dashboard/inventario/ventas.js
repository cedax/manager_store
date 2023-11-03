const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Venta = require('../../../models/venta');
const axios = require('axios');

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
        )

        .font("Helvetica-Bold")
        .text(invoice.shipping.name, 300, customerInformationTop)
        .font("Helvetica")
        .text(invoice.shipping.address, 300, customerInformationTop + 15)
        .text(
            invoice.shipping.city +
            ", " +
            invoice.shipping.state +
            ", " +
            invoice.shipping.country,
            300,
            customerInformationTop + 30
        )
        .moveDown();

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

// Ruta de la solicitud POST para crear el ticket
router.post('/efectivo', async (req, res) => {
    const compraData = req.body; // Datos de la compra enviados desde el cliente

    // Obtén la fecha actual
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Asegúrate de obtener un número de dos dígitos
    const day = String(currentDate.getDate()).padStart(2, '0'); // Asegúrate de obtener un número de dos dígitos

    // Define la ruta donde se almacenará el archivo PDF
    const pdfFolder = path.join(__dirname, '..', '..', '..', 'public', 'tickets', String(year), month, day);
    const pdfFileName = `ticket-${Date.now()}.pdf`;
    const pdfFilePath = path.join(pdfFolder, pdfFileName);

    // Asegúrate de que la carpeta de destino exista, o créala si no existe
    fs.mkdirSync(pdfFolder, { recursive: true });

    const invoice = {
        shipping: {
            name: "Jared Lopez",
            address: "1234 Main Street",
            city: "San Francisco",
            state: "CA",
            country: "US",
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

    const serverBaseUrl = `${req.connection.encrypted ? 'https' : 'http'}://${req.headers.host}`;
    const relativePath = path.relative('C:\\Users\\chlopez\\Desktop\\manager_store\\app\\public', pdfFilePath);
    const urlDelServidor = `${serverBaseUrl}/${relativePath.replace(/\\/g, '/')}`;

    if (compraData.correo) {
        let client_id = compraData.clientId;
        let correoCliente = ''
        try {
            const response = await axios.get(`${serverBaseUrl}/dashboard/usuarios/cliente/correo/${client_id}`);
            correoCliente = response.data.correo
        } catch (error) {
            console.error('Error al obtener el correo del cliente:', error);
            throw error;
        }

        if (correoCliente != '') {
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'emortaa@gmail.com',
                    pass: 'ehnidoowqchzgjbo'
                }
            });

            try {
                const mailOptions = {
                    from: 'emortaa@gmail.com',
                    to: correoCliente,
                    subject: 'Recibo de compra - No responder',
                    text: 'Gracias por tu compra. Adjunto encontrarás el ticket.',
                    attachments: [{ path: urlDelServidor }]
                };

                // Envía el correo
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error('Error al enviar el correo:', error);
                        res.status(500).json({ error: 'Error al enviar el correo' });
                    } else {
                        console.log('Correo enviado: ' + info.response);
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }
    // Inserta la venta en MongoDB
    const nuevaVenta = new Venta({
        idCliente: compraData.clientId,
        invoice: invoice,
    });

    nuevaVenta.save().then((venta) => {
        res.json({ ticket: urlDelServidor });
    }).catch((error) => {
        console.error('Error al insertar la venta en MongoDB:', error);
        res.status(500).json({ error: 'Error al registrar la venta' });
    });

});


module.exports = router;