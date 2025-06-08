const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const College = require('../models/collegeSchema');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const BackblazeB2Client = require('../b2Client');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Configure multer to use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 30 // maximum 10 files
    }
});

let conn = mongoose.connect(process.env.MONGODB_URI)

if (conn) {
    console.log('Connected to MongoDB');
} else {
    console.error('Failed to connect to MongoDB');
}

// Helper function to upload files to B2 directly from memory
async function uploadToB2(files, collegeId) {
    const b2Client = new BackblazeB2Client();

    try {
        // Validate B2_BUCKET_URL
        if (!process.env.B2_BUCKET_URL) {
            throw new Error('B2_BUCKET_URL environment variable is not set');
        }

        // Clean the URL - remove any @ symbol and trailing slashes
        let baseUrl = process.env.B2_BUCKET_URL;
        if (baseUrl.startsWith('@')) {
            baseUrl = baseUrl.substring(1);
        }
        baseUrl = baseUrl.replace(/\/+$/, '');

        // Validate the URL format
        try {
            const urlObject = new URL(baseUrl);
        } catch (e) {
            console.error('URL parsing error:', e);
            throw new Error(`Invalid B2_BUCKET_URL format: ${e.message} (URL: ${baseUrl})`);
        }

        // Upload all files in parallel
        const uploadPromises = files.map(file => {
            const fileName = `${collegeId}/${uuidv4()}${path.extname(file.originalname)}`;
            return b2Client.uploadBuffer(file.buffer, fileName);
        });

        await Promise.all(uploadPromises);

        // Generate the final URL
        const finalUrl = `${baseUrl}/${collegeId}`;

        // Return only the folder URL
        return finalUrl;
    } catch (error) {
        console.error('Error uploading files to B2:', error);
        // Add more context to the error
        throw new Error(`B2 Upload failed: ${error.message}`);
    }
}

//Route to create a new college
router.post('/', upload.array('gallery'), async (req, res) => {
    let newCollege = null;
    let galleryUrl = '';

    try {
        const collegeId = new mongoose.Types.ObjectId();

        // Handle file upload first if files are present
        if (req.files && req.files.length > 0) {
            try {
                galleryUrl = await uploadToB2(req.files, collegeId.toString());
            } catch (uploadError) {
                console.error('Detailed upload error:', uploadError);
                console.error('Upload error stack:', uploadError.stack);
                throw new Error(`File upload failed: ${uploadError.message}`);
            }
        } else {
            throw new Error('Gallery images are required');
        }

        // Parse nested objects from form data
        try {
            const rating = JSON.parse(req.body.rating);
            const contact = JSON.parse(req.body.contact);
            const package = JSON.parse(req.body.package);
            const courses = JSON.parse(req.body.courses);

            // Create and save college document with gallery URL
            newCollege = new College({
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
        } catch (parseError) {
            console.error('Error parsing form data:', parseError);
            throw new Error(`Invalid form data: ${parseError.message}`);
        }
    } catch (error) {
        console.error('Final error in college creation:', error);
        console.error('Error stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString(),
            stack: error.stack
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

// Route to update a college
router.put('/:id', upload.array('gallery'), async (req, res) => {
    try {
        const collegeId = req.params.id;
        let galleryUrl = req.body.existingGallery;

        // Handle file upload if new files are present
        if (req.files && req.files.length > 0) {
            try {
                galleryUrl = await uploadToB2(req.files, collegeId);
            } catch (uploadError) {
                throw new Error(`File upload failed: ${uploadError.message}`);
            }
        }

        // Ensure we have either new files or existing gallery URL
        if (!galleryUrl) {
            throw new Error('Gallery URL is required');
        }

        // Parse nested objects from form data
        const rating = JSON.parse(req.body.rating);
        const contact = JSON.parse(req.body.contact);
        const package = JSON.parse(req.body.package);
        const courses = JSON.parse(req.body.courses);
        const moreInfo = JSON.parse(req.body.moreInfo || '[]');

        const updateData = {
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
            courses: courses,
            moreInfo: moreInfo
        };

        // Update college document
        const updatedCollege = await College.findByIdAndUpdate(
            collegeId,
            updateData,
            {
                new: true, // Return the updated document
                runValidators: true // Run validators on update
            }
        );

        if (!updatedCollege) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        res.json({
            success: true,
            message: 'College updated successfully',
            college: updatedCollege
        });
    } catch (error) {
        console.error('Error updating college:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating college',
            error: error.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        // First, get the college to be deleted
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Initialize B2 client
        const b2Client = new BackblazeB2Client();

        try {
            // Delete all files in the college's gallery folder
            await b2Client.deleteFiles(req.params.id);
        } catch (b2Error) {
            console.error('Error deleting gallery files:', b2Error);
            // Continue with college deletion even if gallery deletion fails
        }

        // Delete the college from the database
        await College.findByIdAndDelete(req.params.id);
        res.json({ message: 'College deleted successfully' });
    } catch (error) {
        console.error('Error in delete route:', error);
        res.status(500).json({ message: 'Error deleting college', error: error.message });
    }
});

// Add route to get gallery images
router.get('/gallery/:id', async (req, res) => {
    try {
        const collegeId = req.params.id;
        const college = await College.findById(collegeId);

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Initialize B2 client
        const b2Client = new BackblazeB2Client();

        try {
            // List all files in the college's folder
            const files = await b2Client.listFiles(collegeId);

            if (!files || files.length === 0) {
                return res.json([]);
            }

            // Get authorized URLs for each file
            const fileUrls = await Promise.all(files.map(async (file) => {
                const auth = await b2Client.getDownloadAuthorization(file.fileName);
                return auth.url;
            }));

            res.json(fileUrls);
        } catch (b2Error) {
            console.error('Error accessing B2:', b2Error);
            res.status(500).json({ message: 'Error fetching gallery images', error: b2Error.message });
        }
    } catch (error) {
        console.error('Error in gallery route:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

// Add new route to proxy image requests
router.get('/b2/signed-url/:collegeId/:fileName', async (req, res) => {
    const prefix = `${req.params.collegeId}/`;
    const b2 = new BackblazeB2Client();

    try {
        const result = await b2.getDownloadAuthorization(prefix); // valid for 3 hours
        res.json(result);
    } catch (error) {
        console.error('Error in signed-url route:', error);
        res.status(500).json({ message: 'Error generating signed URL', error: error.message });
    }
});

module.exports = router;