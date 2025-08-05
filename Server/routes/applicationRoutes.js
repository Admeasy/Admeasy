const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
const MentorshipRequest = require('../models/mentorshipRequestSchema');


const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/mentorship', async (req, res) => {
    try {
        const applications = await MentorshipRequest.find();
        res.json(applications);
    } catch (e) {
        res.status(500).josn('Internal Server Error');
        console.log(e);
    }
})

router.post('/mentorship', upload.single('image'), async (req, res) => {
    try {
        const { name, email, phone, college, course } = req.body;

        if (!name || !email || !phone || !college || !course) {
            res.status(400).json('Missing required fields');
        }
        
        const id = new mongoose.Types.ObjectId();

        const applicant = new MentorshipRequest({
            _id: id,
            name: name,
            email: email,
            phone: phone,
            college: college,
            course: course
        });

        if (req.file) {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const fileName = 'applications/mentors/' + id + ext;
            await b2.uploadBuffer(req.file.buffer, fileName);
            applicant.image = fileName;
        }

        await applicant.save();
        res.status(200).json('Application submitted!');
    } catch (e) {
        console.log(e);
        res.status(500).json('Internal Server Error');
    }
})

module.exports = router;