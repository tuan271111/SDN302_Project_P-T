const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPaymentPage,
  processVNPayPayment,
  demoPaymentSuccess,
  paymentSuccess,
  paymentCancel
} = require('../controllers/paymentController');

router.get('/:bookingId', protect, getPaymentPage);
router.post('/process-vnpay', protect, processVNPayPayment);
router.get('/demo-success/:bookingId', protect, demoPaymentSuccess); // Updated route with parameter
router.get('/success', protect, paymentSuccess);
router.get('/cancel', protect, paymentCancel);

module.exports = router;