const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/transactions
router.get('/', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ date: -1 }).limit(20);
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/transactions
router.post('/', protect, async (req, res) => {
    try {
        req.body.user = req.user.id;
        const transaction = await Transaction.create(req.body);
        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;