// utils/discussionRateLimiter.js

const redis = require("../config/redis");

// -----------------------------------
// CONFIG
// -----------------------------------

const LIMITS = {
  comment: 30, // seconds
  reply: 30,
  like: 3
};

// -----------------------------------
// GENERIC RATE LIMITER
// -----------------------------------

const checkDiscussionRateLimit = async ({
  action = "comment",
  userId,
  ip
}) => {

  try {

    // -----------------------------------
    // VALIDATE ACTION
    // -----------------------------------

    if (!LIMITS[action]) {

      return {
        success: true
      };

    }

    // -----------------------------------
    // IDENTIFIER
    // -----------------------------------

    const identifier =
      userId || ip;

    const redisKey =
      `discussion:${action}:${identifier}`;

    // -----------------------------------
    // CHECK EXISTING
    // -----------------------------------

    const exists =
      await redis.get(redisKey);

    if (exists) {

      const ttl =
        await redis.ttl(redisKey);

      return {

        success: false,

        message:
          `Please wait ${ttl}s before ${action}ing again.`,

        remainingTime:
          ttl > 0
            ? ttl
            : LIMITS[action]

      };

    }

    // -----------------------------------
    // SET LIMIT
    // -----------------------------------

    await redis.set(
      redisKey,
      "1",
      "EX",
      LIMITS[action]
    );

    return {
      success: true
    };

  }

  catch (err) {

    console.log(
      "Discussion Rate Limit Error:",
      err
    );

    // fail open
    return {
      success: true
    };

  }

};

module.exports = {
  checkDiscussionRateLimit
};