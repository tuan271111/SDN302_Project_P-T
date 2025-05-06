const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getLoginPage,
  getRegisterPage,
  getForgotPasswordPage,
  getResetPasswordPage
} = require('../controllers/authController');

// Auth routes - GET
router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);
router.get('/forgot-password', getForgotPasswordPage);
router.get('/reset-password/:resettoken', getResetPasswordPage);
// Logout route
// Make sure your logout route is properly defined
router.get('/logout', logout);
router.get('/logout', (req, res) => {
  // Clear the JWT cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    
    // Redirect to login page
    res.redirect('/auth/login');
  });
});

// Auth routes - POST
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resettoken', resetPassword);

module.exports = router;