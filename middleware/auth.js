const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
// Make sure this is properly exported
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in cookies first (for web routes)
    if (req.cookies.token) {
      token = req.cookies.token;
    } 
    // Then check for Bearer token in Authorization header (for API routes)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, redirect to login
    if (!token) {
      console.log('No token found, redirecting to login');
      return res.redirect('/login');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('User not found with token');
        return res.redirect('/login');
      }
      
      // Set user to req object
      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.redirect('/login');
    }
  } catch (err) {
    console.error('Error in protect middleware:', err);
    return res.redirect('/login');
  }
};

// Generate JWT token and set cookie
exports.sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Set cookie with token
  res.cookie('token', token, options);
  
  return token;
};

// Set authenticated user to locals for views
exports.setAuthUser = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    try {
      // Verify token
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET || 'secretkey');

      // Find user and set to res.locals
      const user = await User.findById(decoded.id).select('-password');
      res.locals.user = user;
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
};