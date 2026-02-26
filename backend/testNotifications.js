import mongoose from 'mongoose';
import Notification from './models/Notification.js';
import User from './models/User.js';
import Customer from './models/Customer.js';

async function testNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm');
    console.log('Connected to MongoDB');

    // Find a customer
    const customer = await Customer.findOne();
    if (!customer) {
      console.log('No customers found');
      return;
    }
    console.log('Found customer:', customer.name, customer.email);

    // Find the corresponding user
    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.log('No user found for customer');
      return;
    }
    console.log('Found user:', user.name, user.email, user.role);

    // Create a test notification
    const notification = new Notification({
      user: user._id,
      type: 'success',
      title: 'Test Application Approved',
      message: 'Congratulations! Your application has been approved and verified.',
      link: '/application-status'
    });

    await notification.save();
    console.log('Test notification created:', notification._id);

    // Check notifications for this user
    const notifications = await Notification.find({ user: user._id });
    console.log('Total notifications for user:', notifications.length);
    notifications.forEach(n => {
      console.log('-', n.title, n.type, n.read);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testNotifications();
