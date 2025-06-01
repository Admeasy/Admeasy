const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const College = require('../models/collegeSchema');
const data = require('../data.json')


let conn = mongoose.connect(process.env.COLLEGES_MONGO_URI)

if (conn) {
    console.log('Connected to MongoDB');
} else {
    console.error('Failed to connect to MongoDB');
}


const coll = new College(data);
coll.save()

//Route to create a new college
router.post('/', async (req, res) => {
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

    await newCollege.save();
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

router.get('/:id', async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json(college);
        res.status(300).json('College sent')
    } catch (error) {
        res.status(500).json({ message: 'Error fetching college', error: error.message });
    }
});

module.exports = router;