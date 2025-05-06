const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room'); // Added Room model
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// @desc    Get bookings for a room (for calendar)
// @route   GET /api/rooms/:roomId/bookings
// @access  Public
router.get('/rooms/:roomId/bookings', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Find all bookings for the room
    const bookings = await Booking.find({
      room: roomId,
      status: { $ne: 'cancelled' }
    }).populate('user', 'name');
    
    // Transform bookings into calendar events
    const events = bookings.map(booking => {
      // Generate a title based on admin status
      let title = isAdmin
        ? `${booking.user ? booking.user.name : 'Guest'} - ${booking.status}`
        : 'Booked';
      
      // Format the event
      return {
        id: booking._id,
        title: title,
        start: booking.checkIn,
        end: booking.checkOut,
        allDay: true,
        extendedProps: {
          status: booking.status,
          isAdmin: isAdmin
        },
        color: booking.status === 'confirmed' ? '#28a745' : 
               booking.status === 'pending' ? '#ffc107' : '#6c757d'
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching room bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    // Get current date
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get monthly booking stats
    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get booking status counts
    const bookingStatusCounts = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format the response
    res.json({
      monthlyBookings: monthlyBookings,
      bookingStatusCounts: bookingStatusCounts
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get hotel occupancy rates
// @route   GET /api/admin/occupancy
// @access  Private/Admin
router.get('/admin/occupancy', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) start.setDate(start.getDate() - 30);
    
    // Get all rooms count
    const totalRooms = await Room.countDocuments();
    
    // Calculate occupancy for each day in the range
    const days = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Find bookings that include this day
      const activeBookings = await Booking.countDocuments({
        status: { $nin: ['cancelled'] },
        checkIn: { $lte: dayEnd },
        checkOut: { $gte: dayStart }
      });
      
      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? (activeBookings / totalRooms) * 100 : 0;
      
      days.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
        bookedRooms: activeBookings,
        totalRooms
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      data: days
    });
  } catch (error) {
    console.error('Error calculating occupancy rates:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating occupancy rates'
    });
  }
});

module.exports = router;
