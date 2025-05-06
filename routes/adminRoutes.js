// Add this route to your adminRoutes.js file
router.get('/service-requests/:id', isAdmin, adminController.getServiceRequestDetails);