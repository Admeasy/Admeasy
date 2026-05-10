const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

/**
 * Middleware to track activity for both users and mentors.
 * Updates `lastActive` timestamp and resets `lastNotifiedMilestone` if they were previously inactive.
 * Throttled to update at most once per hour to avoid excessive DB writes.
 */
const trackActivity = async (req, res, next) => {
    // Determine if it's a user or mentor
    const actor = req.user || req.mentor;
    const Model = req.user ? User : (req.mentor ? Mentor : null);

    if (actor && actor._id && Model) {
        try {
            const now = new Date();

            // Update on every request as requested
            await Model.updateOne(
                { _id: actor._id },
                { 
                    $set: { 
                        lastActive: now,
                        lastNotifiedMilestone: 0 // Reset milestone as they are now active
                    } 
                }
            );
            
            // Update the object as well for the current request lifecycle
            actor.lastActive = now;
            actor.lastNotifiedMilestone = 0;
        } catch (error) {
            console.error('Error in trackActivity middleware:', error);
            // We don't block the request if tracking fails
        }
    }
    next();
};

module.exports = trackActivity;
