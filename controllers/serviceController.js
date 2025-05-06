const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');

// @desc    Get available services
// @route   GET /services
// @access  Private
exports.getServices = async (req, res) => {
  try {
    // This would typically come from a Service model, but we're using the hardcoded list for now
    const services = {
      housekeeping: [
        { name: 'Housekeeping', description: 'Room cleaning, bed making, and fresh towels', estimatedTime: 30 },
        { name: 'Towel Replacement', description: 'Fresh towel delivery to your room', estimatedTime: 15 },
        { name: 'Bed Making', description: 'Fresh sheets and bed making service', estimatedTime: 20 }
      ],
      maintenance: [
        { name: 'AC Repair', description: 'Air conditioning system check and repair', estimatedTime: 45 },
        { name: 'Plumbing Issue', description: 'Bathroom plumbing repairs', estimatedTime: 60 },
        { name: 'TV/Electronics', description: 'Television or electronic equipment troubleshooting', estimatedTime: 30 },
        { name: 'Furniture Repair', description: 'Repair for damaged or broken furniture', estimatedTime: 40 }
      ]
    };
    
    res.render('services/list', {
      title: 'Available Services',
      services
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching services');
    res.redirect('/bookings');
  }
};

// @desc    Get service request form
// @route   GET /services/request/:bookingId
// @access  Private
exports.getServiceRequestForm = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('room')
      .populate('user');
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings');
    }
    
    // Check if booking belongs to current user or user is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized');
      return res.redirect('/bookings');
    }
    
    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      req.flash('error', 'Services can only be requested for confirmed bookings');
      return res.redirect('/bookings');
    }
    
    // This would typically come from a Service model, but we're using the hardcoded list for now
    const services = {
      housekeeping: [
        { name: 'Housekeeping', description: 'Room cleaning, bed making, and fresh towels', estimatedTime: 30 },
        { name: 'Towel Replacement', description: 'Fresh towel delivery to your room', estimatedTime: 15 },
        { name: 'Bed Making', description: 'Fresh sheets and bed making service', estimatedTime: 20 }
      ],
      maintenance: [
        { name: 'AC Repair', description: 'Air conditioning system check and repair', estimatedTime: 45 },
        { name: 'Plumbing Issue', description: 'Bathroom plumbing repairs', estimatedTime: 60 },
        { name: 'TV/Electronics', description: 'Television or electronic equipment troubleshooting', estimatedTime: 30 },
        { name: 'Furniture Repair', description: 'Repair for damaged or broken furniture', estimatedTime: 40 }
      ]
    };
    
    // Check for pre-selected service type and name from query params
    const preSelectedType = req.query.type;
    const preSelectedService = req.query.service;
    
    res.render('services/request-form', {
      title: 'Request Service',
      booking,
      services,
      preSelectedType,
      preSelectedService
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading service request form');
    res.redirect('/bookings');
  }
};

// @desc    Create service request
// @route   POST /services/request/:bookingId
// @access  Private
exports.createServiceRequest = async (req, res) => {
  try {
    const { serviceType, serviceName, description, additionalNotes, requestedFor } = req.body;
    
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/bookings');
    }
    
    // Check if booking belongs to current user or user is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized');
      return res.redirect('/bookings');
    }
    
    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      req.flash('error', 'Services can only be requested for confirmed bookings');
      return res.redirect('/bookings');
    }
    
    // Create service request
    await ServiceRequest.create({
      booking: booking._id,
      user: req.user.id,
      room: booking.room,
      serviceType,
      serviceName,
      description,
      additionalNotes,
      requestedFor: new Date(requestedFor)
    });
    
    req.flash('success', 'Service request submitted successfully');
    res.redirect('/bookings');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error creating service request');
    res.redirect(`/services/request/${req.params.bookingId}`);
  }
};

// @desc    Get user's service requests
// @route   GET /services/my-requests
// @access  Private
exports.getUserServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({ user: req.user.id })
      .populate('booking')
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('services/my-requests', {
      title: 'My Service Requests',
      serviceRequests
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching service requests');
    res.redirect('/bookings');
  }
};

// @desc    Get all service requests (admin)
// @route   GET /admin/services
// @access  Private/Admin
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.serviceType = type;
    }
    
    const serviceRequests = await ServiceRequest.find(query)
      .populate('booking')
      .populate('room')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.render('admin/services', {
      title: 'Manage Service Requests',
      serviceRequests,
      currentStatus: status || 'all',
      currentType: type || 'all'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching service requests');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Update service request status
// @route   PUT /admin/services/:id/status
// @access  Private/Admin
exports.updateServiceStatus = async (req, res) => {
  try {
    const { status, staffNotes } = req.body;
    
    // Validate status
    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      req.flash('error', 'Invalid status');
      return res.redirect('/admin/services');
    }
    
    // Find service request
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/admin/services');
    }
    
    // Update status
    serviceRequest.status = status;
    
    // Add staff notes if provided
    if (staffNotes) {
      serviceRequest.staffNotes = staffNotes;
    }
    
    // Set completedAt if status is completed
    if (status === 'completed') {
      serviceRequest.completedAt = Date.now();
    }
    
    await serviceRequest.save();
    
    req.flash('success', 'Service request status updated successfully');
    res.redirect('/admin/services');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating service request status');
    res.redirect('/admin/services');
  }
};