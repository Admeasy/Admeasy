import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ExternalLink, Youtube, Repeat2, UserPlus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';

const PostCard = ({ post, onPostUpdate }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const isAuthed = Boolean(user || mentor);

  // SINGLE SOURCE OF TRUTH
  const [postState, setPostState] = useState(post);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  // Interaction Locks (Action Locks)
  const isInteracting = useRef({ like: false, repost: false, follow: false });

  // Sync with props when coming from parent (like Feed)
  // But only if we aren't currently middle of an interaction to avoid snap-backs
  useEffect(() => {
    if (!isInteracting.current.like && !isInteracting.current.repost) {
      // Always sync isLiked, likesCount, and other state from props to ensure consistency
      setPostState(prev => {
        // Only update if there are actual changes to avoid unnecessary re-renders
        if (prev._id !== post._id ||
          prev.isLiked !== post.isLiked ||
          prev.likesCount !== post.likesCount ||
          prev.isReposted !== post.isReposted ||
          prev.repostCount !== post.repostCount ||
          prev.commentsCount !== post.commentsCount) {
          return { ...post };
        }
        return prev;
      });
    }
    if (!isInteracting.current.follow) {
      setIsFollowing(post.isFollowing || false);
    }
  }, [post]);

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // Support both 'mentor' (backward compatibility) and 'author' (new format)
  const author = post.author || post.mentor;
  // A post is a mentor post if it has the 'mentor' key (backward compatibility) or if author has username (mentors typically have usernames)
  // For now, we'll show follow button only if post.mentor exists (backward compatibility) or if author has username
  const isMentorPost = Boolean(post.mentor) || Boolean(author && author.username);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info('Log in to like posts');
      return;
    }

    // Prevent spam/race conditions
    if (isInteracting.current.like) return;
    isInteracting.current.like = true;

    // Capture previous state BEFORE optimistic update for rollback
    const previousState = { ...postState };

    // OPTIMISTIC UPDATE
    const wasLiked = postState.isLiked;
    const optimisticPost = {
      ...postState,
      isLiked: !wasLiked,
      likesCount: wasLiked ? (postState.likesCount - 1) : (postState.likesCount + 1)
    };

    // Apply locally immediately
    setPostState(optimisticPost);
    // Notify parent immediately
    if (onPostUpdate) onPostUpdate(optimisticPost);

    if (!wasLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        // Use the optimistic post as base, then merge API response
        const syncedPost = {
          ...optimisticPost,
          isLiked: data.isLiked,
          likesCount: data.likesCount
        };
        // MERGE API response
        setPostState(syncedPost);
        if (onPostUpdate) onPostUpdate(syncedPost);

        // Broadcast global update for PostDetail
        window.dispatchEvent(new CustomEvent('postInteraction', {
          detail: { postId: post._id, ...data }
        }));
      } else {
        throw new Error();
      }
    } catch (error) {
      // ROLLBACK to previous state
      setPostState(previousState);
      if (onPostUpdate) onPostUpdate(previousState);
      toast.error('Failed to like post');
    } finally {
      isInteracting.current.like = false;
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    // Share works without login
    const postUrl = `${window.location.origin}/posts/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${author?.name || 'User'}`,
          text: post.content.replace(/<[^>]*>/g, '').substring(0, 100), // Strip HTML for text
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

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.info('Log in to repost');
      return;
    }

    if (isInteracting.current.repost) return;
    isInteracting.current.repost = true;

    // OPTIMISTIC UPDATE
    const wasReposted = postState.isReposted;
    const optimisticPost = {
      ...postState,
      isReposted: !wasReposted,
      repostCount: wasReposted ? (postState.repostCount - 1) : (postState.repostCount + 1)
    };

    setPostState(optimisticPost);
    if (onPostUpdate) onPostUpdate(optimisticPost);

    try {
      const res = await fetch(`/api/posts/${post._id}/repost`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        const syncedPost = {
          ...postState,
          isReposted: data.isReposted,
          repostCount: data.repostCount
        };
        setPostState(syncedPost);
        if (onPostUpdate) onPostUpdate(syncedPost);

        window.dispatchEvent(new CustomEvent('postInteraction', {
          detail: { postId: post._id, ...data }
        }));
      } else {
        throw new Error();
      }
    } catch (error) {
      setPostState(postState);
      if (onPostUpdate) onPostUpdate(postState);
      toast.error('Failed to repost');
    } finally {
      isInteracting.current.repost = false;
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info('Log in to follow users and mentors');
      // navigate('/login');
      return;
    }
    if (isInteracting.current.follow) return;
    isInteracting.current.follow = true;

    // OPTIMISTIC UPDATE: Update UI immediately
    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    // Make API call in background
    setIsFollowingLoading(true);
    fetch(`/api/users/${author._id}/follow`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsFollowing(data.isFollowing);
          // Broadcast follow status change globally
          window.dispatchEvent(new CustomEvent('followStatusChanged', {
            detail: {
              targetId: author._id.toString(),
              isFollowing: data.isFollowing
            }
          }));
        } else {
          // Revert on error
          setIsFollowing(previousFollowing);
        }
      })
      .catch(error => {
        console.error('Error following:', error);
        // Revert on error
        setIsFollowing(previousFollowing);
      })
      .finally(() => {
        setIsFollowingLoading(false);
        isInteracting.current.follow = false;
      });
  };

  // Check if post is by current user/mentor
  const isOwnPost = author && (
    (user && user._id && author._id && user._id.toString() === author._id.toString()) ||
    (mentor && mentor._id && author._id && mentor._id.toString() === author._id.toString())
  );

  // Listen for global interaction events (from PostDetail or other cards)
  useEffect(() => {
    const handleGlobalUpdate = (event) => {
      const { postId, isLiked, likesCount, isReposted, repostCount, commentsCount } = event.detail;
      if (postId === post._id) {
        setPostState(prev => ({
          ...prev,
          ...(isLiked !== undefined && { isLiked }),
          ...(likesCount !== undefined && { likesCount }),
          ...(isReposted !== undefined && { isReposted }),
          ...(repostCount !== undefined && { repostCount }),
          ...(commentsCount !== undefined && { commentsCount })
        }));
      }
    };

    window.addEventListener('postInteraction', handleGlobalUpdate);
    return () => window.removeEventListener('postInteraction', handleGlobalUpdate);
  }, [post._id]);

  // Fetch follow status on mount
  useEffect(() => {
    if (isAuthed && author && author._id && !isOwnPost) {
      fetch(`/api/users/${author._id}/follow-status`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) setIsFollowing(data.isFollowing);
        });
    }
  }, [isAuthed, author, isOwnPost]);

  const handleLinkClick = (e, url) => {
    e.stopPropagation();
    // Clean URL: remove any HTML tags that might have been included
    let cleanUrl = url;
    if (cleanUrl) {
      // Remove URL-encoded HTML tags at the end (like %3C/p%3E)
      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, '');
      // Remove any HTML tags (decoded)
      cleanUrl = cleanUrl.replace(/<[^>]*>/g, '');
      // Remove any remaining angle brackets
      cleanUrl = cleanUrl.replace(/[<>]/g, '');
      // Trim whitespace
      cleanUrl = cleanUrl.trim();
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageDoubleClick = (e) => {
    e.stopPropagation();
    if (!isAuthed) return;
    handleLike(e);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => navigate(`/posts/${post._id}`)}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-md hover:shadow-gray-200/30 transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100 hover:border-[#9f3562]/10 group relative">
      <style>{`
        .post-content h1, .post-content h2, .post-content h3 {
          font-weight: 700;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .post-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .post-content ul, .post-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .post-content ul {
          list-style: disc;
        }
        .post-content ol {
          list-style: decimal;
        }
        .post-content a {
          color: #9f3562;
          text-decoration: underline;
        }
        .post-content a:hover {
          color: #b14270;
        }
        .post-content table {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin: 1rem 0;
        }
        .post-content table td, .post-content table th {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
        }
      `}</style>
      {/* Gradient hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9f3562]/0 via-pink-500/0 to-purple-500/0 group-hover:from-[#9f3562]/2 group-hover:via-pink-500/2 group-hover:to-purple-500/2 transition-all duration-500 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Post Header */}
        <div className="flex items-center gap-3 p-5 sm:p-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="relative"
          >
            <img
              src={author?.image || fallbackProfilePic}
              alt={author?.name || 'User'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain ring-2 ring-gray-100 shadow-md group-hover:ring-[#9f3562]/30 transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (author?.username) {
                  navigate(`/${author.username}`);
                }
              }}
              onError={(e) => {
                e.target.src = fallbackProfilePic;
              }}
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold text-gray-900 text-sm sm:text-base truncate cursor-pointer hover:text-[#9f3562] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (author?.username) {
                    navigate(`/${author.username}`);
                  }
                }}
              >
                {author?.name || 'User'}
              </h3>
            </div>
            {author?.username && (
              <p
                className="text-xs sm:text-sm text-gray-500 truncate cursor-pointer hover:text-[#9f3562] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/${author.username}`);
                }}
              >
                @{author.username}
              </p>
            )}
          </div>
          {isAuthed && !isOwnPost && author && author._id && !isFollowing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={isFollowingLoading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent`}
            >
              {isFollowingLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Post Content */}
        <div className="px-5 sm:px-6 pb-4">
          <div
            className="text-gray-800 break-words leading-relaxed text-sm sm:text-[15px] post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
            onClick={(e) => {
              // Intercept clicks on links within post content
              const link = e.target.closest('a');
              if (link && link.href) {
                e.preventDefault();
                e.stopPropagation();
                let cleanUrl = link.href;
                // Remove URL-encoded HTML tags at the end (like %3C/p%3E)
                cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, '');
                // Remove any HTML tags (decoded)
                cleanUrl = cleanUrl.replace(/<[^>]*>/g, '');
                // Remove any remaining angle brackets
                cleanUrl = cleanUrl.replace(/[<>]/g, '');
                // Trim whitespace
                cleanUrl = cleanUrl.trim();
                window.open(cleanUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          />
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="relative w-full group/image overflow-hidden">
            <motion.img
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
              src={post.image}
              alt="Post"
              className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-contain"
              loading="lazy"
              onDoubleClick={handleImageDoubleClick}
            />

            {/* Double-tap like animation */}
            <AnimatePresence>
              {showLikeAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-20 h-20 sm:w-28 sm:h-28 text-white fill-red-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Link Preview */}
        {post.externalLink && post.externalLink.url && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={(e) => handleLinkClick(e, post.externalLink.url)}
            className="mx-5 sm:mx-6 mb-4 sm:mb-5 mt-3 sm:mt-4 border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-[#9f3562]/30 hover:shadow-md transition-all cursor-pointer group/link"
          >
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white group-hover/link:from-[#9f3562]/5 group-hover/link:to-pink-50/50 transition-all duration-300">
              {post.externalLink.preview?.platform === 'youtube' ? (
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Youtube className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                  {post.externalLink.preview?.favicon ? (
                    <img
                      src={post.externalLink.preview.favicon}
                      alt={post.externalLink.preview?.domain || 'Link'}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <ExternalLink className="w-6 h-6 text-gray-600" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {post.externalLink.preview?.title || post.externalLink.preview?.domain || 'External Link'}
                </p>
                {post.externalLink.preview?.domain && (
                  <p className="text-xs text-gray-500 truncate">
                    {post.externalLink.preview.domain}
                  </p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover/link:text-[#9f3562] transition-colors" />
            </div>
            {post.externalLink.preview?.image && (
              <img
                src={post.externalLink.preview.image}
                alt="Link preview"
                className="w-full h-44 sm:h-52 object-contain"
                loading="lazy"
              />
            )}
          </motion.div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-5 sm:gap-7 px-5 sm:px-6 py-4 sm:py-5 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center gap-2 group/like"
          >
            <Heart
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${postState.isLiked
                ? 'fill-red-500 text-red-500'
                : 'text-gray-500 group-hover/like:text-red-500 group-hover/like:scale-110'
                }`}
            />
            <span className={`text-sm sm:text-base font-bold transition-colors ${postState.isLiked ? 'text-red-500' : 'text-gray-600 group-hover/like:text-red-500'
              }`}>
              {postState.likesCount}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/posts/${post._id}`);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-[#9f3562] transition-colors group/comment"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover/comment:scale-110 transition-transform" />
            <span className="text-sm sm:text-base font-bold">{postState.commentsCount}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRepost}
            className={`flex items-center gap-2 transition-colors ${postState.isReposted
              ? 'text-[#9f3562]'
              : 'text-gray-500 hover:text-[#9f3562]'
              }`}
          >
            <Repeat2 className={`w-5 h-5 sm:w-6 sm:h-6 ${postState.isReposted ? 'fill-current' : ''}`} />
            {postState.repostCount > 0 && (
              <span className={`text-sm sm:text-base font-bold ${postState.isReposted ? 'text-[#9f3562]' : 'text-gray-600'}`}>
                {postState.repostCount}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
          >
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
        <h6 className="text-xs font-medium text-gray-400 flex-shrink-0 mx-5 sm:mx-6 mb-1 sm:mb-2 text-right">{formatDate(post.createdAt)}</h6>
      </div>
    </motion.div>
  );
};

export default PostCard;