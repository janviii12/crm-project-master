import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getWalletBalance,
  addWalletAmount,
  addExpense,
  getExpenses,
  getWalletTransactions,
  getAllWallets,
  getExpenseSummary,
  exportExpensesCSV
} from '../controllers/pettyCashController.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Wallet management routes
router.get('/wallet/:managerId', getWalletBalance);
router.post('/wallet/:managerId/add-amount', upload.single('bill'), addWalletAmount);
router.get('/wallets', getAllWallets); // Admin only

// Expense management routes
router.post('/expense', upload.single('bill'), addExpense);
router.get('/expenses/:managerId', getExpenses);
router.get('/expenses/:managerId/export', exportExpensesCSV);

// Transaction history
router.get('/transactions/:managerId', getWalletTransactions);

// Admin reports
router.get('/summary', getExpenseSummary); // Admin only

export default router;
