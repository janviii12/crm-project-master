import User from "../models/User.js";
import UserActivity from "../models/UserActivity.js";
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  console.log('Login request body:', req.body);
  try {
    const { email, password } = req.body;
    console.log("login user req ", req.body);

    // find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("login user --- ", user);

    // check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    console.log("password is match ", password);

    // create access token (short-lived)
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
    );

    // create refresh token (long-lived)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    // limit refresh tokens to 3: remove expired tokens first, keep latest 2 valid ones, add new one
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > now);
    user.refreshTokens = user.refreshTokens.slice(-2);
    const refreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: refreshTokenExpiry
    });
    await user.save();

// log login activity WITH metadata (for logout pairing)
    const loginActivity = await UserActivity.create({
      userId: user._id,
      activityType: 'login',
      description: `User ${user.email} logged in`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: {
        startTime: new Date().toISOString(),
        sessionStart: new Date().toISOString()
      }
    });
    console.log('✅ LOGIN CREATED w/ metadata:', loginActivity._id);

    // Emit real-time activity update
    const ioMod = await import('../server.js');
    const io = ioMod.io;
    if (io) {
      io.to('activity_admin').emit('new-activity', {
        activity: {
          _id: Date.now().toString(),
          activityType: 'login',
          description: `User ${user.email} logged in`,
          userName: user.name || user.email,
          userRole: user.roles?.[0] || 'User',
          timestamp: new Date()
        },
        timestamp: new Date()
      });
      io.to('activity_manager').emit('new-activity', {
        activity: {
          _id: Date.now().toString(),
          activityType: 'login',
          description: `User ${user.email} logged in`,
          userName: user.name || user.email,
          userRole: user.roles?.[0] || 'User',
          timestamp: new Date()
        },
        timestamp: new Date()
      });
    }

    // set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log("Login user:", user);

    res.json({
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        avatar: user.avatar
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    console.log('🔄 Backend: Refresh token endpoint called');
    console.log('🍪 Backend: Cookies received:', Object.keys(req.cookies));
    console.log('🍪 Backend: refreshToken cookie present:', !!req.cookies.refreshToken);

    // Add delay for debugging
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("🪵 Refresh token delay added — backend is waiting 2 seconds");

    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      console.log('❌ Backend: No refresh token in cookies');
      return res.status(401).json({ message: "Refresh token required" });
    }

    console.log('🔍 Backend: Verifying refresh token...');

    // verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    console.log('✅ Backend: Refresh token decoded successfully for user:', decoded.id);

    // find user and check if refresh token exists in DB
    const user = await User.findOne({
      _id: decoded.id,
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      console.log('❌ Backend: User not found or refresh token invalid');
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    console.log('✅ Backend: User found, generating new access token');

    // generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
    );

    console.log('🔄 Backend: Rotating refresh token...');

    // rotate refresh token (optional: generate new one and invalidate old)
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    // limit refresh tokens to 3: remove old one, keep latest 2 valid, add new
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    const validTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
    user.refreshTokens = validTokens.slice(-2);
    const newRefreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: newRefreshTokenExpiry
    });
    await user.save();

    console.log('💾 Backend: New refresh token saved to database');

    // log token refresh activity
    await UserActivity.create({
      userId: user._id,
      activityType: 'token_refresh',
      description: `User ${user.email} refreshed token`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    console.log('🍪 Backend: Setting new refresh token cookie');

    // set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('✅ Backend: Sending new access token in response');
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('❌ Backend: Refresh token error:', err.message);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.updateOne(
        { 'refreshTokens.token': refreshToken },
        { $pull: { refreshTokens: { token: refreshToken } } }
      );
    }

    // 🚀 AUTO-END OPEN ACTIVITIES BEFORE LOGOUT
    let openActivities = [];
    let loginActivity = null;
    let logoutActivityId = null;
    
    if (req.user) {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const openActivityTypes = ['lunch_start', 'meeting_start', 'outside_work_start', 'login'];
      openActivities = await UserActivity.find({
        userId: req.user.id,
        activityType: { $in: openActivityTypes },
        $or: [
          { 'metadata.endTime': null },
          { 'metadata.endTime': { $exists: false } }
        ]
      }).sort({ timestamp: -1 });
      
      console.log('🔍 Logout open activities found:', openActivities.length, 'User:', req.user.email);

      // Auto-end open activities
      let autoEndedCount = 0;
      for (const openActivity of openActivities) {
        openActivity.metadata = openActivity.metadata || {};
        openActivity.metadata.endTime = now;
        const startTime = new Date(openActivity.metadata.startTime || openActivity.timestamp);
        openActivity.metadata.endTime = now; // ✅ CRITICAL: Set endTime
        openActivity.metadata.duration = Math.floor((now - startTime) / (1000 * 60));
        await openActivity.save();
        console.log(`🚀 AUTO-ENDED ${openActivity.activityType} duration: ${openActivity.metadata.duration}m`);
        autoEndedCount++; 
        
        // Emit update
        const ioMod = await import('../server.js');
        const io = ioMod.io;
        if (io) {
          io.to(`activity_${req.user.id}`).emit('activity-updated', openActivity.toObject());
          io.to('activity_admin').emit('activity-updated', openActivity.toObject());
          io.to('activity_manager').emit('activity-updated', openActivity.toObject());
        }
      }

      // Pair login with logout
      // 🔍 DEBUG: Find open login activity
      console.log('🔍 LOGOUT DEBUG - finding open login for user:', req.user.id);
      loginActivity = await UserActivity.findOne({
        userId: req.user.id,
        activityType: 'login',
        $or: [
          { 'metadata.endTime': { $eq: null } },
          { 'metadata.endTime': { $exists: false } }
        ]
      }).sort({ timestamp: -1 }).limit(1);
      
      console.log('🔍 Found loginActivity:', loginActivity ? loginActivity._id : 'NONE', loginActivity?.timestamp);
      
        if (loginActivity) {
          loginActivity.metadata = loginActivity.metadata || {};
          loginActivity.metadata.endTime = now.toISOString();
          loginActivity.metadata.sessionEndTime = now.toISOString();
          loginActivity.metadata.sessionDurationMinutes = Math.floor((now - new Date(loginActivity.timestamp)) / (1000 * 60));
          loginActivity.metadata.duration = loginActivity.metadata.sessionDurationMinutes;
          loginActivity.description = `Session ended at logout (${loginActivity.metadata.sessionDurationMinutes}m)`;
          loginActivity.markModified('metadata');
          const saved = await loginActivity.save();
          console.log('✅ LOGIN PAIRED END SAVED:', {
            id: loginActivity._id,
            duration: loginActivity.metadata.sessionDurationMinutes + 'm',
            endTime: loginActivity.metadata.endTime,
            saved: !!saved
          });
          
// ✅ FIXED: NO SEPARATE LOGOUT ROW - only update LOGIN row
          // Emit ONLY updated LOGIN row
          const ioMod = await import('../server.js');
          const io = ioMod.io;
          if (io) {
            const updatedLoginData = loginActivity.toObject();
            io.to(`activity_${req.user.id}`).emit('activity-updated', updatedLoginData);
            io.to('activity_admin').emit('activity-updated', updatedLoginData);
            io.to('activity_manager').emit('activity-updated', updatedLoginData);
            console.log('📡 EMITTED: login row updated only (no logout row)');
          }
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    const updatedActivities = [
      ...(loginActivity ? [loginActivity._id] : []),
      ...openActivities.map(activity => activity._id)
    ];

    res.json({ 
      success: true, 
      message: "Logged out successfully", 
      logoutConfirmation: {
        logoutActivityId: logoutActivityId,
        updatedActivities,
        openActivitiesClosed: openActivities.length,
        finalizedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

