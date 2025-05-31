const mongoose = require('mongoose');

const ScholarshipsSchema = new mongoose.Schema({
    scholarship: [{
        title: {
        type: String,
        required: true,
        trim: true
    },
    eligibilityCriteria: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: String,
        required: true,
        trim: true
    }
    }]
})

module.exports = mongoose.model('Scholarships', ScholarshipsSchema);