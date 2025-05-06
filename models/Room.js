const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a room name'],
    trim: true,
    maxlength: [100, 'Room name cannot be more than 100 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['standard', 'deluxe', 'suite', 'executive'], // Make sure 'standard' is included here
    default: 'standard'
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price per night']
  },
  capacity: {
    type: Number,
    required: [true, 'Please add room capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: ['default-room.jpg']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number'],
    unique: true
  },
  floor: {
    type: Number,
    required: [true, 'Please add a floor number']
  },
  size: {
    type: Number, // in square meters
    required: [true, 'Please add room size']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', RoomSchema);