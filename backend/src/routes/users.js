const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route  GET /api/users/search
// @desc   Search users within the same organization
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json({ success: true, users: [] });

    // Only search within same orgId
    const query = {
      orgId: req.user.orgId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { userId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('name userId role department jobTitle avatar')
      .limit(20)
      .lean();

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
