const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoom,
  checkAvailability,
  searchRooms
} = require('../controllers/roomController');

// Get all rooms
router.get('/', getRooms);

// Search rooms
router.get('/search', searchRooms);

// Get single room
router.get('/:id', getRoom);

// Check room availability
router.post('/:id/check-availability', checkAvailability);

module.exports = router;