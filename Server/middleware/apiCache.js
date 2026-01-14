const NodeCache = require("node-cache");

// Initialize cache with a stdTTL of 10 minutes (600 seconds) by default
const cache = new NodeCache({ stdTTL: 600 });

const apiCache = (duration) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl || req.url;
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

module.exports = apiCache;
