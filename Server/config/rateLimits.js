const {rateLimiter} =require("../middleware/rateLimiter")
module.exports = {
  strict: rateLimiter(5, 60),
  normal: rateLimiter(50, 60),
  high: rateLimiter(100, 60)
};