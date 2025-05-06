const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { setAuthUser } = require('./middleware/auth');
// Near the top of your app.js file, before any other imports
require('dotenv').config();

// Connect to database
connectDB();

// Import routes
const indexRouter = require('./routes/index');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const servicesRouter = require('./routes/services');
const apiRouter = require('./routes/api');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Method override
app.use(methodOverride('_method'));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard_cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
  })
);

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.errors = req.flash('errors');
  next();
});

// Set authenticated user in res.locals
app.use(setAuthUser);

// Test route
app.get('/test-route', (req, res) => {
  console.log('Test route accessed');
  res.send('Test route in app.js is working');
});

// Mount routes
app.use('/', indexRouter);
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes); // Keep only this one
app.use('/services', servicesRouter);
// app.use('/payment', paymentRouter); // Remove this duplicate route
app.use('/api', apiRouter);

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Welcome to Luxury Hotel'
  });
});

// 404 page
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Find the section where you set up the server port (around line 120)
const PORT = process.env.PORT || 5010; // Change from 5009 to 5010

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
});

// REMOVE THESE DUPLICATE DECLARATIONS AND MIDDLEWARE SETUP
// const session = require('express-session');
// const flash = require('connect-flash');
// app.use(session({
//   secret: 'your_secret_key',
//   resave: false,
//   saveUninitialized: false
// }));
// app.use(flash());