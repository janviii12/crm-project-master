import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Message from "./models/Message.js";

const deleteChatData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Delete all messages
    const result = await Message.deleteMany({});
    console.log(`Deleted ${result.deletedCount} chat messages from the database`);

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error deleting chat data:", error.message);
    process.exit(1);
  }
};

// Run the function
deleteChatData();
