const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        monthly: {
            type: Number,
            required: true
        },
        yearly: {
            type: Number,
            required: true
        }
    },
    originalPrice: {
        monthly: {
            type: Number,
            required: true
        },
        yearly: {
            type: Number,
            required: true
        }
    },
    features: {
        type: [String],
        required: true
    }
});

module.exports = Admeasy.model('Subscription plans', subscriptionPlanSchema);