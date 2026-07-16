const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// GET /api/accounts
router.get('/', protect, async (req, res) => {
    try {
        const accounts = await Account.find({ user: req.user.id });
        res.json({ success: true, count: accounts.length, data: accounts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/accounts/:type
router.get('/:type', protect, async (req, res) => {
    try {
        const { type } = req.params;
        const accounts = await Account.find({ user: req.user.id, type });
        const transactions = await Transaction.find({
            user: req.user.id,
            account: { $in: accounts.map(a => a._id) }
        }).sort({ date: -1 }).limit(10);
        
        res.json({ success: true, data: { accounts, transactions } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;