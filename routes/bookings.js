const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingForm
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
// Add this line to import the Booking model
const Booking = require('../models/Booking');

// Apply protect middleware to all routes
router.use(protect);

// Get booking form
router.get('/create/:roomId', getBookingForm);

// Create booking
router.post('/', createBooking);

// Get user's bookings
router.get('/my-bookings', getMyBookings);

// Cancel booking
router.put('/:id/cancel', cancelBooking);

// Add this route to handle viewing individual booking details
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email');
      
    // Check if booking exists
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/users/my-bookings');
    }
    
    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized to view this booking');
      return res.redirect('/users/my-bookings');
    }
    
    res.render('bookings/booking-detail', {
      title: 'Booking Details',
      booking
    });
  } catch (error) {
    console.error('Error in booking detail route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});
module.exports = router;