import webPush from 'web-push';
import User from './models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configure VAPID keys
webPush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function testPushNotification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm');
    console.log('Connected to MongoDB');

    // Find a user with push subscription
    const user = await User.findOne({ pushSubscription: { $exists: true, $ne: null } });
    if (!user) {
      console.log('No user with valid push subscription found');
      // List all users to see what's available
      const allUsers = await User.find({}, 'name email pushSubscription');
      console.log('All users and their push subscriptions:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}): ${u.pushSubscription ? 'has subscription' : 'no subscription'}`);
      });
      return;
    }

    console.log('Found user with push subscription:', user.name, user.email);
    console.log('Push subscription object:', JSON.stringify(user.pushSubscription, null, 2));

    // Validate subscription structure
    if (!user.pushSubscription.endpoint) {
      console.log('Push subscription missing endpoint');
      return;
    }

    // Send test notification
    const payload = JSON.stringify({
      title: "Live Test",
      body: "If you see this, notifications work.",
      icon: '/logo-grow.png',
      badge: '/logo-grow.png',
      data: {
        url: process.env.FRONTEND_URL || 'http://localhost:8081'
      }
    });

    const result = await webPush.sendNotification(user.pushSubscription, payload);
    console.log('Test push notification sent successfully!');
    console.log('Response status:', result.statusCode);

  } catch (error) {
    console.error('Error sending test notification:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPushNotification();
