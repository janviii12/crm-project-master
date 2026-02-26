import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import AdminSettings from './models/AdminSettings.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');
};

const changeAuditPassword = async () => {
  await connectDB();

  const newPassword = 'Admin123';

  const adminSettings = await AdminSettings.findOne();
  if (!adminSettings) {
    console.log('AdminSettings not found');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  adminSettings.auditPassword = passwordHash;
  adminSettings.updatedAt = new Date();
  await adminSettings.save();

  console.log('Audit password updated successfully');
  process.exit();
};

changeAuditPassword();
