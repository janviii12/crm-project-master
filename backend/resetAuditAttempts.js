import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');
};

const resetAuditAttempts = async () => {
  await connectDB();

  try {
    // Reset all users' audit attempts to 0
    const result = await User.updateMany(
      {},
      {
        $set: {
          auditAttempts: 0,
          lastAuditAttempt: null
        }
      }
    );

    console.log(`Reset audit attempts for ${result.modifiedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting audit attempts:', error);
    process.exit(1);
  }
};

resetAuditAttempts();
