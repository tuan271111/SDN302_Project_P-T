const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const ServiceRequest = require('../models/ServiceRequest');

// Room Cleaning Service
router.get('/cleaning', protect, async (req, res) => {
  try {
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: 'confirmed',
      checkOut: { $gte: new Date() }
    }).populate('room');
    
    res.render('services/cleaning', {
      title: 'Room Cleaning Service',
      activeBookings: activeBookings || [],
      message: activeBookings && activeBookings.length > 0 ? '' : 'You have no active bookings'
    });
  } catch (error) {
    console.error('Error in cleaning service route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});

// Room Service (Food & Beverage)
router.get('/room-service', protect, async (req, res) => {
  try {
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: 'confirmed',
      checkOut: { $gte: new Date() }
    }).populate('room');
    
    res.render('services/room-service', {
      title: 'Room Service',
      activeBookings: activeBookings || [],
      message: activeBookings && activeBookings.length > 0 ? '' : 'You have no active bookings',
      menuItems: [
        { name: 'Continental Breakfast', price: 15, description: 'Assorted pastries, fresh fruit, yogurt, and coffee or tea' },
        { name: 'American Breakfast', price: 18, description: 'Eggs, bacon, toast, hash browns, and coffee or tea' },
        { name: 'Club Sandwich', price: 14, description: 'Triple-decker sandwich with turkey, bacon, lettuce, and tomato' },
        { name: 'Caesar Salad', price: 12, description: 'Romaine lettuce, croutons, parmesan cheese with Caesar dressing' },
        { name: 'Pasta Primavera', price: 16, description: 'Pasta with seasonal vegetables in a light cream sauce' },
        { name: 'New York Steak', price: 28, description: '8oz steak with mashed potatoes and seasonal vegetables' }
      ]
    });
  } catch (error) {
    console.error('Error in room service route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});

// Laundry Service
router.get('/laundry', protect, async (req, res) => {
  try {
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: 'confirmed',
      checkOut: { $gte: new Date() }
    }).populate('room');
    
    res.render('services/laundry', {
      title: 'Laundry Service',
      activeBookings: activeBookings || [],
      message: activeBookings && activeBookings.length > 0 ? '' : 'You have no active bookings',
      services: [
        { name: 'Wash & Fold', price: 25, description: 'Per load, returned same day if requested before 10am' },
        { name: 'Dry Cleaning', price: 15, description: 'Per item, returned next day' },
        { name: 'Pressing', price: 10, description: 'Per item, returned same day' },
        { name: 'Express Service', price: 40, description: 'Per load, returned within 4 hours' }
      ]
    });
  } catch (error) {
    console.error('Error in laundry service route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});

// Maintenance Request
router.get('/maintenance', protect, async (req, res) => {
  try {
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: 'confirmed',
      checkOut: { $gte: new Date() }
    }).populate('room');
    
    res.render('services/maintenance', {
      title: 'Maintenance Request',
      activeBookings: activeBookings || [],
      message: activeBookings && activeBookings.length > 0 ? '' : 'You have no active bookings',
      issues: [
        { name: 'Plumbing Issue', description: 'Report problems with toilet, sink, shower, etc.' },
        { name: 'Electrical Issue', description: 'Report problems with lights, outlets, TV, etc.' },
        { name: 'HVAC Issue', description: 'Report problems with heating, air conditioning, etc.' },
        { name: 'Furniture Issue', description: 'Report problems with bed, chairs, desk, etc.' },
        { name: 'Other Issue', description: 'Report any other maintenance issues' }
      ]
    });
  } catch (error) {
    console.error('Error in maintenance service route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: error.message
    });
  }
});

// Process service requests
router.post('/:service', protect, async (req, res) => {
  try {
    const { service } = req.params;
    const { bookingId, notes, time, items, issueType, urgency } = req.body;
    
    // Find the booking to get room information
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect(`/services/${service}`);
    }
    
    // Create service request
    const serviceRequest = new ServiceRequest({
      type: service,
      booking: bookingId,
      user: req.user._id,
      room: booking.room,
      requestDetails: {
        time,
        notes,
        items: items ? JSON.parse(JSON.stringify(items)) : [],
        issueType,
        urgency
      }
    });
    
    await serviceRequest.save();
    
    req.flash('success', `Your ${service.replace('-', ' ')} request has been submitted successfully`);
    res.redirect('/users/my-room');
  } catch (error) {
    console.error(`Error in ${req.params.service} service request:`, error);
    req.flash('error', 'Failed to submit service request');
    res.redirect(`/services/${req.params.service}`);
  }
});

// Add or update the service history routes in your services.js file

// User service history
router.get('/history', protect, async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({ user: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 });
    
    res.render('user/service-history', {
      title: 'My Service History',
      serviceRequests,
      moment: require('moment') // Add moment for date formatting
    });
  } catch (error) {
    console.error('Error fetching service history:', error);
    req.flash('error', 'Failed to fetch service history');
    res.redirect('/users/my-room');
  }
});

// User service request detail
router.get('/history/:id', protect, async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('room')
      .populate('user');
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/services/history');
    }
    
    // Check if the service request belongs to the current user
    if (serviceRequest.user._id.toString() !== req.user._id.toString()) {
      req.flash('error', 'Not authorized to view this service request');
      return res.redirect('/services/history');
    }
    
    res.render('user/service-detail', {
      title: 'Service Request Details',
      serviceRequest,
      moment: require('moment')
    });
  } catch (error) {
    console.error('Error fetching service request details:', error);
    req.flash('error', 'Failed to fetch service request details');
    res.redirect('/services/history');
  }
});

// Add this route to handle canceling service requests
router.put('/cancel/:id', protect, async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      req.flash('error', 'Service request not found');
      return res.redirect('/services/history');
    }
    
    // Check if the service request belongs to the current user
    if (serviceRequest.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Not authorized to cancel this service request');
      return res.redirect('/services/history');
    }
    
    // Check if the service request is still pending
    if (serviceRequest.status !== 'pending') {
      req.flash('error', 'Only pending service requests can be canceled');
      return res.redirect(`/services/history/${req.params.id}`);
    }
    
    // Update the status to canceled
    serviceRequest.status = 'canceled';
    await serviceRequest.save();
    
    req.flash('success', 'Service request canceled successfully');
    res.redirect('/services/history');
  } catch (error) {
    console.error('Error canceling service request:', error);
    req.flash('error', 'Failed to cancel service request');
    res.redirect(`/services/history/${req.params.id}`);
  }
});

module.exports = router;