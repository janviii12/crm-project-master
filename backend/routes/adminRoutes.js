import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { getInteractions, getConversations, updateInteraction, updateConversation, deleteInteraction, uploadImages, exportConversationsToExcel } from '../controllers/interactionController.js';
import { getLogs } from '../controllers/logController.js';
import upload from '../middleware/upload.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply authentication globally to all routes
router.use(authenticateToken);

// Middleware to check admin, manager, or executive role
const requireAdminOrDeveloper = (req, res, next) => {
  if (!req.user || !req.user.roles || (!req.user.roles.includes('admin') && !req.user.roles.includes('manager') && !req.user.roles.includes('executive'))) {
    logger.warn('Unauthorized admin/manager/executive access attempt', {
      userId: req.user?.id,
      roles: req.user?.roles,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Admin, manager, or executive access required'
    });
  }
  next();
};

// Get all client interactions (admin, manager, executive)
router.get('/interactions', requireAdminOrDeveloper, getInteractions);

// Get conversations grouped by client (admin, manager, executive)
router.get('/conversations', requireAdminOrDeveloper, getConversations);

// Export conversations to Excel (admin, manager, executive)
router.get('/conversations/export', requireAdminOrDeveloper, exportConversationsToExcel);

// Update interaction (admin, manager, executive)
router.put('/interactions/:id', requireAdminOrDeveloper, updateInteraction);

// Update conversation (update all interactions for a contactNumber) (admin, manager, executive)
router.put('/conversations/:contactNumber', requireAdminOrDeveloper, updateConversation);

// Delete interaction (admin, manager, executive)
router.delete('/interactions/:id', requireAdminOrDeveloper, deleteInteraction);

// Upload images to interaction (admin, manager, executive)
router.post('/interactions/:id/images', requireAdminOrDeveloper, upload.array('images', 10), uploadImages);

// Get activity logs (database logs)
router.get('/logs', requireAdminOrDeveloper, getLogs);

// Get server status (developer or admin only)
router.get('/server-status', authenticateToken, (req, res) => {
  // Check if user has developer role, admin role, or isDevLead flag
  const hasAccess = req.user?.roles?.includes('developer') || req.user?.roles?.includes('admin') || req.user?.isDevLead;

  if (!hasAccess) {
    logger.warn('Unauthorized server status access attempt', {
      userId: req.user?.id,
      roles: req.user?.roles,
      isDevLead: req.user?.isDevLead,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Developer or admin access required'
    });
  }

  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsagePercent = Math.round(100 - ~~(100 * idle / total));

    // Get uptime in human readable format
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);
    const uptimeString = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

    // Get build version from package.json
    let buildVersion = '1.0.0'; // Default
    try {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        buildVersion = packageJson.version || '1.0.0';
      }
    } catch (error) {
      logger.warn('Could not read package.json for version', error);
    }

    // Check Socket.IO status (simplified - we know it's running if server is running)
    const socketStatus = 'connected'; // Since Socket.IO is initialized in server.js

    const serverStatus = {
      apiHealth: 'healthy',
      mongodbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      serverUptime: uptimeString,
      memoryUsage: `${memoryUsagePercent}%`,
      cpuUsage: `${cpuUsagePercent}%`,
      socketIOConnection: socketStatus,
      buildVersion: buildVersion
    };

    logger.info('Server status requested', {
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: serverStatus
    });
  } catch (error) {
    logger.error('Failed to get server status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve server status'
    });
  }
});

// Get server stats for real-time graphs (developer or admin only)
router.get('/server-stats', authenticateToken, (req, res) => {
  // Check if user has developer role, admin role, or isDevLead flag
  const hasAccess = req.user?.roles?.includes('developer') || req.user?.roles?.includes('admin') || req.user?.isDevLead;

  if (!hasAccess) {
    logger.warn('Unauthorized server stats access attempt', {
      userId: req.user?.id,
      roles: req.user?.roles,
      isDevLead: req.user?.isDevLead,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Developer or admin access required'
    });
  }

  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsagePercent = Math.round(100 - ~~(100 * idle / total));

    // Get uptime in human readable format
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);
    const uptimeString = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

    // Simulate API latency (in a real app, this would be measured)
    const apiLatency = Math.floor(Math.random() * 300) + 50; // Random between 50-350ms

    const serverStats = {
      timestamp: new Date().toISOString(),
      cpu: cpuUsagePercent,
      ram: memoryUsagePercent,
      apiLatency: apiLatency,
      uptime: uptimeString
    };

    logger.info('Server stats requested', {
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: serverStats
    });
  } catch (error) {
    logger.error('Failed to get server stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve server stats'
    });
  }
});

export default router;
