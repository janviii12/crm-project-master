import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();
await connectDB();
  const createUser = async () => {
  const password = "admin1234";
  const hashedPassword = await bcrypt.hash(password, 10); // 👈 encrypt

  const user = new User({
    email: "adminn@demo.com",
    passwordHash: hashedPassword,
    roles: ["admin" ],
    name:'Admi Users',
  });

  await user.save();
  console.log("✅ User created with hashed password:", user.email);
  mongoose.connection.close();
};
createUser();
