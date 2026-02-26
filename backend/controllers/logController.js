import bcrypt from 'bcryptjs';
import Log from '../models/Log.js';
import AdminSettings from '../models/AdminSettings.js';
import User from '../models/User.js';

// Update audit password
export const updateAuditPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get admin settings
    const adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      return res.status(500).json({ success: false, message: 'Admin settings not configured' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminSettings.auditPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    adminSettings.auditPassword = hashedNewPassword;
    adminSettings.updatedAt = new Date();
    await adminSettings.save();

    return res.status(200).json({ success: true, message: 'Audit password updated successfully' });
  } catch (err) {
    console.error('updateAuditPassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Verify audit password with rate limiting
export const verifyAuditPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id; // From auth middleware

    // Get user for rate limiting
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is locked out (5 minutes after 3 failed attempt)
    if (user.auditAttempts >= 3) {
      const lockoutTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const timeSinceLastAttempt = Date.now() - new Date(user.lastAuditAttempt).getTime();

      if (timeSinceLastAttempt < lockoutTime) {
        const remainingTime = Math.ceil((lockoutTime - timeSinceLastAttempt) / (60 * 1000)); // minutes
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Try again in ${remainingTime} minutes.`
        });
      } else {
        // Reset attempts after lockout period
        user.auditAttempts = 0;
      }
    }

    // Get admin settings
    const adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      return res.status(500).json({ success: false, message: 'Admin settings not configured' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminSettings.auditPassword);

    if (isValidPassword) {
      // Reset attempts on success
      user.auditAttempts = 0;
      user.lastAuditAttempt = null;
      await user.save();

      return res.status(200).json({ success: true, message: 'Password verified' });
    } else {
      // Increment attempts
      user.auditAttempts += 1;
      user.lastAuditAttempt = new Date();
      await user.save();

      const remainingAttempts = 1 - user.auditAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid password. ${remainingAttempts} attempts remaining.`
      });
    }
  } catch (err) {
    console.error('verifyAuditPassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get logs with pagination (only after password verification)
export const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Log.countDocuments();

    const logs = await Log.find()
      .populate('userId', 'name email')
      .populate('documentId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: logs.map(log => ({
        id: log._id,
        userRole: log.userRole,
        userName: log.userName,
        userId: log.userId,
        documentName: log.documentName,
        documentId: log.documentId,
        action: log.action,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        deviceInfo: log.deviceInfo,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('getLogs error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Create log entry
export const createLog = async (userRole, userName, userId, documentName, documentId, action, ipAddress, deviceInfo) => {
  try {
    console.log('Logger triggered');
    const log = new Log({
      userRole,
      userName,
      userId,
      documentName,
      documentId,
      action,
      ipAddress,
      deviceInfo,
    });
    await log.save();
  } catch (err) {
    console.error('createLog error:', err);
  }
};
