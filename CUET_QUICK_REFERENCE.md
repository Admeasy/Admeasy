# Quick Reference: CUET Discussion System

## API Endpoints

| Method | Path | Params | Returns |
|--------|------|--------|---------|
| GET | `/api/cuet-discussions` | `page`, `limit` | Comments with pagination |
| GET | `/api/cuet-discussions/replies/:id` | `page`, `limit` | Replies with pagination |
| POST | `/api/cuet-discussions/comment` | Body: `content,course,stream,category,score` | New comment |
| POST | `/api/cuet-discussions/reply` | Body: `content,parentCommentId` | New reply |
| POST | `/api/cuet-discussions/like/:id` | - | `{liked:bool, likesCount:num}` |

## Frontend Usage

### Fetch Comments with Pagination
```javascript
const res = await axios.get('/api/cuet-discussions', {
  params: { page: 1, limit: 10 }
});
const { comments, pagination } = res.data;
console.log(pagination.hasMore); // Stop infinite scroll when false
```

### Post Comment
```javascript
const res = await axios.post('/api/cuet-discussions/comment', {
  content: "Hello world",
  course: "B.Tech",
  stream: "Science",
  category: "GENERAL",
  score: 600
});
const comment = res.data.comment;
```

### Post Reply
```javascript
const res = await axios.post('/api/cuet-discussions/reply', {
  content: "I agree!",
  parentCommentId: "123abc..."
});
const reply = res.data.reply;
```

### Load Replies
```javascript
const res = await axios.get(
  `/api/cuet-discussions/replies/${commentId}`,
  { params: { page: 1, limit: 10 } }
);
const { replies, pagination } = res.data;
```

### Toggle Like
```javascript
const res = await axios.post(`/api/cuet-discussions/like/${commentId}`);
console.log(res.data.liked);        // true/false
console.log(res.data.likesCount);   // Updated count
```

## Response Formats

### Success (200/201)
```javascript
{
  success: true,
  comments: [...],  // or comment, reply, replies
  message: "..."    // optional
}
```

### Pagination Object
```javascript
{
  page: 1,
  limit: 10,
  totalPages: 4,
  hasMore: true,
  totalComments: 37  // or totalReplies
}
```

### Error (4xx/5xx)
```javascript
{
  success: false,
  message: "Specific error message"
}
```

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success GET/POST |
| 201 | Created something |
| 400 | Bad request (validation) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

## Toast Notifications

```javascript
import toast from 'react-hot-toast';

toast.success("Comment posted!");
toast.error("Failed to post");
toast.loading("Posting...");
```

## State Management Pattern

```javascript
const [comments, setComments] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loading, setLoading] = useState(false);

// Infinite scroll append
setComments(prev => [...prev, ...newComments]);

// Prepend (new comment)
setComments(prev => [newComment, ...prev]);

// Stop when hasMore is false
if (pagination.hasMore === false) {
  setHasMore(false);
}
```

## Debugging

### Check Backend Logs
```bash
# Terminal where server is running
tail -f logs/server.log
# OR check console output directly
```

### Test Endpoint
```bash
# Get comments
curl "http://localhost:5000/api/cuet-discussions?page=1&limit=5"

# Post comment
curl -X POST http://localhost:5000/api/cuet-discussions/comment \
  -H "Content-Type: application/json" \
  -d '{"content":"Test comment","course":"B.Tech"}'
```

### Browser DevTools
1. Network tab → Filter `/cuet-discussions`
2. Check response status and data
3. Check request headers (auth tokens if needed)
4. Console → Check for axios errors

## Performance Tips

1. **Keep limit reasonable** - 10-20 items per page
2. **Lazy load replies** - Don't fetch until clicked
3. **Use .lean()** - Backend excludes sensitive fields
4. **Pagination** - Always use hasMore flag
5. **Optimize images** - Compress avatars

## Common Fixes

| Issue | Solution |
|-------|----------|
| Toast not showing | Check Toaster in main.jsx |
| Comments not loading | Check getComments returns array |
| Infinite scroll not working | Verify hasMore flag logic |
| Comments not appearing after post | Check optimistic UI state update |
| Replies not loading | Check CommentCard lazy load onClick |
| Rate limit errors | Wait 30s before next comment |
| 404 on POST | Verify route registered in index.js |
| 500 errors | Check backend console for error.message |

---

Last Updated: 2024
System: CUET Discussion Threads
Status: ✅ Production Ready
