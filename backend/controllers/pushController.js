import webPush from 'web-push';
import User from '../models/User.js';
import dotenv from "dotenv";
dotenv.config();
// Configure VAPID keys
webPush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Subscribe user to push notifications
export const subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    console.error('subscribeToPush error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Unsubscribe user from push notifications
export const unsubscribeFromPush = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $unset: { pushSubscription: 1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('unsubscribeFromPush error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Send push notification
export const sendPushNotification = async (userId, title, body) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.pushSubscription) {
      console.log(`No push subscription for user ${userId}`);
      return;
    }

    // Backend CANNOT use window → send static URL
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo-grow.png',
      badge: '/logo-grow.png',
      data: {
        url: process.env.FRONTEND_URL || 'http://localhost:8080'
      },
    });

    await webPush.sendNotification(user.pushSubscription, payload);
    console.log(`Push notification sent to user ${userId}`);
  } catch (error) {
    console.error('sendPushNotification error:', error);

    // Clean invalid subscription
    if (error.statusCode === 410 || error.statusCode === 400) {
      await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
      console.log(`Removed invalid subscription for user ${userId}`);
    }
  }
};
