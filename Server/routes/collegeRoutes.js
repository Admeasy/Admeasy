const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Minio = require('minio');
const College = require('../models/collegeSchema');
const data = require('../data.json')


let conn = mongoose.connect(process.env.COLLEGES_MONGO_URI)

if (conn) {
    console.log('Connected to MongoDB');
} else {
    console.error('Failed to connect to MongoDB');
}

// const minioClient = new Minio.Client({
//     endPoint: process.env.MINIO_ENDPOINT,
//     port: parseInt(process.env.MINIO_PORT),
//     useSSL: false,
//     accessKey: process.env.MINIO_ACCESS_KEY,
//     secretKey: process.env.MINIO_SECRET_KEY
// });

// Test MinIO connection
// minioClient.listBuckets()
//     .then(() => {
//         console.log('Connected to MinIO server');
//     })
//     .catch(err => {
//         console.error('MinIO connection error:', err);
//     });

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

// router.get('/gallery/:id', async (req, res) => {
//     try {
//         const id = req.params.id;
//         const files = [];

//         // First check if bucket exists
//         const bucketExists = await minioClient.bucketExists('images').catch(err => {
//             console.error('Error checking bucket:', err);
//             return false;
//         });

//         if (!bucketExists) {
//             return res.status(404).json({ message: 'Gallery not available', error: 'Storage bucket not found' });
//         }

//         // Use Promise to handle stream events
//         await new Promise((resolve, reject) => {
//             const stream = minioClient.listObjectsV2('images', `${id}/`, true);

//             stream.on('data', obj => {
//                 // Only push files, not directories
//                 if (!obj.name.endsWith('/')) {
//                     files.push(obj.name.replace(`${id}/`, ''));
//                 }
//             });

//             stream.on('error', error => {
//                 console.error('Stream error:', error);
//                 reject(error);
//             });

//             stream.on('end', () => {
//                 resolve();
//             });
//         });

//         // If no files found, return appropriate message
//         if (files.length === 0) {
//             return res.json([]);
//         }

//         res.json(files);
//     } catch (error) {
//         console.error('Gallery fetch error:', error);
//         res.status(500).json({
//             message: 'Error fetching gallery',
//             error: error.message || 'Internal server error'
//         });
//     }
// });

module.exports = router;