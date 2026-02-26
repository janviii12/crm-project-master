import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
dotenv.config();
const connectDB = async () => {
await mongoose.connect(process.env.MONGO_URI);
console.log('DB connected');
};

const seedAdmin = async () => {
 await connectDB();
  const existingAdmin = await User.findOne({ email: 'mayank@demo.com' });
  if (existingAdmin) {
   console.log('Admin already exists');
   process.exit();
 }

  const passwordHash = await bcrypt.hash('maya123', 10);
  const admin = new User({
    email: 'mayank@demo.com',
    passwordHash,
    roles: ['admin'],
  });
  await admin.save();
  console.log(' Admin user created');
  process.exit();
};

seedAdmin();