# Post System Migration Guide

## Overview
This document describes the new unified post system that replaces the old `MentorPosts` model with a scalable Reddit-style architecture.

## Architecture Changes

### Old System (MentorPosts)
- ❌ Only mentors could create posts
- ❌ Likes/comments stored as arrays in post document (doesn't scale)
- ❌ No downvotes
- ❌ No reposts
- ❌ Model registration issue: referenced 'Mentors' instead of 'Mentor'

### New System (Post + Vote + Comment)
- ✅ Both Users and Mentors can create posts
- ✅ Separate collections for votes and comments (scalable)
- ✅ Upvote (+1) and downvote (-1) support
- ✅ Repost functionality
- ✅ Nested comments (replies)
- ✅ Fixed model registration issues
- ✅ Optimized feed queries (no populate on votes/comments)

## Models

### 1. Post Model (`postSchema.js`)
- **Location:** `Server/models/postSchema.js`
- **Database:** Admeasy
- **Fields:**
  - `author` (ObjectId) - polymorphic reference
  - `authorType` ('User' | 'Mentor')
  - `content` (String)
  - `image` (String, Cloudinary URL)
  - `externalLink` (Object, link preview)
  - `repostOf` (ObjectId, reference to original post)
  - `voteScore` (Number, aggregated)
  - `commentCount` (Number, aggregated)
  - `repostCount` (Number, aggregated)
  - `deleted` (Boolean, soft delete)

### 2. Vote Model (`voteSchema.js`)
- **Location:** `Server/models/voteSchema.js`
- **Database:** Admeasy
- **Fields:**
  - `post` (ObjectId, ref: 'Post')
  - `user` (ObjectId)
  - `userType` ('User' | 'Mentor')
  - `value` (1 or -1)
- **Unique Index:** `{ post: 1, user: 1, userType: 1 }`
- **Hooks:** Automatically updates `Post.voteScore` on save/delete

### 3. Comment Model (`commentSchema.js`)
- **Location:** `Server/models/commentSchema.js`
- **Database:** Admeasy
- **Fields:**
  - `post` (ObjectId, ref: 'Post')
  - `author` (ObjectId)
  - `authorType` ('User' | 'Mentor')
  - `content` (String)
  - `parentComment` (ObjectId, for nested replies)
  - `deleted` (Boolean, soft delete)
- **Hooks:** Automatically updates `Post.commentCount` on save/delete

## API Endpoints

### Posts
- `GET /api/posts` - Get feed (paginated, sorted by voteScore or createdAt)
- `GET /api/posts/:postId` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:postId` - Update post (auth required, author only)
- `DELETE /api/posts/:postId` - Delete post (auth required, author only)

### Votes
- `POST /api/posts/:postId/vote` - Vote on post
  - Body: `{ value: 1 }` for upvote, `{ value: -1 }` for downvote
  - Toggle: If same vote, removes it. If different, changes it.

### Comments
- `GET /api/posts/:postId/comments` - Get comments
  - Query: `?parentCommentId=<id>` for nested replies
- `POST /api/posts/:postId/comments` - Create comment/reply
  - Body: `{ content: "...", parentCommentId: "<id>" }` (parentCommentId optional)
- `PUT /api/comments/:commentId` - Update comment (auth required, author only)
- `DELETE /api/comments/:commentId` - Delete comment (auth required, author only)

### Reposts
- `POST /api/posts/:postId/repost` - Repost a post
  - Body: `{ content: "..." }` (optional comment)

## Authentication

The system supports both User and Mentor authentication:
- **Optional Auth:** Public endpoints (GET) work without auth, but provide `userVote` if authenticated
- **Required Auth:** POST/PUT/DELETE endpoints require either User or Mentor JWT

## Performance Optimizations

1. **No Populate on Feed:**
   - Feed queries don't populate votes or comments
   - Only returns counts + `userVote` for current user
   - Reduces query time significantly

2. **Indexes:**
   - Post: `{ deleted: 1, createdAt: -1 }`, `{ deleted: 1, voteScore: -1, createdAt: -1 }`
   - Vote: `{ post: 1, user: 1, userType: 1 }` (unique)
   - Comment: `{ post: 1, parentComment: null, deleted: 1, createdAt: 1 }`

3. **Atomic Updates:**
   - Vote score updated via aggregation (prevents race conditions)
   - Comment count updated via countDocuments (accurate)

## Migration Steps

### 1. Backup Database
```bash
mongodump --uri="<MONGODB_URI>" --out=./backup
```

### 2. Install New Models
The new models are already created. Ensure they're imported in your main server file.

### 3. Update Server Entry Point
Add the new routes:
```javascript
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);
```

### 4. Data Migration (Optional)
If you want to migrate existing MentorPosts to the new Post system:

```javascript
// Migration script (run once)
const MentorPost = require('./models/mentorPostSchema');
const Post = require('./models/postSchema');

async function migratePosts() {
  const mentorPosts = await MentorPost.find().lean();
  
  for (const oldPost of mentorPosts) {
    const newPost = new Post({
      author: oldPost.mentorId,
      authorType: 'Mentor',
      content: oldPost.content,
      image: oldPost.image,
      externalLink: oldPost.externalLink,
      voteScore: oldPost.likesCount || 0, // Approximate
      commentCount: oldPost.commentsCount || 0,
      repostCount: 0,
      createdAt: oldPost.createdAt,
      updatedAt: oldPost.updatedAt,
    });
    
    await newPost.save();
    
    // Migrate votes (if needed)
    // Migrate comments (if needed)
  }
}
```

### 5. Update Frontend
Update API calls to use new endpoints:
- `/api/mentor-posts` → `/api/posts`
- Update vote/comment/repost endpoints
- Handle new response structure

### 6. Deprecate Old Routes
Keep old routes temporarily for backward compatibility, then remove after migration.

## Model Registration Fix

The old `mentorPostSchema.js` referenced `'Mentors'` (plural) but the model is registered as `'Mentor'` (singular). This has been fixed in the new system.

## Testing

Test the following scenarios:
1. ✅ User creates post
2. ✅ Mentor creates post
3. ✅ User upvotes post
4. ✅ User downvotes post
5. ✅ User changes vote
6. ✅ User removes vote
7. ✅ User comments on post
8. ✅ User replies to comment (nested)
9. ✅ User reposts
10. ✅ Feed query performance
11. ✅ Vote score aggregation
12. ✅ Comment count accuracy

## Rollback Plan

If issues arise:
1. Keep old routes active
2. Revert to old model if needed
3. Use database backup to restore

## Notes

- All models use soft delete (`deleted: true`) instead of hard delete
- Vote score is calculated via aggregation (not stored incrementally)
- Comment count is calculated via countDocuments (not stored incrementally)
- Repost count is incremented atomically
- Cross-DB population handled manually (User in Users DB, Mentor in Admeasy DB)

