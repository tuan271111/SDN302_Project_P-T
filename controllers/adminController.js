const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// @desc    Admin dashboard
// @route   GET /admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const roomCount = await Room.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const activeBookingCount = await Booking.countDocuments({ 
      status: { $in: ['pending', 'confirmed'] } 
    });
    
    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('room', 'name roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        users: userCount,
        rooms: roomCount,
        bookings: bookingCount,
        activeBookings: activeBookingCount
      },
      recentBookings
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/');
  }
};

// @desc    Get all rooms (admin view)
// @route   GET /admin/rooms
// @access  Private/Admin
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort('roomNumber');
    
    res.render('admin/rooms', {
      title: 'Manage Rooms',
      rooms
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching rooms');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Get room create/edit form
// @route   GET /admin/rooms/form
// @route   GET /admin/rooms/form/:id
// @access  Private/Admin
exports.getRoomForm = async (req, res) => {
  try {
    let room = null;
    let title = 'Add New Room';
    
    if (req.params.id) {
      room = await Room.findById(req.params.id);
      
      if (!room) {
        req.flash('error', 'Room not found');
        return res.redirect('/admin/rooms');
      }
      
      title = 'Edit Room';
    }
    
    res.render('admin/room-form', {
      title,
      room
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading room form');
    res.redirect('/admin/rooms');
  }
};

// @desc    Create room
// @route   POST /admin/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const {
      name,
      roomNumber,
      type,
      price,
      capacity,
      size,
      floor,
      description,
      amenities,
      isAvailable
    } = req.body;
    
    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    
    if (existingRoom) {
      req.flash('error', 'Room number already exists');
      return res.redirect('/admin/rooms/form');
    }
    
    // Create room
    await Room.create({
      name,
      roomNumber,
      type,
      price,
      capacity,
      size,
      floor,
      description,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : [],
      isAvailable: isAvailable === 'on'
    });
    
    req.flash('success', 'Room created successfully');
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error creating room');
    res.redirect('/admin/rooms/form');
  }
};

// @desc    Update room
// @route   PUT /admin/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const {
      name,
      roomNumber,
      type,
      price,
      capacity,
      size,
      floor,
      description,
      amenities,
      isAvailable
    } = req.body;
    
    // Check if room exists
    let room = await Room.findById(req.params.id);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/admin/rooms');
    }
    
    // Check if room number is already used by another room
    if (roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber });
      
      if (existingRoom && existingRoom._id.toString() !== req.params.id) {
        req.flash('error', 'Room number already exists');
        return res.redirect(`/admin/rooms/form/${req.params.id}`);
      }
    }
    
    // Update room
    room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        name,
        roomNumber,
        type,
        price,
        capacity,
        size,
        floor,
        description,
        amenities: amenities ? amenities.split(',').map(a => a.trim()) : [],
        isAvailable: isAvailable === 'on'
      },
      { new: true, runValidators: true }
    );
    
    req.flash('success', 'Room updated successfully');
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating room');
    res.redirect(`/admin/rooms/form/${req.params.id}`);
  }
};

// @desc    Delete room
// @route   DELETE /admin/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/admin/rooms');
    }
    
    // Check if room has active bookings
    const activeBookings = await Booking.countDocuments({
      room: req.params.id,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (activeBookings > 0) {
      req.flash('error', 'Cannot delete room with active bookings');
      return res.redirect('/admin/rooms');
    }
    
    // Update any completed or cancelled bookings to remove the room reference
    await Booking.updateMany(
      { 
        room: req.params.id,
        status: { $in: ['completed', 'cancelled'] }
      },
      { $set: { room: null } }
    );
    
    // Now delete the room
    await room.deleteOne();
    
    req.flash('success', 'Room deleted successfully');
    return res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error deleting room:', error);
    req.flash('error', 'Error deleting room');
    return res.redirect('/admin/rooms');
  }
};

// @desc    Get all users (admin view)
// @route   GET /admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort('name');
    
    res.render('admin/users', {
      title: 'Manage Users',
      users
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching users');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Get all bookings (admin view)
// @route   GET /admin/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('room', 'name roomNumber')
      .sort({ createdAt: -1 });
    
    res.render('admin/bookings', {
      title: 'Manage Bookings',
      bookings,
      currentStatus: status || 'all'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching bookings');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Update booking status
// @route   PUT /admin/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      req.flash('error', 'Invalid status');
      return res.redirect('/admin/bookings');
    }
    
    // Find booking
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/admin/bookings');
    }
    
    // Update status
    booking.status = status;
    await booking.save();
    
    req.flash('success', 'Booking status updated successfully');
    res.redirect('/admin/bookings');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating booking status');
    res.redirect('/admin/bookings');
  }
};

// Add or update this function in your adminController.js

// Get all service requests
exports.getServiceRequests = async (req, res) => {
  try {
    // Fetch all service requests with populated user and room data
    const serviceRequests = await ServiceRequest.find()
      .populate('user', 'name email')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    
    res.render('admin/service-requests', {
      title: 'Service Requests',
      path: '/admin/service-requests',
      serviceRequests
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    req.flash('error', 'Failed to fetch service requests');
    res.redirect('/admin/dashboard');
  }
};

// Get service request details
exports.getServiceRequestDetails = async (req, res) => {
  try {
    const serviceRequestId = req.params.id;
    
    // Find the service request with populated user and room data
    const serviceRequest = await ServiceRequest.findById(serviceRequestId)
      .populate('user', 'name email')
      .populate({
        path: 'room',
        populate: {
          path: 'currentBooking',
          model: 'Booking'
        }
      });
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/service-requests');
    }
    
    // Format dates with moment
    const moment = require('moment');
    
    res.render('admin/service-request-detail', {
      title: 'Service Request Details',
      path: '/admin/service-requests',
      serviceRequest,
      moment
    });
  } catch (error) {
    console.error('Error fetching service request details:', error);
    req.flash('error', 'Failed to fetch service request details');
    res.redirect('/admin/service-requests');
  }
};

// Add this function to your adminController.js

// Update service request status
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { requestId, status, staffNote } = req.body;
    
    // Find the service request
    const serviceRequest = await ServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/service-requests');
    }
    
    // Update status
    serviceRequest.status = status;
    
    // If status is completed, set completedAt
    if (status === 'completed' && !serviceRequest.completedAt) {
      serviceRequest.completedAt = new Date();
    }
    
    // Add staff note if provided
    if (staffNote && staffNote.trim() !== '') {
      serviceRequest.staffNotes.push({
        staffName: req.user.name || 'Admin',
        text: staffNote
      });
    }
    
    // Update the updatedAt field
    serviceRequest.updatedAt = new Date();
    
    await serviceRequest.save();
    
    req.flash('success', 'Service request status updated successfully');
    res.redirect(`/admin/service-requests/${requestId}`);
  } catch (error) {
    console.error('Error updating service request status:', error);
    req.flash('error', 'Failed to update service request status');
    res.redirect('/admin/service-requests');
  }
};