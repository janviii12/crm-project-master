import ClientInteraction from '../models/ClientInteraction.js';
import UserActivity from '../models/UserActivity.js';
import logger from '../utils/logger.js';
import upload from '../middleware/upload.js';
import XLSX from 'xlsx';
import mongoose from 'mongoose';

const isAdminUser = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  return roles.includes('admin');
};

// Non-admins only see customers (contact numbers) whose most recent interaction
// ("Last Handled By") was handled by them. Admins are unrestricted.
// Mutates and returns the given query.
const restrictToUserCustomers = async (query, user) => {
  if (isAdminUser(user)) return query;
  const latest = await ClientInteraction.aggregate([
    { $sort: { date: -1 } },
    { $group: { _id: '$contactNumber', lastHandledBy: { $first: '$handledBy' } } },
    { $match: { lastHandledBy: new mongoose.Types.ObjectId(user.id) } }
  ]);
  const contactNumbers = latest.map(c => c._id);
  query.$and = [...(query.$and || []), { contactNumber: { $in: contactNumbers } }];
  return query;
};

const VALID_CLIENT_TYPES = ['Luke Warm', 'Warm', 'Hot'];

// Client type only applies to 'potential' clients (default 'Luke Warm'); anything else stores ''.
const resolveClientType = (clientStatus, clientType, fallback = '') => {
  if (clientStatus !== 'potential') return '';
  return VALID_CLIENT_TYPES.includes(clientType) ? clientType : (fallback || 'Luke Warm');
};

export const getConversationStats = async (req, res) => {
  try {
    const { startDate, endDate, clientStatus } = req.query;

    let filter = {};

    if (clientStatus && clientStatus !== 'all') {
      filter.clientStatus = clientStatus;
    }

    if (startDate && endDate) {
      filter.lastInteractionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const existing = await Conversation.countDocuments({
      ...filter,
      clientStatus: 'existing'
    });

    const potential = await Conversation.countDocuments({
      ...filter,
      clientStatus: 'potential'
    });

    const thisMonth = await Conversation.countDocuments({
      ...filter,
      lastInteractionDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.json({
      success: true,
      data: {
        existing,
        potential,
        thisMonth
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Get all interactions (admin only)
export const getInteractions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      startDate,
      endDate,
      clientName,
      contactNumber,
      clientStatus
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Specific filters
    if (clientName) {
      query.clientName = { $regex: clientName, $options: 'i' };
    }
    if (contactNumber) {
      query.contactNumber = { $regex: contactNumber, $options: 'i' };
    }
    if (clientStatus) {
      query.clientStatus = clientStatus;
    }

    await restrictToUserCustomers(query, req.user);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const interactions = await ClientInteraction.find(query)
      .populate('handledBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClientInteraction.countDocuments(query);

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_view',
      description: `Viewed client interactions (page ${page}, limit ${limit})`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { query, page, limit, total }
    });

    res.json({
      success: true,
      data: interactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interactions'
    });
  }
};

// Create new interaction (staff only)
export const createInteraction = async (req, res) => {
  try {
    const { clientName, contactNumber, clientStatus, clientType, interactionType, notes, date, clientMessage, replyMessage,  referenceSource } = req.body;

    if (clientType && !VALID_CLIENT_TYPES.includes(clientType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client type'
      });
    }

    // Validate required fields - only interactionType is required
    if (!interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Interaction type is required'
      });
    }

    // Validate interaction type
    const validTypes = ['Call', 'WhatsApp', 'Email', 'Meeting'];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type'
      });
    }

    // Validate client status if provided
    const validStatuses = ['existing', 'potential', 'closed-not-interested', 'closed-service-done'];
    if (clientStatus && !validStatuses.includes(clientStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client status'
      });
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(file => file.filename) : [];

    // Set defaults for missing fields
    const finalClientName = clientName || 'Unknown';
    const finalContactNumber = contactNumber || 'Unknown';
    const finalClientStatus = clientStatus || 'potential';
    const finalNotes = notes || '';

    const interaction = new ClientInteraction({
      clientName: finalClientName,
      contactNumber: finalContactNumber,
      clientStatus: finalClientStatus,
      clientType: resolveClientType(finalClientStatus, clientType),
      interactionType,
      notes: finalNotes,
      clientMessage: clientMessage || '',
      replyMessage: replyMessage || '',
      handledBy: req.user.id,
      referenceSource: req.body.referenceSource,
      date: date ? new Date(date) : new Date(),
      images
    });

    await interaction.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_create',
      description: `Created interaction with ${finalClientName} (${interactionType})`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { interactionId: interaction._id, clientName: finalClientName, interactionType, clientStatus: finalClientStatus, imageCount: images.length }
    });

    logger.info(`Interaction created by ${req.user.name}: ${finalClientName} - ${interactionType} - ${finalClientStatus}`);

    res.status(201).json({
      success: true,
      data: interaction,
      message: 'Interaction recorded successfully'
    });
  } catch (error) {
    logger.error('Error creating interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interaction'
    });
  }
};

// Update interaction (admin, manager, executive)
export const updateInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, contactNumber, clientStatus, clientType, interactionType, notes, date, clientMessage, replyMessage } = req.body;

    if (clientType && !VALID_CLIENT_TYPES.includes(clientType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client type'
      });
    }

    // Validate required fields - only interactionType is required
    if (!interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Interaction type is required'
      });
    }

    // Validate interaction type
    const validTypes = ['Call', 'WhatsApp', 'Email', 'Meeting'];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type'
      });
    }

    // Validate client status if provided
    const validStatuses = ['existing', 'potential', 'closed-not-interested', 'closed-service-done'];
    if (clientStatus && !validStatuses.includes(clientStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client status'
      });
    }

    const interaction = await ClientInteraction.findById(id);
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    // Handle uploaded images (append to existing images)
    const newImages = req.files ? req.files.map(file => file.filename) : [];
    const updatedImages = [...(interaction.images || []), ...newImages];

    // Update the interaction - use existing values if new values not provided
    interaction.clientName = clientName || interaction.clientName;
    interaction.contactNumber = contactNumber || interaction.contactNumber;
    interaction.clientStatus = clientStatus || interaction.clientStatus;
    interaction.clientType = resolveClientType(interaction.clientStatus, clientType, interaction.clientType);
    interaction.interactionType = interactionType;
    interaction.notes = notes || interaction.notes || '';
    interaction.clientMessage = clientMessage !== undefined ? clientMessage : interaction.clientMessage;
    interaction.replyMessage = replyMessage !== undefined ? replyMessage : interaction.replyMessage;
    interaction.date = date ? new Date(date) : interaction.date;
    interaction.images = updatedImages;

    await interaction.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_update',
      description: `Updated interaction with ${interaction.clientName} (${interactionType})`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { interactionId: interaction._id, clientName: interaction.clientName, interactionType, clientStatus: interaction.clientStatus }
    });

    logger.info(`Interaction updated by ${req.user.name}: ${interaction.clientName} - ${interactionType} - ${interaction.clientStatus}`);

    res.json({
      success: true,
      data: interaction,
      message: 'Interaction updated successfully'
    });
  } catch (error) {
    logger.error('Error updating interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interaction'
    });
  }
};

// Get conversations grouped by client (admin, manager, executive)
export const getConversations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      startDate,
      endDate,
      clientName,
      contactNumber,
      clientStatus
    } = req.query;

    // Build match query for aggregation
    const matchQuery = {};

    // Search filter
    if (search) {
      matchQuery.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Specific filters
    if (clientName) {
      matchQuery.clientName = { $regex: clientName, $options: 'i' };
    }
    if (contactNumber) {
      matchQuery.contactNumber = { $regex: contactNumber, $options: 'i' };
    }
    if (clientStatus) {
      matchQuery.clientStatus = clientStatus;
    }

    await restrictToUserCustomers(matchQuery, req.user);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregation pipeline to group interactions by contactNumber
    const conversations = await ClientInteraction.aggregate([
      // Match stage - apply filters
      { $match: matchQuery },

      // Lookup to populate handledBy
      {
        $lookup: {
          from: 'users',
          localField: 'handledBy',
          foreignField: '_id',
          as: 'handledBy'
        }
      },
      {
        $unwind: {
          path: '$handledBy',
          preserveNullAndEmptyArrays: true
        }
      },

      // Group by contactNumber and collect all interactions
      {
        $group: {
          _id: '$contactNumber',
          clientName: { $first: '$clientName' },
          contactNumber: { $first: '$contactNumber' },
          clientStatus: { $first: '$clientStatus' },
          lastInteractionDate: { $max: '$date' },
          totalInteractions: { $sum: 1 },
          interactions: {
            $push: {
              _id: '$_id',
              date: '$date',
              interactionType: '$interactionType',
              clientType: '$clientType',
              notes: '$notes',
              clientMessage: '$clientMessage',
              replyMessage: '$replyMessage',
              referenceSource: '$referenceSource',
              images: '$images',
              handledBy: {
                _id: '$handledBy._id',
                name: '$handledBy.name',
                email: '$handledBy.email'
              },
              createdAt: '$createdAt'
            }
          }
        }
      },

      // Sort conversations by last interaction date (descending)
      { $sort: { lastInteractionDate: -1 } },

      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Sort interactions within each conversation by date (descending) in JavaScript
    conversations.forEach(conversation => {
      conversation.interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Conversation-level client type follows the most recent interaction
      conversation.clientType = conversation.interactions[0]?.clientType || '';
    });

    // Get total count for pagination
   // ✅ 1. Total conversations (pagination ke liye)
const totalConversations = await ClientInteraction.aggregate([
  { $match: matchQuery },
  {
    $group: {
      _id: '$contactNumber'
    }
  },
  { $count: 'total' }
]);

const total = totalConversations.length > 0 ? totalConversations[0].total : 0;


// ✅ 2. STATS (alag query)
const statsData = await ClientInteraction.aggregate([
  { $match: matchQuery },
 { $sort: { date: -1 } },
  // STEP 1: GROUP BY CONTACT (MAKE CONVERSATIONS)
  {
    $group: {
      _id: "$contactNumber",
      clientStatus: { $last: "$clientStatus" },
      lastInteractionDate: { $max: "$date" }
    }
  },

  // STEP 2: NOW CALCULATE STATS
  {
    $group: {
      _id: null,

      totalConversations: { $sum: 1 },

      existingClients: {
        $sum: {
          $cond: [{ $eq: ["$clientStatus", "existing"] }, 1, 0]
        }
      },

      potentialClients: {
        $sum: {
          $cond: [{ $eq: ["$clientStatus", "potential"] }, 1, 0]
        }
      },

      thisMonth: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: [{ $month: "$lastInteractionDate" }, new Date().getMonth() + 1] },
                { $eq: [{ $year: "$lastInteractionDate" }, new Date().getFullYear()] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  }
]);

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_view',
      description: `Viewed client conversations (page ${page}, limit ${limit})`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { matchQuery, page, limit, total }
    });

   res.json({
  success: true,
  data: conversations,
  pagination: {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    itemsPerPage: parseInt(limit)
  },

  // ✅ ADD THIS
  stats: statsData[0] || {
    totalConversations: 0,
    existingClients: 0,
    potentialClients: 0,
    thisMonth: 0
  }
});
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};


// Upload images to interaction (admin, manager, executive)
export const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;

    const interaction = await ClientInteraction.findById(id);
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    // Handle uploaded images (append to existing images)
    const newImages = req.files ? req.files.map(file => file.filename) : [];
    const updatedImages = [...(interaction.images || []), ...newImages];

    // Update the interaction with new images
    interaction.images = updatedImages;
    await interaction.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_image_upload',
      description: `Uploaded ${newImages.length} images to interaction with ${interaction.clientName}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { interactionId: interaction._id, clientName: interaction.clientName, imageCount: newImages.length }
    });

    logger.info(`Images uploaded by ${req.user.name} to interaction: ${interaction.clientName} (${newImages.length} images)`);

    res.json({
      success: true,
      data: interaction,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
};

// Delete interaction (admin only)
export const deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;

    const interaction = await ClientInteraction.findById(id);
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }

    await ClientInteraction.findByIdAndDelete(id);

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_delete',
      description: `Deleted interaction with ${interaction.clientName}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { interactionId: id, clientName: interaction.clientName }
    });

    logger.info(`Interaction deleted by ${req.user.name}: ${interaction.clientName}`);

    res.json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interaction'
    });
  }
};

// Update conversation (update all interactions for a contactNumber) (admin, manager, executive)
export const updateConversation = async (req, res) => {
  try {
    // Decode the contact number from URL
    const contactNumber = decodeURIComponent(req.params.contactNumber);
    const { clientName, newContactNumber, clientStatus, clientType, handledBy } = req.body;

    if (clientType && !VALID_CLIENT_TYPES.includes(clientType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client type'
      });
    }

    // Validate required fields
    if (!clientName || !newContactNumber || !clientStatus) {
      return res.status(400).json({
        success: false,
        message: 'Client Name, Contact Number, and Client Status are required'
      });
    }

    // Validate client status
    const validStatuses = ['existing', 'potential', 'closed-not-interested', 'closed-service-done'];
    if (!validStatuses.includes(clientStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client status'
      });
    }

    // Find all interactions with the given contact number
    const interactions = await ClientInteraction.find({ contactNumber });
    
    if (interactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No interactions found for this contact number'
      });
    }

    // If contact number is being changed, find interactions with the new contact number
    // and merge them (update their clientName and clientStatus to match)
    let mergedCount = 0;
    if (newContactNumber !== contactNumber) {
      const existingInteractions = await ClientInteraction.find({ contactNumber: newContactNumber });
      if (existingInteractions.length > 0) {
        // Update existing interactions with the new contact number to match the incoming data
        await ClientInteraction.updateMany(
          { contactNumber: newContactNumber },
          { 
            clientName,
            clientStatus,
            ...(handledBy && { handledBy })
          }
        );
        mergedCount = existingInteractions.length;
      }
    }

    // Update all interactions with the old contact number
    const updateData = {
      clientName,
      clientStatus
    };

    // Only update contactNumber if it's different
    if (newContactNumber !== contactNumber) {
      updateData.contactNumber = newContactNumber;
    }

    // Optionally update handledBy if provided
    if (handledBy) {
      updateData.handledBy = handledBy;
    }

    const updatedCount = await ClientInteraction.updateMany(
      { contactNumber },
      updateData
    );

    // Client type: cleared everywhere unless 'potential'; for 'potential' it is set on the
    // most recent interaction only, so earlier interactions keep their own history.
    const finalContactNumber = newContactNumber;
    if (clientStatus !== 'potential') {
      await ClientInteraction.updateMany({ contactNumber: finalContactNumber }, { clientType: '' });
    } else {
      const latest = await ClientInteraction.findOne({ contactNumber: finalContactNumber }).sort({ date: -1 });
      if (latest) {
        latest.clientType = resolveClientType('potential', clientType);
        await latest.save();
      }
    }

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_update',
      description: `Updated conversation for ${clientName} (${updatedCount.modifiedCount} interactions)`,
      ipAddress: req.ip || req.connection.remoteAddress,
      metadata: { 
        oldContactNumber: contactNumber, 
        newContactNumber, 
        clientName, 
        clientStatus,
        updatedCount: updatedCount.modifiedCount,
        mergedCount
      }
    });

    logger.info(`Conversation updated by ${req.user.name}: ${clientName} - ${newContactNumber} - ${clientStatus} (${updatedCount.modifiedCount} interactions)`);

    res.json({
      success: true,
      message: `Conversation updated successfully. ${updatedCount.modifiedCount} interactions updated.${mergedCount > 0 ? ` ${mergedCount} interactions merged.` : ''}`,
      data: {
        updatedCount: updatedCount.modifiedCount,
        mergedCount
      }
    });
  } catch (error) {
    logger.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation'
    });
  }
};

// Export conversations to Excel (admin, manager, executive)
export const exportConversationsToExcel = async (req, res) => {

// Get client counts for dashboard (admin, manager, executive) - NEW ENDPOINT FOR COUNTS
  try {
    const {
      search = '',
      startDate,
      endDate,
      clientName,
      contactNumber,
      clientStatus
    } = req.query;

    // Build match query for aggregation
    const matchQuery = {};

    // Search filter
    if (search) {
      matchQuery.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Specific filters
    if (clientName) {
      matchQuery.clientName = { $regex: clientName, $options: 'i' };
    }
    if (contactNumber) {
      matchQuery.contactNumber = { $regex: contactNumber, $options: 'i' };
    }
    if (clientStatus) {
      matchQuery.clientStatus = clientStatus;
    }

    await restrictToUserCustomers(matchQuery, req.user);

    // Fetch all conversations without pagination limit
    const conversations = await ClientInteraction.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'handledBy',
          foreignField: '_id',
          as: 'handledBy'
        }
      },
      {
        $unwind: {
          path: '$handledBy',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$contactNumber',
          clientName: { $first: '$clientName' },
          contactNumber: { $first: '$contactNumber' },
          clientStatus: { $last: '$clientStatus' },
          lastInteractionDate: { $max: '$date' },
          totalInteractions: { $sum: 1 },
          interactions: {
            $push: {
              _id: '$_id',
              date: '$date',
              interactionType: '$interactionType',
              clientType: '$clientType',
              notes: '$notes',
              clientMessage: '$clientMessage',
              replyMessage: '$replyMessage',
              images: '$images',
              handledBy: {
                _id: '$handledBy._id',
                name: '$handledBy.name',
                email: '$handledBy.email'
              },
              createdAt: '$createdAt'
            }
          }
        }
      },
      { $sort: { lastInteractionDate: -1 } }
    ]);

    // Sort interactions within each conversation
    conversations.forEach(conversation => {
      conversation.interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // Prepare data for Excel
    const excelData = [];

    // Add header row
    excelData.push([
      'Client Name',
      'Contact Number',
      'Client Status',
      'Client Type',
      'Last Interaction Date',
      'Total Interactions',
      'Interaction Type',
      'Interaction Date',
      'Handled By',
      'Notes',
      'Client Message',
      'Reply Message'
    ]);

    // Add data rows
    conversations.forEach(conversation => {
      const lastDate = conversation.lastInteractionDate ? new Date(conversation.lastInteractionDate).toLocaleDateString() : '';
      
      // If there are no interactions, add a row with just the client info
      if (!conversation.interactions || conversation.interactions.length === 0) {
        excelData.push([
          conversation.clientName || '',
          conversation.contactNumber || '',
          conversation.clientStatus === 'existing' ? 'Existing Client' : 'Yet to be Client',
          '',
          lastDate,
          '0',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        // Add a row for each interaction
        conversation.interactions.forEach((interaction, index) => {
          const interactionDate = interaction.date ? new Date(interaction.date).toLocaleString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : '';
          
          excelData.push([
            index === 0 ? (conversation.clientName || '') : '', // Only show client name on first row
            index === 0 ? (conversation.contactNumber || '') : '',
            index === 0 ? (conversation.clientStatus === 'existing' ? 'Existing Client' : 'Yet to be Client') : '',
            // Client type per interaction (only set for 'Yet to be Client' leads)
            interaction.clientType || (conversation.clientStatus === 'potential' ? 'Luke Warm' : ''),
            index === 0 ? lastDate : '',
            index === 0 ? conversation.totalInteractions.toString() : '',
            interaction.interactionType || '',
            interactionDate,
            interaction.handledBy?.name || 'Unknown',
            interaction.notes || '',
            interaction.clientMessage || '',
            interaction.replyMessage || ''
          ]);
        });
      }
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Client Name
      { wch: 15 }, // Contact Number
      { wch: 18 }, // Client Status
      { wch: 14 }, // Client Type
      { wch: 15 }, // Last Interaction Date
      { wch: 18 }, // Total Interactions
      { wch: 15 }, // Interaction Type
      { wch: 20 }, // Interaction Date
      { wch: 20 }, // Handled By
      { wch: 50 }, // Notes
      { wch: 50 }, // Client Message
      { wch: 50 }  // Reply Message
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Interactions');

    // Set response headers for download
    const fileName = `interactions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write file to buffer and send
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.send(buffer);

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'interaction_export',
      description: `Exported ${conversations.length} conversations to Excel`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { matchQuery, totalConversations: conversations.length }
    });

    logger.info(`Interactions exported to Excel by ${req.user.name}: ${conversations.length} conversations`);

  } catch (error) {
    logger.error('Error exporting conversations to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export conversations to Excel'
    });
  }
};
