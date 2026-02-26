import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');
};

const migratePasswords = async () => {
  await connectDB();

  // Update all users where 'password' exists to 'passwordHash'
  const result = await User.updateMany(
    { password: { $exists: true } },
    [
      {
        $set: {
          passwordHash: '$password'
        }
      },
      {
        $unset: 'password'
      }
    ]
  );

  console.log(`Migrated ${result.modifiedCount} users`);
  process.exit();
};

migratePasswords();
