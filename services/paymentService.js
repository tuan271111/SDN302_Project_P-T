// Demo VNPay payment service - for simulation only

const createDemoPaymentUrl = (bookingId, amount) => {
  // In a real implementation, this would create a VNPay payment URL
  // For demo purposes, we'll create a local URL that simulates the payment process
  
  // Convert amount to VND (for demo purposes)
  const amountInVND = Math.round(amount * 23000);
  
  // Create a demo payment URL with booking details as query parameters
  return `/payment/demo-payment?bookingId=${bookingId}&amount=${amountInVND}&ref=${Date.now()}`;
};

// Simulate payment verification
const verifyDemoPayment = (params) => {
  // In a real implementation, this would verify the payment signature
  // For demo purposes, we'll always return true
  return true;
};

module.exports = {
  createDemoPaymentUrl,
  verifyDemoPayment
};