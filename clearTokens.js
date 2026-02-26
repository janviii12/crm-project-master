const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User.js');
const connectDB = require('./backend/config/db.js');

dotenv.config();
connectDB();

const clearTokens = async () => {
  try {
    const result = await User.updateOne(
      { email: 'admin1@demo.com' },
      { $set: { refreshTokens: [] } }
    );
    console.log('Tokens cleared successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    process.exit(1);
  }
};

clearTokens();
