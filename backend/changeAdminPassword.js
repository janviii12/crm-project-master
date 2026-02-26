import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');
};

const changeAdminPassword = async () => {
  await connectDB();

  const adminEmail = 'admin3@demo.com';
  const newPassword = 'Password';

  const user = await User.findOne({ email: adminEmail });
  if (!user) {
    console.log('Admin user not found');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  console.log('Admin password updated successfully');
  process.exit();
};

changeAdminPassword();
