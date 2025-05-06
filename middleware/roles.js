// Admin role middleware
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      req.flash('error', 'Access denied. Admin privileges required.');
      res.redirect('/');
    }
  };
  
  // User role middleware
  exports.user = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
      next();
    } else {
      req.flash('error', 'Access denied. User privileges required.');
      res.redirect('/');
    }
  };