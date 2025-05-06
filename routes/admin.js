const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    req.flash('error', 'Not authorized to access this resource');
    res.redirect('/');
  }
};

// Service Requests Management
router.get('/service-requests', protect, adminMiddleware, async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({})
      // Remove the .populate('booking') line since it doesn't exist in your schema
      .populate('user', 'name email')
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('admin/service-requests', {
      title: 'Service Requests',
      serviceRequests,
      path: '/admin/service-requests'
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    req.flash('error', 'Failed to fetch service requests');
    res.redirect('/admin/dashboard');
  }
});

// View Service Request Details
router.get('/service-requests/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room');
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/service-requests');
    }
    
    // Log the request details to see what's available
    console.log('Service Request Details:', {
      type: serviceRequest.type,
      requestDetails: serviceRequest.requestDetails
    });
    
    // Add moment for date formatting
    const moment = require('moment');
    
    res.render('admin/service-request-detail', {
      title: 'Service Request Details',
      serviceRequest,
      path: '/admin/service-requests',
      moment
    });
  } catch (error) {
    console.error('Error fetching service request details:', error);
    req.flash('error', 'Failed to fetch service request details');
    res.redirect('/admin/service-requests');
  }
});

// Update Service Request Status
router.post('/service-requests/:id/update-status', protect, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/service-requests');
    }
    
    serviceRequest.status = status;
    
    if (status === 'completed') {
      serviceRequest.completedAt = Date.now();
    }
    
    await serviceRequest.save();
    
    req.flash('success', 'Service request status updated successfully');
    res.redirect(`/admin/service-requests/${req.params.id}`);
  } catch (error) {
    console.error('Error updating service request status:', error);
    req.flash('error', 'Failed to update service request status');
    res.redirect('/admin/service-requests');
  }
});

// Dashboard
// Dashboard route
router.get('/dashboard', protect, adminMiddleware, async (req, res) => {
  try {
    // Get counts for dashboard
    const roomCount = await Room.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const userCount = await User.countDocuments();
    const pendingServiceCount = await ServiceRequest.countDocuments({ status: 'pending' });
    const totalServiceCount = await ServiceRequest.countDocuments();
    const completedServiceCount = await ServiceRequest.countDocuments({ status: 'completed' });
    
    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('room', 'name roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent service requests
    const recentServiceRequests = await ServiceRequest.find()
      .populate('user', 'name')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // For debugging
    console.log('Service Stats:', {
      total: totalServiceCount,
      pending: pendingServiceCount,
      completed: completedServiceCount
    });
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      path: '/admin/dashboard',
      stats: {
        rooms: roomCount,
        bookings: bookingCount,
        users: userCount,
        pendingServices: pendingServiceCount,
        totalServices: totalServiceCount,
        completedServices: completedServiceCount
      },
      recentBookings,
      recentServiceRequests
    });
  } catch (error) {
    console.error('Error in admin dashboard:', error);
    req.flash('error', 'Failed to load dashboard data');
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});

// Example for the rooms route
router.get('/rooms', protect, adminMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    
    res.render('admin/rooms', {
      title: 'Manage Rooms',
      rooms,
      path: '/admin/rooms',  // Make sure this is included
      messages: req.flash() // Add this line to pass flash messages to the template
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    req.flash('error', 'Failed to fetch rooms');
    res.redirect('/admin/dashboard');
  }
});

// Add these routes for users, bookings, and other admin functions
router.get('/users', protect, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('admin/users', {
      title: 'Manage Users',
      users,
      path: '/admin/users'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    req.flash('error', 'Failed to fetch users');
    res.redirect('/admin/dashboard');
  }
});

// Bookings route
router.get('/bookings', protect, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('admin/bookings', {
      title: 'Manage Bookings',
      bookings,
      path: '/admin/bookings',
      currentStatus: status || 'all'  // Add this line to pass currentStatus
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    req.flash('error', 'Failed to fetch bookings');
    res.redirect('/admin/dashboard');
  }
});

// Add room form route
router.get('/rooms/form', protect, adminMiddleware, (req, res) => {
  res.render('admin/room-form', {
    title: 'Add New Room',
    room: {},
    path: '/admin/rooms'
  });
});

// Edit room form route
router.get('/rooms/form/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/admin/rooms');
    }
    
    res.render('admin/room-form', {
      title: 'Edit Room',
      room,
      path: '/admin/rooms'
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    req.flash('error', 'Failed to fetch room');
    res.redirect('/admin/rooms');
  }
});
// Make user an admin
router.get('/users/:id/make-admin', protect, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    req.flash('success', `${user.name} has been made an admin`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error making user admin:', error);
    req.flash('error', 'Failed to update user role');
    res.redirect('/admin/users');
  }
});
// View user details
router.get('/users/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Get user's bookings
    const bookings = await Booking.find({ user: req.params.id })
      .populate('room')
      .sort({ createdAt: -1 });
    
    // Get user's service requests
    const serviceRequests = await ServiceRequest.find({ user: req.params.id })
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('admin/user-detail', {
      title: 'User Details',
      user,
      bookings,
      serviceRequests,
      path: '/admin/users'
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    req.flash('error', 'Failed to fetch user details');
    res.redirect('/admin/users');
  }
});

// View booking details
router.get('/bookings/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room');
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/admin/bookings');
    }
    
    res.render('admin/booking-detail', {
      title: 'Booking Details',
      booking,
      path: '/admin/bookings'
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    req.flash('error', 'Failed to fetch booking details');
    res.redirect('/admin/bookings');
  }
});

// Update booking status
router.post('/bookings/:id/update-status', protect, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/admin/bookings');
    }
    
    booking.status = status;
    await booking.save();
    
    req.flash('success', 'Booking status updated successfully');
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (error) {
    console.error('Error updating booking status:', error);
    req.flash('error', 'Failed to update booking status');
    res.redirect('/admin/bookings');
  }
});
// Add staff note to service request
router.post('/service-requests/:id/add-note', protect, adminMiddleware, async (req, res) => {
  try {
    const { staffNote } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/service-requests');
    }
    
    // Add the new note
    serviceRequest.staffNotes.push({
      staffName: req.user.name,
      staffId: req.user._id,
      text: staffNote,
      createdAt: Date.now()
    });
    
    await serviceRequest.save();
    
    req.flash('success', 'Note added successfully');
    res.redirect(`/admin/service-requests/${req.params.id}`);
  } catch (error) {
    console.error('Error adding staff note:', error);
    req.flash('error', 'Failed to add note');
    res.redirect(`/admin/service-requests/${req.params.id}`);
  }
});

// View admin profile
router.get('/profile', protect, adminMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      req.flash('error', 'Admin profile not found');
      return res.redirect('/admin/dashboard');
    }
    
    res.render('admin/profile', {
      title: 'Admin Profile',
      admin,
      path: '/admin/profile'
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    req.flash('error', 'Failed to fetch admin profile');
    res.redirect('/admin/dashboard');
  }
});

// Edit admin profile form
router.get('/profile/edit', protect, adminMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      req.flash('error', 'Admin profile not found');
      return res.redirect('/admin/dashboard');
    }
    
    res.render('admin/edit-profile', {
      title: 'Edit Admin Profile',
      admin,
      path: '/admin/profile'
    });
  } catch (error) {
    console.error('Error fetching admin profile for editing:', error);
    req.flash('error', 'Failed to fetch admin profile');
    res.redirect('/admin/profile');
  }
});

// Update admin profile
router.post('/profile/update', protect, adminMiddleware, async (req, res) => {
  console.log('Profile update route hit!');
  try {
    const { name, email, phone, address } = req.body;
    
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      req.flash('error', 'Admin profile not found');
      return res.redirect('/admin/dashboard');
    }
    
    // Update fields
    admin.name = name;
    admin.email = email;
    admin.phone = phone || '';
    admin.address = address || '';
    
    await admin.save();
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error updating admin profile:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/admin/profile/edit');
  }
});

// Change admin password form
router.get('/profile/change-password', protect, adminMiddleware, (req, res) => {
  res.render('admin/change-password', {
    title: 'Change Password',
    path: '/admin/profile'
  });
});

// Update admin password
router.post('/profile/update-password', protect, adminMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/admin/profile/change-password');
    }
    
    // Get user with password
    const admin = await User.findById(req.user._id).select('+password');
    
    if (!admin) {
      req.flash('error', 'Admin not found');
      return res.redirect('/admin/dashboard');
    }
    
    // Check if current password is correct
    const isMatch = await admin.matchPassword(currentPassword);
    
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/admin/profile/change-password');
    }
    
    // Set new password
    admin.password = newPassword;
    await admin.save();
    
    req.flash('success', 'Password updated successfully');
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error updating password:', error);
    req.flash('error', 'Failed to update password');
    res.redirect('/admin/profile/change-password');
  }
});

module.exports = router;

// Add Room
router.post('/rooms/add', protect, adminMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      roomNumber, 
      type, 
      price, 
      maxOccupancy,
      capacity,
      size,
      floor,
      description, 
      amenities,
      images 
    } = req.body;
    
    // Create amenities array from form data
    const amenitiesArray = amenities ? 
      (Array.isArray(amenities) ? amenities : [amenities]) : 
      [];
    
    // Create images array from form data
    const imagesArray = images ? 
      (images.split('\n').filter(url => url.trim() !== '')) : 
      [];
    
    const newRoom = new Room({
      name,
      roomNumber,
      type,
      price,
      maxOccupancy,
      capacity,
      size,
      floor,
      description,
      amenities: amenitiesArray,
      images: imagesArray
    });
    
    await newRoom.save();
    
    req.flash('success', 'Room added successfully');
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error adding room:', error);
    req.flash('error', 'Failed to add room: ' + error.message);
    res.redirect('/admin/rooms/form');
  }
});

// Update Room
router.post('/rooms/update/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      roomNumber, 
      type, 
      price, 
      maxOccupancy,
      capacity,
      size,
      floor,
      description, 
      amenities,
      images,
      isAvailable 
    } = req.body;
    
    // Create amenities array from form data
    const amenitiesArray = amenities ? 
      (Array.isArray(amenities) ? amenities : [amenities]) : 
      [];
    
    // Create images array from form data
    const imagesArray = images ? 
      (images.split('\n').filter(url => url.trim() !== '')) : 
      [];
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/admin/rooms');
    }
    
    room.name = name;
    room.roomNumber = roomNumber;
    room.type = type;
    room.price = price;
    room.maxOccupancy = maxOccupancy;
    room.capacity = capacity;
    room.size = size;
    room.floor = floor;
    room.description = description;
    room.amenities = amenitiesArray;
    room.images = imagesArray;
    room.isAvailable = isAvailable === 'true';
    
    await room.save();
    
    req.flash('success', 'Room updated successfully');
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error updating room:', error);
    req.flash('error', 'Failed to update room: ' + error.message);
    res.redirect(`/admin/rooms/form/${req.params.id}`);
  }
});

// Make sure this route is defined before the module.exports statement
// Delete Room route
// Add this debugging route to test if the admin routes are working
router.get('/test-route', (req, res) => {
  console.log('Admin test route accessed');
  res.send('Admin router is working');
});

// Add debugging to the delete route
router.post('/rooms/delete/:id', protect, adminMiddleware, async (req, res) => {
  console.log('Delete room route accessed for ID:', req.params.id);
  try {
    const roomId = req.params.id;
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      req.flash('error', 'Room not found');
      return res.redirect('/admin/rooms');
    }
    
    console.log('Found room:', room.roomNumber, room.name);
    
    // Rest of the delete logic...
    
    // Check if room has active bookings
    const activeBookings = await Booking.find({
      room: roomId,
      status: { $in: ['confirmed', 'checked-in'] }
    });
    
    if (activeBookings.length > 0) {
      req.flash('error', `Cannot delete room ${room.roomNumber} - ${room.name} because it has active bookings`);
      return res.redirect('/admin/rooms');
    }
    
    // Delete the room
    await Room.findByIdAndDelete(roomId);
    
    req.flash('success', `Room ${room.roomNumber} - ${room.name} has been deleted successfully`);
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error deleting room:', error);
    req.flash('error', 'Failed to delete room');
    res.redirect('/admin/rooms');
  }
});

// Make sure module.exports is at the very end of the file
module.exports = router;