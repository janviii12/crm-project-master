import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('_id email roles name avatar createdAt');
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, roles } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Generate random password
    const rawPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Ensure roles is an array, default to ['client'] if not provided
    const userRoles = Array.isArray(roles) ? roles : (roles ? [roles] : ['client']);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      roles: userRoles,
      name,
    });
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        name: user.name,
        createdAt: user.createdAt
      },
    });

  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roles, password } = req.body;

    const updateData = { name };
    if (roles) {
      // Ensure roles is an array
      updateData.roles = Array.isArray(roles) ? roles : [roles];
    }
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('_id email roles name avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get staff users
export const getStaffUsers = async (req, res) => {
  try {
    const staffUsers = await User.find({ roles: { $in: ['manager', 'executive'] } }).select('_id email roles name avatar isDevLead isChatModerator');
    return res.status(200).json({
      success: true,
      data: staffUsers,
    });
  } catch (err) {
    console.error('getStaffUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const updateData = { name, email };

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('_id email roles name avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarPath = req.file.filename;

    const user = await User.findByIdAndUpdate(id, { avatar: avatarPath }, { new: true }).select('_id email roles name avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
    });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
