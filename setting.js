const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// PUT /api/settings/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, phone, country } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { fullName, phone, country }, { new: true });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/settings/preferences
router.put('/preferences', protect, async (req, res) => {
    try {
        const { currency, theme, emailNotifications } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { currency, theme, emailNotifications }, { new: true });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;