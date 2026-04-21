const cron = require("node-cron");
const User = require("../models/userSchema");

/**
 * Runs at midnight on the 1st of every month.
 * Resets coinsEarnedThisMonth = 0 for ALL users.
 *
 * Cron pattern: "0 0 1 * *"
 *   0     = minute 0
 *   0     = hour 0 (midnight)
 *   1     = day 1 of month
 *   *     = every month
 *   *     = every day of week
 */
function startMonthlyCapResetCron() {
  cron.schedule(
    "0 0 1 * *",
    async () => {
      console.log(
        "[CRON] Monthly coin cap reset started:",
        new Date().toISOString(),
      );

      try {
        const now = new Date();
        const newMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const result = await User.updateMany(
          {}, // all users
          {
            $set: {
              coinsEarnedThisMonth: 0,
              coinMonthKey: newMonthKey,
            },
          },
        );

        console.log(
          `[CRON] Monthly cap reset complete. Users updated: ${result.modifiedCount}`,
        );
      } catch (error) {
        console.error("[CRON] Monthly cap reset failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata", // IST — matches your Indian user base
    },
  );

  console.log("[CRON] Monthly coin cap reset cron registered");
}

module.exports = { startMonthlyCapResetCron };
