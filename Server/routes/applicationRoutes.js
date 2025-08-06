const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
const MentorshipRequest = require('../models/mentorshipRequestSchema');
const { verifyAdminToken } = require('../middleware/adminAuth');
const { Applications } = require('../db');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all collection names in Applications DB except 'messages'
router.get('/', verifyAdminToken, async (req, res) => {
    try {
        const collections = await Applications.db.listCollections().toArray();
        const filtered = collections
            .map(col => col.name)
            .filter(name => name.toLowerCase() !== 'messages');
        res.json({ collections: filtered });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch collections', details: err.message });
    }
});

// Get all applications from a specific collection
router.get('/applications/:collectionName', verifyAdminToken, async (req, res) => {
    try {
        const { collectionName } = req.params;
        // Prevent access to system collections
        if (!collectionName || collectionName.toLowerCase() === 'messages') {
            return res.status(400).json({ error: 'Invalid collection name' });
        }
        console.log('Collection name:', collectionName);
        // Check if collection exists
        const collections = await Applications.db.listCollections().toArray();
        const exists = collections.some(col => col.name === collectionName);
        if (!exists) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        console.log('Collection exists');
        let Model;
        try {
            Model = Applications.model(collectionName);
        } catch (e) {
            Model = Applications.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
        }
        console.log('Model:', Model);
        // Add a timeout to the query in case the DB is slow
        const docs = await Model.find();
        console.log(`Fetched ${docs.length} documents from collection: ${collectionName}`);
        res.json(docs);
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
    }
});

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

router.get('/mentorship/:id/pic', async (req, res) => {
    try {
        const { id } = req.params;
        const applicant = await MentorshipRequest.findById(id);
        if (!applicant) {
            return res.status(404).json('Picture not found');
        }
        const image = await b2.getDownloadAuthorization(applicant.image);
        res.status(200).json(image.url);
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

module.exports = router;