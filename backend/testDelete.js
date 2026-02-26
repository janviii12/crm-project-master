import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();
await connectDB();

const users = await User.find();
console.log("All users:", users);

if (users.length > 0) {
  const testUser = users[0];
  console.log('Attempting to delete user:', testUser._id);

  const deleted = await User.findByIdAndDelete(testUser._id);
  console.log('Deleted user:', deleted ? 'Success' : 'Failed');

  // Check users after deletion
  const remainingUsers = await User.find();
  console.log('Remaining users:', remainingUsers.length);
}

mongoose.connection.close();
