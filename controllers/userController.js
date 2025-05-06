const User = require('../models/User');
const Booking = require('../models/Booking');
// Add this line to import the ServiceRequest model
const ServiceRequest = require('../models/ServiceRequest');

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // Get user with bookings
    const user = await User.findById(req.user.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }
    
    // Get recent bookings
    const recentBookings = await Booking.find({ user: req.user.id })
      .populate('room')
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Get recent service requests - add try/catch to handle if this fails
    let recentServiceRequests = [];
    try {
      recentServiceRequests = await ServiceRequest.find({ user: req.user.id })
        .populate('room')
        .sort({ createdAt: -1 })
        .limit(3);
    } catch (serviceError) {
      console.error('Error fetching service requests:', serviceError);
      // Continue execution even if service requests can't be fetched
    }
    
    res.render('user/profile', {
      title: 'My Profile',
      user,
      recentBookings,
      recentServiceRequests
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    req.flash('error', 'Error loading profile');
    res.redirect('/');
  }
};

// Make sure the rest of your controller methods are properly defined