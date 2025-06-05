const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const College = require('../models/collegeSchema');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const BackblazeB2Client = require('../b2Client');
const path = require('path');
const fs = require('fs');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

let conn = mongoose.connect(process.env.COLLEGES_MONGO_URI)

if (conn) {
    console.log('Connected to MongoDB');
} else {
    console.error('Failed to connect to MongoDB');
}

// Helper function to upload files to B2
async function uploadToB2(files, collegeId) {
    const b2Client = new BackblazeB2Client();

    for (const file of files) {
        try {
            const fileName = `${collegeId}/${file.filename}`;
            await b2Client.uploadFile(file.path, fileName);
            
            // Clean up local file after upload
            fs.unlinkSync(file.path);
        } catch (error) {
            console.error('Error uploading file to B2:', error);
            throw error;
        }
    }

    // Return only the folder URL
    return `${process.env.B2_BUCKET_URL}/${collegeId}`;
}

//Route to create a new college
router.post('/', upload.array('gallery'), async (req, res) => {
    try {
        const collegeId = new mongoose.Types.ObjectId();
        let galleryUrl = '';

        // Upload gallery images to B2 if files were uploaded
        if (req.files && req.files.length > 0) {
            galleryUrl = await uploadToB2(req.files, collegeId.toString());
        }

        // Parse nested objects from form data
        const rating = JSON.parse(req.body.rating);
        const contact = JSON.parse(req.body.contact);
        const package = JSON.parse(req.body.package);
        const courses = JSON.parse(req.body.courses);

        // Create new college document
        const newCollege = new College({
            _id: collegeId,
            name: req.body.name,
            desc: req.body.desc,
            logo: req.body.logo,
            rating: rating,
            location: req.body.location,
            establishedYear: req.body.establishedYear,
            type: req.body.type,
            website: req.body.website,
            contact: contact,
            keywords: JSON.parse(req.body.keywords),
            facilities: JSON.parse(req.body.facilities),
            package: package,
            recruiters: JSON.parse(req.body.recruiters),
            placementRate: req.body.placementRate,
            gallery: galleryUrl,
            whyChoose: JSON.parse(req.body.whyChoose),
            courses: courses
        });

        await newCollege.save();
        res.status(201).json({ 
            success: true, 
            message: 'College created successfully',
            collegeId: collegeId
        });
    } catch (error) {
        console.error('Error creating college:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating college', 
            error: error.message 
        });
    }
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
    } catch (error) {
        res.status(500).json({ message: 'Error fetching college', error: error.message });
    }
});

router.get('/:collegeId/courses/:courseId', async (req, res) => {
    try {
        const college = await College.findById(req.params.collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const course = college.courses.find(course => course._id.toString() === req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await College.findByIdAndDelete(req.params.id);
        res.json({ message: 'College deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting college', error: error.message });
    }
});

module.exports = router;