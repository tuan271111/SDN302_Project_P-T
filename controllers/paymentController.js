// Update the first line of your payment controller
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Comment this out for now
const Booking = require('../models/Booking');
const crypto = require('crypto');
const querystring = require('querystring');

// VNPay demo configuration
const vnpConfig = {
  tmnCode: 'DEMO_VNPAY', // Your merchant code (demo)
  secretKey: 'VNPAY_DEMO_SECRET_KEY', // Your secret key (demo)
  vnpUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // Sandbox URL
  returnUrl: process.env.BASE_URL + '/payment/vnpay-return' // Your return URL
};

// @desc    Show payment page
// @route   GET /payment/:bookingId
// @access  Private
exports.getPaymentPage = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('room');
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      req.flash('info', 'This booking is already paid');
      return res.redirect('/bookings/my-bookings');
    }
    
    res.render('payment/index', {
      title: 'Complete Payment',
      booking
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading payment page');
    res.redirect('/bookings/my-bookings');
  }
};

// @desc    Process VNPay payment
// @route   POST /payment/process-vnpay
// @access  Private
exports.processVNPayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Create VNPay payment URL
    const date = new Date();
    const createDate = date.getFullYear().toString() + 
                      ('0' + (date.getMonth() + 1)).slice(-2) + 
                      ('0' + date.getDate()).slice(-2) + 
                      ('0' + date.getHours()).slice(-2) + 
                      ('0' + date.getMinutes()).slice(-2) + 
                      ('0' + date.getSeconds()).slice(-2);
    
    const orderId = date.getTime() + '_' + bookingId;
    const amount = booking.totalPrice * 100; // Convert to smallest currency unit
    const orderInfo = `Payment for booking #${bookingId}`;
    const orderType = 'billpayment';
    const locale = 'vn';
    const currCode = 'VND';
    
    // For demo purposes, we'll just redirect to a success page
    // In a real implementation, you would redirect to VNPay
    
    // Demo: Redirect to success page directly with the booking ID as a parameter
    return res.redirect(`/payment/demo-success/${bookingId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error processing payment');
    res.redirect('/bookings/my-bookings');
  }
};

// @desc    Demo success page (for demonstration only)
// @route   GET /payment/demo-success/:bookingId
// @access  Private
exports.demoPaymentSuccess = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.isPaid = true;
    booking.paidAt = Date.now();
    booking.status = 'confirmed'; // Set status to confirmed when payment is successful
    await booking.save();
    
    req.flash('success', 'Payment completed successfully (Demo)');
    res.render('payment/success', {
      title: 'Payment Successful',
      booking
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error processing payment');
    res.redirect('/bookings/my-bookings');
  }
};

// @desc    Handle VNPay return
// @route   GET /payment/vnpay-return
// @access  Private
exports.handleVNPayReturn = async (req, res) => {
  try {
    // In a real implementation, you would verify the payment with VNPay
    // For demo purposes, we'll assume payment is successful
    
    const vnp_Params = req.query;
    const bookingId = vnp_Params.vnp_TxnRef.split('_')[1];
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.isPaid = true;
    booking.paidAt = Date.now();
    booking.status = 'confirmed'; // Set status to confirmed when payment is successful
    await booking.save();
    
    req.flash('success', 'Payment completed successfully');
    res.render('payment/success', {
      title: 'Payment Successful',
      booking
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error processing payment');
    res.redirect('/bookings/my-bookings');
  }
};

// Helper function to sort object by key
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
}

// Export other payment methods
exports.paymentSuccess = (req, res) => {
  res.render('payment/success', { title: 'Payment Successful' });
};

exports.paymentCancel = (req, res) => {
  req.flash('info', 'Payment was cancelled');
  res.redirect('/bookings/my-bookings');
};