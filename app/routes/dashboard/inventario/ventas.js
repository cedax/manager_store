const express = require('express');
const router = express.Router();
const Producto = require('../../../models/producto');
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

const createPayment = (req, res) => {
    const totalAmount = req.query.total;

    const payment = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: 'http://localhost:3000/', // URL de retorno después del pago exitoso
            cancel_url: 'http://localhost:3000/' // URL de retorno después de cancelar el pago
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

module.exports = router;