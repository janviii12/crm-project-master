import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();
await connectDB();

const users = await User.find();
console.log("All users:", users);

mongoose.connection.close();
