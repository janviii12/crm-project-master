import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import aadhaarRoutes from "./models/aadhaar-ocr/aadhaar.routes.js"; // Aadhaar OCR routes
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import os from "os";
import cron from "node-cron";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js"; // Handles User login/register
import customerRoutes from "./routes/customerRoutes.js"; // Will handle CRM customer data
import userRoutes from "./routes/userRoutes.js"; // Will handle user management
import logRoutes from "./routes/logRoutes.js"; // Will handle admin logs
import notificationRoutes from "./routes/notificationRoutes.js"; // Will handle notifications
import chatRoutes from "./routes/chatRoutes.js"; // Will handle chat functionality
import healthRoutes from "./routes/healthRoutes.js"; // Health check route
import adminRoutes from "./routes/adminRoutes.js"; // Admin routes
import staffRoutes from "./routes/staffRoutes.js"; // Staff routes
import noteRoutes from "./routes/noteRoutes.js"; // Note routes
import activityRoutes from "./routes/activityRoutes.js"; // Activity routes
import followUpRoutes from "./routes/followUpRoutes.js"; // Follow-up routes
import quotationRoutes from "./routes/quotationRoutes.js"; // Quotation routes
import stealthRoutes from "./routes/stealthRoutes.js"; // Stealth routes
import excelRoutes from "./routes/excelRoutes.js"; // Excel routes
import pushRoutes from "./routes/pushRoutes.js"; // Push notification routes
import publicKeyRoutes from "./routes/publicKeyRoutes.js"; // VAPID public key routes
import pettyCashRoutes from "./routes/pettyCashRoutes.js"; // Petty cash routes
import taskRoutes from "./routes/taskRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";
import { checkReminders } from "./controllers/followUpController.js";
connectDB();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",  // Vite default
      "http://localhost:8080",  // Alternative port
      "http://localhost:5173",  // Vite alternative
      "https://growup-india.cloud"
    ],
    methods: ["GET", "POST"],
    credentials: true,
allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Make io available to routes and middleware
app.set('io', io);

// Export io for use in other modules
export { io };

app.use(cors({
  origin: process.env.FRONTEND_URL || [
    "http://localhost:3000",  // Vite default
    "http://localhost:8080",  // Alternative port
    "http://localhost:5173",  // Vite alternative
    "https://growup-india.cloud"
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
/**
 * 📌 NOTE:
 * Currently, we only have "Users" for login & authentication (via authRoutes).
 * To store more CRM-related details (like customer info, company details, deals, notes, etc.),
 * we are using a separate "Customer" model & API (customerRoutes).
 */
// Authentication (Login / Register) - FIXED ROUTE ORDER
// API routes FIRST (before redirects!)
console.log('✅ Activity routes mounted at /api/activities');
app.use('/api/activities', activityRoutes); // QuickAction logout - FIXED 404
app.use('/api/auth', authRoutes); // Login
app.use('/api/customers', customerRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/push', pushRoutes); 
app.use('/api/push', publicKeyRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/leads', leadsRoutes);

// Redirects LAST\nimport redirectRoutes from './routes/redirectRoutes.js';\napp.use(redirectRoutes);
// Serve static files from uploads directory
app.use(
  "/api/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their groups
  socket.on('join-groups', (groupIds) => {
    groupIds.forEach(groupId => {
      socket.join(`group_${groupId}`);
    });
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      // Broadcast to all group members except sender (since sender already has it from optimistic update)
      socket.to(`group_${data.groupId}`).emit('new-message', data.message);
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    try {
      // Broadcast to all group members including sender
      io.to(`group_${data.groupId}`).emit('message-deleted', {
        messageId: data.messageId,
        groupId: data.groupId
      });
    } catch (error) {
      console.error('Socket delete message error:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`group_${data.groupId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      groupId: data.groupId
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(`group_${data.groupId}`).emit('user-stop-typing', {
      userId: data.userId,
      groupId: data.groupId
    });
  });

  // Handle read receipts
  socket.on('mark-read', (data) => {
    socket.to(`group_${data.groupId}`).emit('messages-read', {
      groupId: data.groupId,
      userId: data.userId
    });
  });

  // Handle note updates
  socket.on('noteUpdate', async (data) => {
    try {
      // Broadcast note update to all shared users
      socket.to(`note_${data.noteId}`).emit('note-updated', data);
    } catch (error) {
      console.error('Socket note update error:', error);
    }
  });

  // Handle note sharing
  socket.on('noteShare', async (data) => {
    try {
      // Broadcast note share to all shared users
      socket.to(`note_${data.noteId}`).emit('note-shared', data);
    } catch (error) {
      console.error('Socket note share error:', error);
    }
  });

  // Handle note deletion
  socket.on('noteDelete', async (data) => {
    try {
      // Broadcast note deletion to all shared users
      socket.to(`note_${data.noteId}`).emit('note-deleted', data);
    } catch (error) {
      console.error('Socket note delete error:', error);
    }
  });

  // Handle server status requests
  socket.on('request-server-status', () => {
    // Emit current server status to the requesting client
    const serverStatus = {
      apiHealth: 'healthy',
      mongodbConnection: 'connected',
      serverUptime: getServerUptime(),
      memoryUsage: getMemoryUsage(),
      cpuUsage: getCpuUsage(),
      socketIOConnection: 'connected',
      buildVersion: process.env.npm_package_version || '1.0.0'
    };
    socket.emit('server-status-update', serverStatus);
  });

  // Handle real-time activity updates
  socket.on('join-activity-room', (userId) => {
    socket.join(`activity_${userId}`);
    // Also join admin/manager rooms if user has those roles
    // This will be handled by the client based on user roles
  });

  // Handle security alerts
  socket.on('join-security-room', (userId) => {
    socket.join(`security_${userId}`);
    // Also join admin/manager rooms if user has those roles
    // This will be handled by the client based on user roles
  });

  // Handle user activities (login, logout, etc.)
  socket.on('user-activity', (data) => {
    // Broadcast to all connected admin/manager users
    io.to('activity_admin').emit('new-activity', data);
    io.to('activity_manager').emit('new-activity', data);
  });

  // Handle security alerts (failed logins, unauthorized access)
  socket.on('security-alert', (data) => {
    // Broadcast to all connected admin/manager users
    io.to('security_admin').emit('security-alert', data);
    io.to('security_manager').emit('security-alert', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


app.get("/version-check", (req, res) => {
  res.send("CRM UPDATED VERSION 27 FEB 2026");
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  logger.info(`Server started successfully on port ${PORT}`);

  // Start cron job for reminder checking
  cron.schedule('* * * * *', () => {
    checkReminders(io);
  });
  console.log('⏰ Reminder cron job started - checking every minute');
});

// Helper functions for server status
function getServerUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const used = Math.round(memUsage.heapUsed / 1024 / 1024);
  const total = Math.round(memUsage.heapTotal / 1024 / 1024);
  const percentage = Math.round((used / total) * 100);
  return `${percentage}%`;
}

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const percentage = 100 - ~~(100 * idle / total);
  return `${percentage}%`;
}

// Global error handler (must be last)
app.use(errorHandler);
