const redis = require('../config/redis')


const rateLimiter = (limit=10,window=60) =>{

    return async (req,res,next) =>{
    try{
        const key = req.user
            ? `rate:${req.user.id}:${req.path}` //It is for logged in users
            : `rate:${req.ip}:${req.path}`; // it is for non-logged in

        const requests = await redis.incr(key);

        if(requests === 1){
            await redis.expire(key,window)
        }
        if(requests > limit){
            return res.status(429).json({
                message:"Too many requests,try again later"
            });
        }

        res.set("X-RateLimit-Limit", limit);
        res.set("X-RateLimit-Remaining", Math.max(0, limit - requests));
        
        next();
    } catch(err){   
        console.error("Rate Limiter error:",err)
        next();
    }
        }
    }

    module.exports = {rateLimiter};