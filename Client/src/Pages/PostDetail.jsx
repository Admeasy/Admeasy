import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { Heart, MessageCircle, Share2, ExternalLink, Youtube, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const viewer = user || mentor;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // FIXED: Remove navigate from deps to prevent infinite loop
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mentor-posts/${postId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Post not found');
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setIsLiked(data.post.isLiked);
        setLikesCount(data.post.likesCount);
        setComments(data.post.comments || []);
      } else {
        throw new Error(data.message || 'Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post. Please try again.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!viewer) {
      toast.info('Log in to like posts');
      navigate('/login');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(previousLiked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch(`/api/mentor-posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to like post');
      }

      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!viewer) {
      toast.info('Log in to share posts');
      navigate('/login');
      return;
    }
    const postUrl = `${window.location.origin}/posts/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.mentor.name}`,
          text: post.content.substring(0, 100),
          url: postUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(postUrl);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!viewer) {
      toast.info('Log in to comment');
      navigate('/login');
      return;
    }
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const commentContent = newComment.trim();

    try {
      const response = await fetch(`/api/mentor-posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add comment');
      }

      if (data.success) {
        // FIXED: Update both comments and post commentsCount
        setComments((prev) => [...prev, data.comment]);
        setPost((prev) => ({
          ...prev,
          commentsCount: data.commentsCount,
        }));
        setNewComment('');
        toast.success('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#9f3562]" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#9f3562]/10 animate-ping" />
          </div>
          <p className="text-gray-600 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-[#9f3562] hover:border-[#9f3562]/30 rounded-xl mb-6 sm:mb-8 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Feed</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100"
          >
            <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-gray-100">
              <div className="relative">
                <img
                  src={post.mentor.image || fallbackProfilePic}
                  alt={post.mentor.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-gray-100 shadow-md"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#9f3562] to-[#b14270] rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">{post.mentor.name}</h3>
                {post.mentor.username && (
                  <p className="text-sm text-gray-500">@{post.mentor.username}</p>
                )}
                {post.mentor.tagline && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{post.mentor.tagline}</p>
                )}
              </div>
              <span className="text-xs font-medium text-gray-400 px-3 py-1.5 bg-gray-50 rounded-full flex-shrink-0">
                {formatDate(post.createdAt)}
              </span>
            </div>

            <div className="px-5 sm:px-6 py-5">
              <p className="text-gray-800 whitespace-pre-wrap break-words text-base sm:text-lg leading-relaxed">
                {post.content}
              </p>
            </div>

            {post.image && (
              <div className="w-full">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-auto max-h-[600px] object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {post.externalLink && post.externalLink.url && (
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => handleLinkClick(post.externalLink.url)}
                className="mx-5 sm:mx-6 my-5 border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-[#9f3562]/30 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-white group-hover:from-[#9f3562]/5 group-hover:to-pink-50/50 transition-all">
                  {post.externalLink.preview?.platform === 'youtube' ? (
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                      <Youtube className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                      {post.externalLink.preview?.favicon ? (
                        <img
                          src={post.externalLink.preview.favicon}
                          alt={post.externalLink.preview?.domain || 'Link'}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                        />
                      ) : (
                        <ExternalLink className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1">
                      {post.externalLink.preview?.title || post.externalLink.preview?.domain || 'External Link'}
                    </p>
                    {post.externalLink.preview?.domain && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {post.externalLink.preview.domain}
                      </p>
                    )}
                    {post.externalLink.preview?.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                        {post.externalLink.preview.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-[#9f3562] transition-colors" />
                </div>
                {post.externalLink.preview?.image && (
                  <img
                    src={post.externalLink.preview.image}
                    alt="Link preview"
                    className="w-full h-56 sm:h-64 object-cover"
                    loading="lazy"
                  />
                )}
              </motion.div>
            )}

            <div className="flex items-center gap-6 sm:gap-8 px-5 sm:px-6 py-5 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2.5 transition-colors disabled:opacity-50 ${
                  isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-base sm:text-lg font-bold">{likesCount}</span>
              </motion.button>

              <div className="flex items-center gap-2.5 text-gray-600">
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-base sm:text-lg font-bold">{post.commentsCount}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors ml-auto"
              >
                <Share2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.button>
            </div>

            <div className="border-t border-gray-100 px-5 sm:px-6 py-5 sm:py-6 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-5">
                Comments ({post.commentsCount})
              </h3>

              <div className="space-y-4 mb-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-white/80 rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No comments yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <img
                        src={comment.user.image || fallbackProfilePic}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                        onError={(e) => {
                          e.target.src = fallbackProfilePic;
                        }}
                      />
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                          <p className="font-semibold text-sm text-gray-900">{comment.user.name}</p>
                          <p className="text-gray-800 mt-1 text-sm sm:text-base">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-4">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <img
                  src={(viewer && (viewer.imageUrl || viewer.image)) || fallbackProfilePic}
                  alt={viewer?.name || 'User avatar'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={viewer ? 'Add a comment...' : 'Log in to comment'}
                    disabled={!viewer}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562] disabled:bg-gray-100 disabled:text-gray-400 transition-all text-sm sm:text-base"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!viewer || !newComment.trim() || isSubmittingComment}
                    className="px-5 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;