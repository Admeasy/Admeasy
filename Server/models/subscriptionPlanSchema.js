const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    features: {
        type: [String],
        required: true
    }
});

module.exports = Admeasy.model('Subscription plans', subscriptionPlanSchema);