const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.post('/anonymous', async (req, res) => {
  try {
    const anonymousId = 'user_' + Math.random().toString(36).substr(2, 9);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = new User({
      anonymousId,
      color: randomColor
    });

    await user.save();
    res.json({ anonymousId, color: randomColor });
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    res.status(500).json({ message: 'Error creating anonymous user' });
  }
});

module.exports = router;