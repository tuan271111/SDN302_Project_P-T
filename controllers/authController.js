const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

// @desc    Register user
// @route   POST /register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register');  // Updated path
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    // Generate token and log the user in
    sendTokenResponse(user, 200, res);
    
    req.flash('success', 'Registration successful!');
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error during registration');
    return res.redirect('/auth/register');  // Updated path
  }
};

// @desc    Login user
// @route   POST /login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      req.flash('error', 'Please provide an email and password');
      return res.redirect('/auth/login');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    // Create token
    const token = user.getSignedJwtToken();

    // Set cookie options
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // Set secure flag in production
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Set the JWT token in a cookie
    res.cookie('token', token, options);

    // Set user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Redirect to dashboard or home page
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login failed');
    return res.redirect('/auth/login');
  }
};

// @desc    Logout user
// @route   GET /auth/logout
// @access  Private
exports.logout = (req, res) => {
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
};

// @desc    Forgot password
// @route   POST /forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash('error', 'There is no user with that email');
      return res.redirect('/forgot-password');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });

      req.flash('success', 'Email sent');
      return res.redirect('/auth/login');  // Updated path
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      req.flash('error', 'Email could not be sent');
      return res.redirect('/forgot-password');
    }
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    return res.redirect('/auth/forgot-password');  // Updated path
  }
};

// @desc    Reset password
// @route   PUT /reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Invalid or expired token');
      return res.redirect('/auth/forgot-password');  // Updated path
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    req.flash('success', 'Password updated successfully');
    return res.redirect('/auth/login');  // Updated path
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    return res.redirect('/reset-password/' + req.params.resettoken);  // Updated path
  }
};

// @desc    Get login page
// @route   GET /login
// @access  Public
exports.getLoginPage = (req, res) => {
  res.render('auth/login', {
    title: 'Login'
  });
};

// @desc    Get register page
// @route   GET /register
// @access  Public
exports.getRegisterPage = (req, res) => {
  res.render('auth/register', {
    title: 'Register'
  });
};

// @desc    Get forgot password page
// @route   GET /forgot-password
// @access  Public
exports.getForgotPasswordPage = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password'
  });
};

// @desc    Get reset password page
// @route   GET /reset-password/:resettoken
// @access  Public
exports.getResetPasswordPage = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Invalid or expired token');
      return res.redirect('/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Reset Password',
      token: req.params.resettoken
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    return res.redirect('/forgot-password');
  }
};