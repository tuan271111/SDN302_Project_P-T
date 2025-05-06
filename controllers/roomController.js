const Room = require('../models/Room');
const Booking = require('../models/Booking');

// @desc    Get all rooms
// @route   GET /rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    // Get query parameters
    const { type, capacity, minPrice, maxPrice } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters if they exist
    if (type) query.type = type;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };
    if (minPrice && maxPrice) {
      query.price = { 
        $gte: parseInt(minPrice), 
        $lte: parseInt(maxPrice) 
      };
    } else if (minPrice) {
      query.price = { $gte: parseInt(minPrice) };
    } else if (maxPrice) {
      query.price = { $lte: parseInt(maxPrice) };
    }
    
    // Execute query
    const rooms = await Room.find(query).sort('price');
    
    // Render the rooms list view
    res.render('rooms/list', {
      title: 'Available Rooms',
      rooms,
      filters: req.query,
      search: null
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching rooms');
    res.redirect('/');
  }
};

// @desc    Search rooms by availability
// @route   GET /rooms/search
// @access  Public
exports.searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;
    
    // Build initial query
    const query = {};
    
    // Add guest capacity filter if provided
    if (guests) {
      query.capacity = { $gte: parseInt(guests) };
    }
    
    // First, find all rooms that match basic criteria
    let rooms = await Room.find(query);
    
    // If dates are provided, filter for availability
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // Only proceed if the dates are valid and logical
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate) {
        // For each room, check if there are overlapping bookings
        const availableRooms = [];
        
        for (const room of rooms) {
          // Check for bookings that overlap with the requested dates
          const conflictingBookings = await Booking.find({
            room: room._id,
            status: { $nin: ['cancelled'] },
            $or: [
              {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
              }
            ]
          });
          
          // If no conflicting bookings and room is generally available, add to available rooms
          if (conflictingBookings.length === 0 && room.isAvailable) {
            availableRooms.push(room);
          }
        }
        
        rooms = availableRooms;
      }
    }
    
    // Render the rooms list view with search results
    res.render('rooms/list', {
      title: 'Search Results',
      rooms,
      filters: null,
      search: req.query
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error searching rooms');
    res.redirect('/rooms');
  }
};

// @desc    Get single room
// @route   GET /rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      req.flash('error', 'Room not found');
      return res.redirect('/rooms');
    }
    
    res.render('rooms/details', {
      title: room.name,
      room
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching room details');
    res.redirect('/rooms');
  }
};

// @desc    Check room availability
// @route   POST /rooms/:id/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }
    
    // Find room
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if room is available
    const bookings = await Booking.find({
      room: req.params.id,
      status: { $ne: 'cancelled' },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ]
    });
    
    const isAvailable = bookings.length === 0 && room.isAvailable;
    
    res.json({
      success: true,
      isAvailable,
      message: isAvailable ? 'Room is available' : 'Room is not available for the selected dates'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability'
    });
  }
};