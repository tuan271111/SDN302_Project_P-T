const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Read JSON file
const data = JSON.parse(fs.readFileSync(`${__dirname}/../data/seed-data.json`, 'utf-8'));

// Import into DB
const importData = async () => {
  try {
    // Check if users already exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    const userExists = await User.findOne({ email: 'user@example.com' });
    
    // Import users if they don't exist
    if (!adminExists) {
      const admin = new User(data.users[0]);
      // Hash password manually since we're bypassing the pre-save hook
      admin.password = await bcrypt.hash(admin.password, 10);
      await admin.save();
      console.log('Admin user imported');
    }
    
    if (!userExists) {
      const user = new User(data.users[1]);
      // Hash password manually since we're bypassing the pre-save hook
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      console.log('Regular user imported');
    }
    
    // Check if rooms exist
    const roomCount = await Room.countDocuments();
    
    if (roomCount === 0) {
      await Room.insertMany(data.rooms);
      console.log('Rooms imported');
    }
    
    console.log('Data import completed');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Room.deleteMany();
    await User.deleteMany();
    
    console.log('Data destroyed');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line args
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i to import or -d to delete data');
  process.exit();
}