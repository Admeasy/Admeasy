const express = require('express');
const router = express.Router();
const Mentor = require('../models/mentorSchema');


router.get('/', async (req, res) => {
    try {
        const mentors = await Mentor.find();
        res.status(200).json(mentors);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

router.get('/:username', async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ username: req.params.username });
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

router.post('/', async (req, res) => {
    try {
        const { image, name, email, phone, college, course } = req.body;
        
        const mentor = new Mentor({ image, name, email, phone, college, course });
        await mentor.save();
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

router.put('/:username', async (req, res) => {
    try {
        const { name, email, phone, college, course, tagline, bio, competitiveExamsAttempted } = req.body;
        const mentor = await Mentor.findOneAndUpdate({ username: req.params.username }, { name, email, phone, college, course, tagline, bio, competitiveExamsAttempted }, { new: true });
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

router.delete('/:username', async (req, res) => {
    try {
        const mentor = await Mentor.findOneAndDelete({ username: req.params.username });
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})