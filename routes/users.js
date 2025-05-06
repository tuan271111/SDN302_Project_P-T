const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Debug route to test if router is working
router.get('/', (req, res) => {
  console.log('Base users route accessed');
  res.send('Users router is working');
});

// Test route without protect middleware
router.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.send('Test route is working');
});

// My Room route - Fix the middleware reference
router.get('/my-room', protect, async (req, res) => {
  try {
    console.log('User in my-room route:', req.user ? req.user._id : 'No user');
    console.log('Accessing /users/my-room');
    
    if (!req.user) {
      console.log('No user found in request');
      return res.redirect('/login');
    }
    
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: 'confirmed',
      checkOut: { $gte: new Date() }
    }).populate('room');

    console.log('Active bookings found:', activeBookings ? activeBookings.length : 'none');
    
    if (!activeBookings || activeBookings.length === 0) {
      return res.render('user/my-room', {
        title: 'My Room',
        activeBookings: [],
        message: 'You currently have no active bookings'
      });
    }

    const currentBooking = activeBookings[0];
    
    res.render('user/my-room', {
      title: 'My Room',
      activeBookings,
      currentBooking,
      message: '',
      services: [
        { name: 'Room Cleaning', path: '/services/cleaning' },
        { name: 'Room Service', path: '/services/room-service' },
        { name: 'Laundry Service', path: '/services/laundry' },
        { name: 'Maintenance Request', path: '/services/maintenance' }
      ]
    });
  } catch (error) {
    console.error('Error in my-room route:', error);
    res.status(500).render('500');
  }
});

// My Bookings route - Fix the middleware reference
router.get('/my-bookings', protect, async (req, res) => {
  try {
    if (!req.user) {
      console.log('No user found in request');
      return res.redirect('/login');
    }
    
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room')
      .sort({ checkIn: 1 });
    
    res.render('user/my-bookings', {
      title: 'My Bookings',
      bookings: bookings || [],
      message: bookings && bookings.length > 0 ? '' : 'You have no bookings yet'
    });
  } catch (error) {
    console.error('Error in my-bookings route:', error);
    res.status(500).render('500');
  }
});

// Define the controller methods directly in the routes file since they're missing
// Profile route
router.get('/profile', protect, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }
    
    // Get recent bookings
    const recentBookings = await Booking.find({ user: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Get recent service requests if the model exists
    let recentServiceRequests = [];
    
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
});

// Edit profile page
router.get('/edit-profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }
    
    res.render('user/edit-profile', {
      title: 'Edit Profile',
      user
    });
  } catch (error) {
    console.error('Error loading edit profile page:', error);
    req.flash('error', 'Error loading edit profile page');
    res.redirect('/users/profile');
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      req.flash('error', 'User profile not found');
      return res.redirect('/users/dashboard');
    }
    
    // Update fields
    user.name = name;
    user.email = email;
    user.phone = phone || '';
    user.address = address || '';
    
    await user.save();
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (error) {
    console.error('Error updating user profile:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/users/edit-profile');
  }
});

// Change password page
router.get('/change-password', protect, (req, res) => {
  res.render('user/change-password', {
    title: 'Change Password'
  });
});

// Update password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/users/change-password');
    }
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }
    
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/users/change-password');
    }
    
    // Set new password
    user.password = newPassword;
    await user.save();
    
    req.flash('success', 'Password updated successfully');
    res.redirect('/users/profile');
  } catch (error) {
    console.error('Error changing password:', error);
    req.flash('error', 'Error changing password');
    res.redirect('/users/change-password');
  }
});

module.exports = router;