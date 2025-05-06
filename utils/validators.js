const { check, validationResult } = require('express-validator');

// Registration validation
exports.registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

// Login validation
exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];

// Room validation
exports.roomValidation = [
  check('name', 'Room name is required').not().isEmpty(),
  check('roomNumber', 'Room number is required').not().isEmpty(),
  check('type', 'Room type is required').isIn(['single', 'double', 'twin', 'suite', 'deluxe', 'family']),
  check('price', 'Price must be a number greater than 0').isFloat({ min: 0.01 }),
  check('capacity', 'Capacity must be a number greater than 0').isInt({ min: 1 }),
  check('size', 'Size must be a number greater than 0').isFloat({ min: 0.01 }),
  check('floor', 'Floor must be a number').isInt(),
  check('description', 'Description is required').not().isEmpty(),
];

// Booking validation
exports.bookingValidation = [
  check('checkIn', 'Check-in date is required').not().isEmpty(),
  check('checkOut', 'Check-out date is required').not().isEmpty(),
  check('adults', 'Number of adults is required').isInt({ min: 1 }),
];

// Validate results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    return res.redirect('back');
  }
  
  next();
};