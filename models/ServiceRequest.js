const mongoose = require('mongoose');

// Update your ServiceRequest schema to include staffNotes

// Make sure your ServiceRequest model has these fields
const serviceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  type: {
    type: String,
    enum: ['room-service', 'cleaning', 'maintenance', 'laundry'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestDetails: {
    type: Object,
    required: true
  },
  staffNotes: [{
    staffName: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);