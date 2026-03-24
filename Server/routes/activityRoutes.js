const express = require('express');
const router = express.Router();
const Mentor = require('../models/mentorSchema');

/**
 * GET /api/activity/mentor-stats
 * Counts mentors by college.name substring (case-insensitive).
 */
router.get('/mentor-stats', async (req, res) => {
  try {
    const [iitMentors, iimMentors, srccMentors, hinduMentor] = await Promise.all([
      Mentor.countDocuments({
        'college.name': { $regex: /Indian Institute of Technology/i },
      }),
      Mentor.countDocuments({
        'college.name': { $regex: /Indian Institute of Management/i },
      }),
      Mentor.countDocuments({
        'college.name': { $regex: /Shri Ram College of Commerce/i },
      }),
      Mentor.countDocuments({
        $and: [
          { 'college.name': { $regex: /hindu college/i } },
          { 'college.name': { $regex: /delhi university/i } },
        ],
      }),
    ]);

    res.json({ iitMentors, iimMentors, srccMentors, hinduMentor });
  } catch (err) {
    console.error('activity mentor-stats', err);
    res.status(500).json({ message: 'Failed to load mentor stats' });
  }
});

module.exports = router;
