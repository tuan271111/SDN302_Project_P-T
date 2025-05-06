const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

// @desc    Create new booking
// @route   POST /bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { 
      roomId, 
      checkIn, 
      checkOut, 
      adults, 
      children, 
      specialRequests 
    } = req.body;
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      req.flash('error', 'Check-out date must be after check-in date');
      return res.redirect(`/rooms/${roomId}`);
    }
    
    // Find room
    const room = await Room.findById(roomId);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/rooms');
    }
    
    // Check if room is available
    const bookings = await Booking.find({
      room: roomId,
      status: { $ne: 'cancelled' },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ]
    });
    
    if (bookings.length > 0 || !room.isAvailable) {
      req.flash('error', 'Room is not available for the selected dates');
      return res.redirect(`/rooms/${roomId}`);
    }
    
    // Calculate total price
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * room.price;
    
    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: {
        adults: parseInt(adults),
        children: parseInt(children || 0)
      },
      totalPrice,
      specialRequests
    });

    // Send notification to admin (webhook could be connected to a notification service)
    try {
      // This is where you would integrate with a notification service
      console.log(`New booking created: ${booking._id} for room ${roomId}`);
      
      // You could implement email notifications here as well
      // await sendEmail({
      //   to: 'admin@example.com',
      //   subject: 'New Booking Notification',
      //   text: `A new booking (${booking._id}) has been created for room ${room.name}`
      // });
    } catch (error) {
      console.error('Notification error:', error);
      // Don't stop the booking process if notification fails
    }
    
    // Redirect to payment page instead of booking details
    return res.redirect(`/payment/${booking._id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error creating booking');
    res.redirect('/rooms');
  }
};

// @desc    Get current user's bookings
// @route   GET /bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('bookings/list', {
      title: 'My Bookings',
      bookings
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching bookings');
    res.redirect('/');
  }
};

// @desc    Cancel booking
// @route   PUT /bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Check if booking can be cancelled
    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    
    if (checkIn <= today) {
      req.flash('error', 'Cannot cancel a booking that has already started or completed');
      return res.redirect('/bookings/my-bookings');
    }
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();
    
    req.flash('success', 'Booking cancelled successfully');
    res.redirect('/bookings/my-bookings');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error cancelling booking');
    res.redirect('/bookings/my-bookings');
  }
};

// @desc    Get booking creation form
// @route   GET /bookings/create/:roomId
// @access  Private
exports.getBookingForm = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/rooms');
    }
    
    // Get pre-filled dates from query if they exist
    const { checkIn, checkOut } = req.query;
    
    res.render('bookings/create', {
      title: `Book ${room.name}`,
      room,
      checkIn,
      checkOut
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading booking form');
    res.redirect('/rooms');
  }
};