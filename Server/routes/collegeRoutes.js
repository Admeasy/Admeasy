const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const College = require('../models/collegeSchema');


const app = express();

let conn = mongoose.connect(process.env.COLLEGES_MONGO_URI)

if (conn) {
    console.log('Connected to MongoDB');
} else {
    console.error('Failed to connect to MongoDB');
}


//Route to create a new college
router.post('/', (req, res) => {
    const newCollege = new College({
        name: req.body.name,
        logo: req.body.logo,
        rating: req.body.rating,
        location: req.body.location,
        establishedYear: req.body.establishedYear,
        type: req.body.type,
        coursesOffered: req.body.coursesOffered,
        website: req.body.website,
        desc: req.body.description
    });

    newCollege.save();
});

// Route to get all colleges
router.get('/', async (req, res) => {
    try {
        const colleges = await College.find();
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching colleges', error });
    }
});

module.exports = router;