const redis = require('../config/redis')
const post = require('../models/postSchema')

const buildFeedCache = async ()=>{
    try{
        console.log('Rebuilding feed cache...')

        const posts = await post.find()
        .select("likesCount commentsCount repostCount createdAt category")
        .lean();
        const pipeline = redis.pipeline();

        for(const post of posts){
            const hours = 
            (Date.now() - new Date(post.createdAt)) /(1000 * 60 * 60);

            const score = 
            (post.likesCount ||0)*2+
            (post.commentsCount || 0) *3 +
            (post.repostCount || 0) *4 +
            Math.max(0, 50 - hours);

            const key = `feed:${post.category || "study"}`;

            pipeline.zadd(key,score,post._id.toString());
        }
        await pipeline.exec();

          console.log("✅ Feed cache updated");
    } catch(err){
        console.error("Feed cache error ",err)
    }
};

module.exports = buildFeedCache;