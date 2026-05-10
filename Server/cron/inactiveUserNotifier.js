const cron = require('node-cron');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');
const { sendInactivityEmail } = require('../services/emailService');

/**
 * Helper function to process inactivity for a specific model.
 */
const processInactivityForModel = async (Model, modelName, day7, day15, day30) => {
    console.log(`[CRON] Checking inactivity for ${modelName}s...`);
    const role = modelName.toLowerCase();

    // --- 1. Milestone 30 Days ---
    const list30 = await Model.find({
        lastActive: { $lte: day30 },
        $or: [
            { lastNotifiedMilestone: { $lt: 30 } },
            { lastNotifiedMilestone: { $exists: false } }
        ]
    }).select('email name lastNotifiedMilestone');

    console.log(`[CRON] Found ${list30.length} ${modelName}s for 30-day milestone.`);
    for (const item of list30) {
        await sendInactivityEmail(item.email, item.name, 30, role);
        item.lastNotifiedMilestone = 30;
        await item.save();
    }

    // --- 2. Milestone 15 Days ---
    const list15 = await Model.find({
        lastActive: { $lte: day15, $gt: day30 },
        $or: [
            { lastNotifiedMilestone: { $lt: 15 } },
            { lastNotifiedMilestone: { $exists: false } }
        ]
    }).select('email name lastNotifiedMilestone');

    console.log(`[CRON] Found ${list15.length} ${modelName}s for 15-day milestone.`);
    for (const item of list15) {
        await sendInactivityEmail(item.email, item.name, 15, role);
        item.lastNotifiedMilestone = 15;
        await item.save();
    }

    // --- 3. Milestone 7 Days ---
    const list7 = await Model.find({
        lastActive: { $lte: day7, $gt: day15 },
        $or: [
            { lastNotifiedMilestone: { $lt: 7 } },
            { lastNotifiedMilestone: { $exists: false } }
        ]
    }).select('email name lastNotifiedMilestone');

    console.log(`[CRON] Found ${list7.length} ${modelName}s for 7-day milestone.`);
    for (const item of list7) {
        await sendInactivityEmail(item.email, item.name, 7, role);
        item.lastNotifiedMilestone = 7;
        await item.save();
    }

    return {
        d30: list30.length,
        d15: list15.length,
        d7: list7.length
    };
};

/**
 * Starts the cron job to check for inactive users and mentors and send emails.
 * Runs daily at 2:00 AM IST.
 */
function startInactiveUserNotifierCron() {
    cron.schedule(
        "* * * * *", // 2:00 AM daily
        async () => {
            console.log(
                "[CRON] Inactive notification check started:",
                new Date().toISOString()
            );

            try {
                const now = new Date();
                
                // Calculate date thresholds
                const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const day15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
                const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                // Process Users
                const userStats = await processInactivityForModel(User, 'User', day7, day15, day30);

                // Process Mentors
                const mentorStats = await processInactivityForModel(Mentor, 'Mentor', day7, day15, day30);

                console.log(`[CRON] Inactive notification check complete.`);
                console.log(`[CRON] Users: 30d=${userStats.d30}, 15d=${userStats.d15}, 7d=${userStats.d7}`);
                console.log(`[CRON] Mentors: 30d=${mentorStats.d30}, 15d=${mentorStats.d15}, 7d=${mentorStats.d7}`);
            } catch (error) {
                console.error("[CRON] Inactive notification check failed:", error);
            }
        },
        {
            timezone: "Asia/Kolkata", // IST timezone
        }
    );

    console.log("[CRON] Inactive user and mentor notifier cron registered");
}

module.exports = { startInactiveUserNotifierCron };
