const NodeCache = require("node-cache");
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

// Initialize cache with a stdTTL of 10 minutes (600 seconds) by default
const cache = new NodeCache({ stdTTL: 600 });

// Helper to get user ID from request (supports both users and mentors)
async function getUserIdFromRequest(req) {
    // Check session first
    if (req.session?.userId) return `user:${req.session.userId}`;
    if (req.session?.mentorId) return `mentor:${req.session.mentorId}`;
    
    // Check req.user/req.mentor (set by auth middleware)
    if (req.user?._id) return `user:${req.user._id}`;
    if (req.mentor?._id) return `mentor:${req.mentor._id}`;
    
    // Try to get from token
    const token = req.cookies?.accessToken;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            if (decoded.role === 'mentor') {
                return `mentor:${decoded.id || decoded._id}`;
            } else {
                return `user:${decoded.id || decoded._id}`;
            }
        } catch (err) {
            // Token invalid
        }
    }
    
    return 'anonymous';
}

const apiCache = (duration, options = {}) => async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Build cache key - include user ID if user-specific caching is enabled
    let key = req.originalUrl || req.url;
    if (options.userSpecific) {
        const userId = await getUserIdFromRequest(req);
        key = `${key}:${userId}`;
    }

    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        // If cache hit, send cached response
        // Ensure we set the correct content type
        res.setHeader('Content-Type', 'application/json');
        return res.json(cachedResponse);
    } else {
        // If cache miss, intercept res.json to store the response
        const originalJson = res.json;

        res.json = function (body) {
            // Store in cache
            // Use the provided duration or default to global TTL
            cache.set(key, body, duration);

            // Call original res.json
            return originalJson.call(this, body);
        };

        next();
    }
};

// Export function to clear cache
apiCache.clear = (pattern) => {
    if (pattern) {
        const keys = cache.keys();
        keys.forEach(key => {
            if (key.includes(pattern)) {
                cache.del(key);
            }
        });
    } else {
        cache.flushAll();
    }
};

module.exports = apiCache;
