import ManagerWallet from '../models/ManagerWallet.js';
import ManagerExpense from '../models/ManagerExpense.js';
import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get wallet balance for a manager
export const getWalletBalance = async (req, res) => {
  try {
    const { managerId } = req.params;

    // Check if user is admin or the manager themselves
    if (req.user.roles.includes('admin') || req.user._id.toString() === managerId) {
      let wallet = await ManagerWallet.findOne({ managerId }).populate('managerId', 'name email');

      if (!wallet) {
        // Auto-create wallet for the manager if it doesn't exist
        wallet = new ManagerWallet({ managerId });
        await wallet.save();
        // Re-populate after creation
        wallet = await ManagerWallet.findOne({ managerId }).populate('managerId', 'name email');
      }

      res.json({
        success: true,
        data: wallet
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add amount to manager's wallet (Admin only)
export const addWalletAmount = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { amount, description, paymentMethod } = req.body;

    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add wallet amounts'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    let wallet = await ManagerWallet.findOne({ managerId });

    if (!wallet) {
      wallet = new ManagerWallet({ managerId });
    }

    // Handle file upload if present (for bill/receipt)
    let bill = null;
    if (req.file) {
      bill = {
        filePath: req.file.path,
        fileOriginalName: req.file.originalname,
        uploadedAt: new Date()
      };
    }

    const balanceBefore = wallet.balance;
    wallet.totalReceived += Number(amount);
    await wallet.save();

    // Create transaction record
    const transaction = new WalletTransaction({
      managerId,
      type: 'credit',
      amount,
      description: description || `${paymentMethod || 'Cash'} added to wallet`,
      paymentMethod: paymentMethod || 'cash',
      bill,
      balanceBefore,
      balanceAfter: wallet.balance
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Amount added to wallet successfully',
      data: wallet
    });
  } catch (error) {
    logger.error('Error adding wallet amount:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add new expense
export const addExpense = async (req, res) => {
  try {
    const { amount, category, description, paymentType, date } = req.body;
    const managerId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Handle file upload if present
    let bill = null;
    if (req.file) {
      bill = {
        filePath: req.file.path,
        fileOriginalName: req.file.originalname,
        uploadedAt: new Date()
      };
    }

    const expense = new ManagerExpense({
      managerId,
      amount,
      category,
      description,
      paymentType,
      bill,
      date: date ? new Date(date) : new Date()
    });

    await expense.save();

    // If payment type is Wallet, update wallet balance
    if (paymentType === 'Wallet') {
      let wallet = await ManagerWallet.findOne({ managerId });

      if (!wallet) {
        wallet = new ManagerWallet({ managerId });
      }

      const balanceBefore = wallet.balance;
      wallet.totalSpent += Number(amount);
      await wallet.save();

      // Create transaction record
      const transaction = new WalletTransaction({
        managerId,
        type: 'debit',
        amount,
        description: `Expense: ${category}${description ? ' - ' + description : ''}`,
        reference: expense._id,
        balanceBefore,
        balanceAfter: wallet.balance
      });
      await transaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    logger.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all expenses for a manager
export const getExpenses = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;

    // Check if user is admin or the manager themselves
    if (!req.user.roles.includes('admin') && req.user._id.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = { managerId };

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await ManagerExpense.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('managerId', 'name email');

    const total = await ManagerExpense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get wallet transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    // Check if user is admin or the manager themselves
    if (!req.user.roles.includes('admin') && req.user._id.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = { managerId };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('managerId', 'name email')
      .populate('reference', 'category description');

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all managers' wallets (Admin only)
export const getAllWallets = async (req, res) => {
  try {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const wallets = await ManagerWallet.find({})
      .populate('managerId', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    logger.error('Error getting all wallets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get expense summary for admin
export const getExpenseSummary = async (req, res) => {
  try {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const summary = await ManagerExpense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            managerId: '$managerId',
            category: '$category'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.managerId',
          categories: {
            $push: {
              category: '$_id.category',
              totalAmount: '$totalAmount',
              count: '$count'
            }
          },
          totalSpent: { $sum: '$totalAmount' },
          totalExpenses: { $sum: '$count' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'manager'
        }
      },
      {
        $unwind: '$manager'
      },
      {
        $project: {
          managerId: '$_id',
          managerName: '$manager.name',
          managerEmail: '$manager.email',
          totalSpent: 1,
          totalExpenses: 1,
          categories: 1,
          _id: 0
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting expense summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export expenses to CSV
export const exportExpensesCSV = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user is admin or the manager themselves
    if (!req.user.roles.includes('admin') && req.user._id.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = { managerId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await ManagerExpense.find(query)
      .sort({ date: -1 })
      .populate('managerId', 'name email');

    // Create CSV content
    let csv = 'Date,Amount,Category,Description,Payment Type,Bill Status\n';

    expenses.forEach(expense => {
      const billStatus = expense.bill && expense.bill.filePath ? 'Uploaded' : 'Missing';
      csv += `${expense.date.toISOString().split('T')[0]},${expense.amount},${expense.category},"${expense.description || ''}",${expense.paymentType},${billStatus}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses_${managerId}_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting expenses to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
