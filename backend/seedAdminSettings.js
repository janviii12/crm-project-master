import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminSettings from './models/AdminSettings.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdminSettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if AdminSettings already exists
    const existingSettings = await AdminSettings.findOne();
    if (existingSettings) {
      console.log('AdminSettings already exists');
      return;
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('adminlogs123', 10);

    // Create AdminSettings
    const adminSettings = new AdminSettings({
      auditPassword: hashedPassword,
    });

    await adminSettings.save();
    console.log('AdminSettings seeded successfully');

  } catch (error) {
    console.error('Error seeding AdminSettings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedAdminSettings();
