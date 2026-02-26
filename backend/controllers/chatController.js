import Message from '../models/Message.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

// Get all groups for the user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      participants: userId
    })
    .populate('participants', 'name email roles avatar')
    .populate('createdBy', 'name email')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups'
    });
  }
};

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, participants } = req.body;
    const userId = req.user.id;

    // Add creator to participants if not included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Validate participants exist and have chat access
    const users = await User.find({ _id: { $in: participants } });

    if (users.length !== participants.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    // Check if all participants have developer role for chat access
    const invalidUsers = users.filter(user => !user.roles || !user.roles.includes('developer'));
    if (invalidUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All participants must have chat access (developer role)'
      });
    }

    const group = new Group({
      name,
      participants,
      createdBy: userId,
      groupType: participants.length === 2 ? 'direct' : 'group'
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('participants', 'name email roles avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in the group
    const group = await Group.findOne({
      _id: groupId,
      participants: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this group'
      });
    }

    const messages = await Message.find({
      group: groupId,
      deleted: false
    })
    .populate('sender', 'name email avatar')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name email avatar'
      },
      select: 'content sender'
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read by this user
    await Message.updateMany(
      {
        group: groupId,
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { groupId, content, messageType = 'text', media, replyTo } = req.body;
    const userId = req.user.id;

    // Check if user is participant in the group
    const group = await Group.findOne({
      _id: groupId,
      participants: userId
    });

    if (!group) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this group'
      });
    }

    // If replyTo is provided, validate it exists and belongs to the same group
    if (replyTo) {
      const replyMessage = await Message.findOne({
        _id: replyTo,
        group: groupId,
        deleted: false
      });
      if (!replyMessage) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reply message'
        });
      }
    }

    const message = new Message({
      sender: userId,
      content,
      group: groupId,
      messageType,
      media,
      replyTo,
      readBy: [{
        user: userId,
        readAt: new Date()
      }]
    });

    await message.save();

    // Update group's last message
    await Group.findByIdAndUpdate(groupId, {
      lastMessage: message._id,
      lastMessageTime: message.timestamp
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name email avatar'
        },
        select: 'content sender'
      });

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Delete a message (own message or by moderator)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId).populate('sender');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions: own message or moderator
    const isModerator = req.user.roles && req.user.roles.includes('developer') && req.user.isChatModerator;
    const isOwnMessage = message.sender._id.toString() === userId;

    if (!isOwnMessage && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Soft delete
    message.deleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// Mark messages as read
export const markMessagesRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        group: groupId,
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Delete a group (only by group creator)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only group creator can delete the group
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can delete the group'
      });
    }

    // Delete all messages in the group
    await Message.deleteMany({ group: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group'
    });
  }
};

// Add member to group (only by group creator)
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only group creator can add members
    if (group.createdBy.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can add members'
      });
    }

    // Check if user exists and has chat access
    const user = await User.findById(userId);
    if (!user || !user.roles.includes('developer')) {
      return res.status(400).json({
        success: false,
        message: 'User not found or does not have chat access'
      });
    }

    // Check if user is already in the group
    if (group.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already in the group'
      });
    }

    // Add user to group
    group.participants.push(userId);
    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('participants', 'name email roles avatar')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add group member'
    });
  }
};

// Remove member from group (only by group creator)
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only group creator can remove members
    if (group.createdBy.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can remove members'
      });
    }

    // Cannot remove the group creator
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    // Check if user is in the group
    if (!group.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not in the group'
      });
    }

    // Remove user from group
    group.participants = group.participants.filter(id => id.toString() !== userId);
    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('participants', 'name email roles avatar')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove group member'
    });
  }
};
