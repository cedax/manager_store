const express = require('express');
const router = express.Router();
//const paypal = require('paypal-rest-sdk');

/*
// Configura PayPal SDK
paypal.configure({
  mode: 'sandbox',
  client_id: 'TU_CLIENT_ID',
  client_secret: 'TU_CLIENT_SECRET',
});
*/

// Ruta para realizar pagos con PayPal
router.post('/pagar', async (req, res) => {
  const { productoId, cantidad } = req.body;
  console.log(productoId)
});

module.exports = router;
