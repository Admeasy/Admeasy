const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const { verifyAdminToken } = require('../middleware/adminAuth');


router.get('/', verifyAdminToken, async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

router.post('/', async (req,res) => {
    try {
        const { email, msg } = req.body;
        
        if (!email || !msg) {
            res.status(400).json('Missing Fields');
        }

        const message = new Message({
            email: email,
            text: msg
        });

        await message.save();
        res.json('Message sent successfully!');
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

router.delete('/:id', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Message.findByIdAndDelete(id);
        
        if (!message) {
            return res.status(404).json('Message not found');
        }
        
        res.json('Message deleted successfully');
    } catch (e) {
        res.status(500).json('Internal Server Error');
        console.log(e);
    }
})

module.exports = router;