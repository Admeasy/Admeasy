const express = require('express');
const router = express.Router();
const Enrollment = require('../models/enrollmentSchema')
const { verifyAdminToken } = require('../middleware/adminAuth');

// ✅ Get all enrollments (admin only)
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find().sort({ createdAt: -1 });
    res.json(enrollments);
  } catch (e) {
    console.log(e);
    res.status(500).json('Internal Server Error');
  }
});

// ✅ Create new enrollment
router.post('/',verifyAdminToken, async (req, res) => {
  try {
    const { name, email, number,bannerName } = req.body;

    if (!name || !email || !number||!bannerName) {
      return res.status(400).json('Missing Fields');
    }

    const enrollment = new Enrollment({ name, email, number,bannerName });
    await enrollment.save();

    res.json('Enrollment submitted successfully!');
  } catch (e) {
    console.log(e);
    res.status(500).json('Internal Server Error');
  }
});

// ✅ Delete enrollment (admin only)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findByIdAndDelete(id);

    if (!enrollment) {
      return res.status(404).json('Enrollment not found');
    }

    res.json('Enrollment deleted successfully');
  } catch (e) {
    console.log(e);
    res.status(500).json('Internal Server Error');
  }
});

module.exports = router;
