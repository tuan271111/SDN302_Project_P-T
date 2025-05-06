const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

// Home page route
router.get('/', async (req, res) => {
  try {
    // Get featured rooms for the homepage
    const featuredRooms = await Room.find({ featured: true }).limit(3);
    
    res.render('index', {
      title: 'Welcome to Hotel Management System',
      featuredRooms
    });
  } catch (error) {
    console.error('Error fetching featured rooms:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load homepage data'
    });
  }
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us'
  });
});

// Contact page route
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us'
  });
});

module.exports = router;