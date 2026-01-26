const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { extractPublicId } = require('../utils/cloudinary');
const MentorshipRequest = require('../models/mentorshipRequestSchema');
const Mentor = require('../models/mentorSchema');
const { verifyAdminToken } = require('../middleware/adminAuth');
const { Applications } = require('../db');
const nodemailer = require('nodemailer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const getPublicIdFromUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    try {
        return extractPublicId(imageUrl);
    } catch (error) {
        return null;
    }
};

// Get all collection names in Applications DB except 'messages'
router.get('/', verifyAdminToken, async (req, res) => {
    try {
        const collections = await Applications.db.listCollections().toArray();
        const filtered = collections
            .map(col => col.name)
            .filter(name => name.toLowerCase() !== 'messages' && name.toLowerCase() !== 'blogs' && name.toLowerCase() !== 'enrollments');
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
        // Check if collection exists
        const collections = await Applications.db.listCollections().toArray();
        const exists = collections.some(col => col.name === collectionName);
        if (!exists) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        let Model;
        try {
            Model = Applications.model(collectionName);
        } catch (e) {
            Model = Applications.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
        }
        // Add a timeout to the query in case the DB is slow
        const docs = await Model.find();
        res.json(docs);
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
    }
});

router.post('/schedule', async (req, res) => {
    try {
        console.log(req.body);
        const r = await fetch('https://script.google.com/macros/s/AKfycby-l-09yN5QJkJhHOlx2jwcXkl8Km-jpisyiZ2KcNpYCjmahO-8MTQlGe0U-FlVxnzfxA/exec', {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {
                "Content-Type": "text/plain",
            },
        });

        const data = await r.text();
        console.log(data)

        if (!r.ok || !data.includes('success')) {
            console.log(r.ok, data)
            res.status(500).json('Failed to schedule an Interview.');
        }

        res.status(200).json('Scheduled Interview Successfully!');
    } catch (e) {
        res.status(500).json(e);
    }
})

// More specific routes must come before general routes
router.post('/mentorship/accept/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const applicant = await MentorshipRequest.findById(id);

        if (!applicant) {
            return res.status(404).json('Applicant not found!');
        }

        applicant.isAccepted = true;
        await applicant.save();

        // Extract values for manual interpolation
        const applicantName = applicant.name || 'Valued Applicant';

        if (process.env.NODE_ENV === 'production') {
            accountCreationLink = `https://admeasy.in/mentors/register?id=${id}`;
        } else {
            accountCreationLink = `http://localhost:5173/mentors/register?id=${id}`;
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.in",
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_EMAIL, // noreply@admeasy.in
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Admeasy" <${process.env.SMTP_EMAIL}>`,
            to: applicant.email,
            subject: "Your Application for Mentorship has been accepted!",
            html: `
        <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            background: white;
                            padding: 40px 20px;
                            line-height: 1.6;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 16px;
                            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 40px 30px;
                            text-align: center;
                            color: #ffffff;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            margin: 0 auto 20px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 36px;
                            font-weight: bold;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .title {
                            font-size: 32px;
                            font-weight: 700;
                            color: #2d3748;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .text {
                            font-size: 16px;
                            color: #4a5568;
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .highlight {
                            color: #667eea;
                            font-weight: 600;
                        }
                        .cta-section {
                            text-align: center;
                            margin: 40px 0;
                        }
                        .cta-text {
                            font-size: 16px;
                            color: #4a5568;
                            margin-bottom: 20px;
                        }
                        .apply-btn {
                            display: inline-block;
                            padding: 16px 40px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            transition: transform 0.2s, box-shadow 0.2s;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                            border: none;
                            cursor: pointer;
                        }
                        .apply-btn:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                        }
                        .footer {
                            background: #f7fafc;
                            padding: 30px;
                            border-top: 1px solid #e2e8f0;
                        }
                        .footer-text {
                            font-size: 14px;
                            color: #718096;
                            margin-bottom: 15px;
                            line-height: 1.8;
                        }
                        .contact-info {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #e2e8f0;
                        }
                        .contact-link {
                            color: #667eea;
                            text-decoration: none;
                            font-weight: 600;
                        }
                        .contact-link:hover {
                            text-decoration: underline;
                        }
                        .signature {
                            margin-top: 15px;
                            font-weight: 600;
                            color: #2d3748;
                        }
                        @media only screen and (max-width: 600px) {
                            body {
                                padding: 20px 10px;
                            }
                            .content {
                                padding: 30px 20px;
                            }
                            .title {
                                font-size: 26px;
                            }
                            .apply-btn {
                                padding: 14px 30px;
                                font-size: 15px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1 class="title" style="color: #ffffff; margin: 0;">Welcome Aboard! 🎉</h1>
                        </div>
                        <div class="content">
                            <p class="text">
                                Congratulations, <span class="highlight">${applicantName}</span>! We're thrilled to welcome you to <strong>Admeasy's Mentor Family</strong>.
                            </p>
                            <p class="text">
                                You're now part of an incredible community of mentors who guide students and help them pursue their dreams. We believe in your potential to make a meaningful impact and help shape the future of our nation.
                            </p>
                            <div class="cta-section">
                                <p class="cta-text">Ready to get started? Create your Admeasy Mentor Profile:</p>
                                <a href='${accountCreationLink}' class="apply-btn">Create Account</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p class="footer-text">
                                <strong>Best Regards,</strong><br>
                                Team Admeasy
                            </p>
                            <div class="contact-info">
                                <p class="footer-text">
                                    For any help or queries, contact us:<br>
                                    <a href="tel:+919358691990" class="contact-link">+91 93586 91990</a>
                                </p>
                                <p class="signature">
                                    Meeral Babani<br>
                                    HR @ Admeasy
                                </p>
                            </div>
                            <br/>
                            <p style="font-size: 12px; color: #999; text-align: center;">
                            © ${new Date().getFullYear()} Admeasy — Helping Students Make Better Decisions.
                            </p>
                        </div>
                    </div>
                </body>
            </html>`});

        res.status(200).json('Application Accepted and Invitation sent');
    } catch (e) {
        console.error('Error in /mentorship/accept:', e);
        res.status(500).json('Internal Server Error');
    }
})

router.post('/mentorship', upload.single('image'), async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json('Missing request body');
        }
        const { name, email, phone, college, course } = req.body;

        if (!name || !email || !phone || !college || !course) {
            return res.status(400).json('Missing required fields');
        }

        // Check if applicant already exists in mentorship requests
        const existingApplication = await MentorshipRequest.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });
        if (existingApplication) {
            console.log(existingApplication.name);
            return res.status(409).json('Applicant already exists');
        }

        // Check if applicant is already a mentor
        const existingMentor = await Mentor.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });
        if (existingMentor) {
            console.log(existingMentor);
            return res.status(403).json('Mentor already exists');
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

        // Handle image upload to Cloudinary
        if (req.file) {
            try {
                // When using memoryStorage, req.file.buffer exists instead of req.file.path
                const fileInput = req.file.buffer || req.file.path;
                console.log("Uploading image to Cloudinary:", req.file.originalname);
                const cloudUrl = await uploadToCloudinary(fileInput, 'applications/mentorship');
                applicant.image = cloudUrl;
                console.log("Image uploaded to Cloudinary:", cloudUrl);
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                return res.status(500).json({ success: false, message: 'Error uploading image' });
            }
        } else {
            // If no file is provided, return error since image is required
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        await applicant.save();
        res.status(200).json('Application submitted!');
    } catch (e) {
        console.log(e);
        res.status(500).json('Internal Server Error');
    }
})

router.post('/mentorship/verify', async (req, res) => {
    try {
        if (!req.body || !req.body.id) {
            console.log(req.body);
            return res.status(400).json('Missing id in request body');
        }
        const { id } = req.body;
        const applicant = await MentorshipRequest.findById(id);
        if (!applicant) {
            return res.status(404).json('Applicant not found');
        }
        if (applicant.isAccepted) {
            res.status(200).json();
        } else {
            res.status(401).json('Unauthorized Request');
        }
    } catch (e) {
        console.error('Error in /mentorship/verify:', e);
        res.status(500).json('Internal Server Error');
    }
})

router.post('/mentorship/verify2', async (req, res) => {
    try {
        if (!req.body || !req.body.email || !req.body.id) {
            return res.status(400).json({ message: 'Missing email or id in request body' });
        }
        const { email, id } = req.body;

        // Find applicant by id first
        const applicant = await MentorshipRequest.findById(id);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        // Check if applicant is accepted
        if (!applicant.isAccepted) {
            return res.status(401).json({ message: 'Unauthorized Access' });
        }

        if (email !== applicant.email) {
            return res.status(403).json({ message: 'Email does not match the application' });
        }

        res.status(200).json({ message: 'Verification successful' });
    } catch (e) {
        console.error('Error in /mentorship/verify2:', e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

//Route for getting image of the applicant
router.get('/mentorship/:id/pic', async (req, res) => {
    try {
        const { id } = req.params;
        const applicant = await MentorshipRequest.findById(id);
        if (!applicant) {
            return res.status(404).json('Applicant not found');
        }
        res.status(200).json(applicant.image);
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

router.delete('/mentorship/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const applicant = await MentorshipRequest.findByIdAndDelete(id);
        if (!applicant) {
            return res.status(404).json('Application not found');
        }
        if (applicant.image) {
            const publicId = getPublicIdFromUrl(applicant.image);
            await deleteFromCloudinary(publicId);
        }
        res.status(200).json('Application deleted successfully');
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

module.exports = router;