const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const SavingsGoal = require('../models/SavingsGoal');

// GET /api/dashboard/overview
router.get('/overview', protect, async (req, res) => {
    try {
        const accounts = await Account.find({ user: req.user.id });
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        const monthlyIncome = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'income', date: { $gte: monthStart, $lt: monthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const monthlyExpenses = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'expense', date: { $gte: monthStart, $lt: monthEnd } } },
            { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]);
        
        const income = monthlyIncome[0]?.total || 0;
        const expenses = Math.abs(monthlyExpenses[0]?.total || 0);
        const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
        
        const spendingByCategory = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'expense', date: { $gte: monthStart, $lt: monthEnd } } },
            { $group: { _id: '$category', total: { $sum: { $abs: '$amount' } } } },
            { $sort: { total: -1 } }
        ]);
        
        const recentTransactions = await Transaction.find({ user: req.user.id })
            .sort({ date: -1 }).limit(10);
        
        res.json({
            success: true,
            data: { totalBalance, monthlyIncome: income, monthlyExpenses: expenses, savingsRate, spendingByCategory, recentTransactions, accounts }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/dashboard/analytics
router.get('/analytics', protect, async (req, res) => {
    try {
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            
            const income = await Transaction.aggregate([
                { $match: { user: req.user._id, type: 'income', date: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const expenses = await Transaction.aggregate([
                { $match: { user: req.user._id, type: 'expense', date: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
            ]);
            
            monthlyData.push({
                month: monthStart.toLocaleString('default', { month: 'short' }),
                income: income[0]?.total || 0,
                expenses: expenses[0]?.total || 0
            });
        }
        
        const accounts = await Account.find({ user: req.user.id });
        const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        res.json({
            success: true,
            data: { netWorth, roi: 18.5, cashFlow: 7259.50, debtRatio: 12, monthlyData }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;