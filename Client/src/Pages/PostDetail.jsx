import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { Heart, MessageCircle, Share2, ExternalLink, Youtube, ArrowLeft, Send, Trash2, Reply, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    commentId: null,
    isReply: false,
    parentCommentId: null,
  });

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // FIXED: Remove navigate from deps to prevent infinite loop
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`, {
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
        setIsFollowing(data.post.isFollowing || false);
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

  // Fetch follow status when post loads
  useEffect(() => {
    if (viewer && post) {
      const authorId = post?.mentor?._id || post?.author?._id;
      if (authorId && viewer._id && authorId.toString() !== viewer._id.toString()) {
        fetch(`/api/users/${authorId}/follow-status`, {
          credentials: 'include',
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setIsFollowing(data.isFollowing);
            }
          })
          .catch(err => console.error('Error fetching follow status:', err));
      }
    }
  }, [viewer, post]);

  // Listen for global follow status changes
  useEffect(() => {
    if (!post) return;
    const authorId = post?.mentor?._id || post?.author?._id;
    if (!authorId || !viewer || viewer._id?.toString() === authorId.toString()) return;

    const handleFollowStatusChange = (event) => {
      const { targetId, isFollowing: newFollowingStatus } = event.detail;
      if (targetId === authorId.toString()) {
        setIsFollowing(newFollowingStatus);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [post, viewer]);

  const handleLike = async () => {
    if (!viewer) {
      toast.info('Log in to like posts');
      navigate('/login');
      return;
    }
    if (isLiking) return;

    // OPTIMISTIC UPDATE: Update UI immediately
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    setIsLiked(!isLiked);
    setLikesCount(previousLiked ? likesCount - 1 : likesCount + 1);

    // Make API call in background
    setIsLiking(true);
    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Sync with server
          setIsLiked(data.isLiked);
          setLikesCount(data.likesCount);
        } else {
          // Revert on error
          setIsLiked(previousLiked);
          setLikesCount(previousCount);
        }
      })
      .catch(error => {
        console.error('Error liking post:', error);
        // Revert on error
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
      })
      .finally(() => {
        setIsLiking(false);
      });
  };

  const handleShare = async () => {
    // Share works without login
    const postUrl = `${window.location.origin}/posts/${postId}`;
    const authorName = (post?.mentor || post?.author)?.name || 'User';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${authorName}`,
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

  const handleFollow = async () => {
    if (!viewer) {
      toast.info('Log in to follow users and mentors');
      navigate('/login');
      return;
    }
    if (isFollowingLoading) return;

    // Get author ID (can be from mentor or user field)
    const authorId = post?.mentor?._id || post?.author?._id;
    if (!authorId) return;

    // Check if it's own post
    const isOwnPost = viewer._id && authorId && viewer._id.toString() === authorId.toString();
    if (isOwnPost) return;

    // OPTIMISTIC UPDATE: Update UI immediately
    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    // Make API call in background
    setIsFollowingLoading(true);
    fetch(`/api/users/${authorId}/follow`, {
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
              targetId: authorId.toString(),
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
      });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!viewer) {
      toast.info('Log in to comment');
      navigate('/login');
      return;
    }
    if (!newComment.trim() || isSubmittingComment) return;

    const commentContent = newComment.trim();
    
    // OPTIMISTIC UPDATE: Add comment to UI immediately
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempCommentId,
      user: {
        _id: viewer._id,
        name: viewer.name || 'You',
        image: viewer.imageUrl || viewer.image,
      },
      content: commentContent,
      likesCount: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    // Update UI immediately
    setComments(prev => [...prev, optimisticComment]);
    setPost(prev => ({
      ...prev,
      commentsCount: (prev?.commentsCount || 0) + 1,
    }));
    setNewComment('');
    setIsSubmittingComment(true);

    // Make API call in background
    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content: commentContent }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Replace optimistic comment with real one
          setComments(prev =>
            prev.map(comment =>
              comment._id === tempCommentId
                ? {
                    ...data.comment,
                    replies: [],
                  }
                : comment
            )
          );
          setPost(prev => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
        } else {
          // Remove optimistic comment on error
          setComments(prev => prev.filter(c => c._id !== tempCommentId));
          setPost(prev => ({
            ...prev,
            commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
          }));
          setNewComment(commentContent); // Restore comment text
        }
      })
      .catch(error => {
        console.error('Error adding comment:', error);
        // Remove optimistic comment on error
        setComments(prev => prev.filter(c => c._id !== tempCommentId));
        setPost(prev => ({
          ...prev,
          commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
        }));
        setNewComment(commentContent); // Restore comment text
      })
      .finally(() => {
        setIsSubmittingComment(false);
      });
  };

  const handleReplySubmit = async (commentId) => {
    if (!viewer) {
      toast.info('Log in to reply');
      navigate('/login');
      return;
    }
    if (!replyContent.trim() || isSubmittingReply) return;

    const replyText = replyContent.trim();
    
    // OPTIMISTIC UPDATE: Add reply to UI immediately
    const tempReplyId = `temp-reply-${Date.now()}`;
    const optimisticReply = {
      _id: tempReplyId,
      user: {
        _id: viewer._id,
        name: viewer.name || 'You',
        image: viewer.imageUrl || viewer.image,
      },
      content: replyText,
      likesCount: 0,
      isLiked: false,
      parentCommentId: commentId,
      createdAt: new Date().toISOString(),
    };

    // Update UI immediately
    setComments(prev =>
      prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply],
          };
        }
        return comment;
      })
    );
    setPost(prev => ({
      ...prev,
      commentsCount: (prev?.commentsCount || 0) + 1,
    }));
    setReplyingTo(null);
    setReplyContent('');
    setIsSubmittingReply(true);

    // Make API call in background
    fetch(`/api/posts/${postId}/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content: replyText }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Replace optimistic reply with real one
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply =>
                    reply._id === tempReplyId ? data.reply : reply
                  ),
                };
              }
              return comment;
            })
          );
          setPost(prev => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
        } else {
          // Remove optimistic reply on error
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies.filter(r => r._id !== tempReplyId),
                };
              }
              return comment;
            })
          );
          setPost(prev => ({
            ...prev,
            commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
          }));
          setReplyingTo(commentId);
          setReplyContent(replyText); // Restore reply text
        }
      })
      .catch(error => {
        console.error('Error adding reply:', error);
        // Remove optimistic reply on error
        setComments(prev =>
          prev.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: comment.replies.filter(r => r._id !== tempReplyId),
              };
            }
            return comment;
          })
        );
        setPost(prev => ({
          ...prev,
          commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
        }));
        setReplyingTo(commentId);
        setReplyContent(replyText); // Restore reply text
      })
      .finally(() => {
        setIsSubmittingReply(false);
      });
  };

  const handleCommentLike = async (commentId, currentLiked) => {
    if (!viewer) {
      toast.info('Log in to like comments');
      navigate('/login');
      return;
    }
    if (likingCommentId === commentId) return;

    // OPTIMISTIC UPDATE: Update UI immediately
    let previousLiked = false;
    let previousCount = 0;
    let isReply = false;
    let parentCommentId = null;

    // Find and update the comment/reply immediately
    setComments((prev) => {
      return prev.map((comment) => {
        if (comment._id === commentId) {
          // Top-level comment
          previousLiked = comment.isLiked;
          previousCount = comment.likesCount || 0;
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? (comment.likesCount || 0) - 1 : (comment.likesCount || 0) + 1,
          };
        }
        // Check if it's a reply
        if (comment.replies && comment.replies.some(reply => reply._id === commentId)) {
          isReply = true;
          parentCommentId = comment._id;
          const reply = comment.replies.find(r => r._id === commentId);
          previousLiked = reply?.isLiked || false;
          previousCount = reply?.likesCount || 0;
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply._id === commentId
                ? {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likesCount: reply.isLiked ? (reply.likesCount || 0) - 1 : (reply.likesCount || 0) + 1,
                  }
                : reply
            ),
          };
        }
        return comment;
      });
    });

    // Make API call in background
    setLikingCommentId(commentId);
    fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Sync with server response
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return { ...comment, isLiked: data.isLiked, likesCount: data.likesCount };
              }
              if (comment.replies && comment.replies.some(reply => reply._id === commentId)) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === commentId
                      ? { ...reply, isLiked: data.isLiked, likesCount: data.likesCount }
                      : reply
                  ),
                };
              }
              return comment;
            })
          );
        } else {
          // Revert on error
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return { ...comment, isLiked: previousLiked, likesCount: previousCount };
              }
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === commentId
                      ? { ...reply, isLiked: previousLiked, likesCount: previousCount }
                      : reply
                  ),
                };
              }
              return comment;
            })
          );
        }
      })
      .catch(error => {
        console.error('Error liking comment:', error);
        // Revert on error
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === commentId) {
              return { ...comment, isLiked: previousLiked, likesCount: previousCount };
            }
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply._id === commentId
                    ? { ...reply, isLiked: previousLiked, likesCount: previousCount }
                    : reply
                ),
              };
            }
            return comment;
          })
        );
      })
      .finally(() => {
        setLikingCommentId(null);
      });
  };

  const handleCommentDeleteClick = (commentId, isReply = false, parentCommentId = null) => {
    if (!viewer) {
      return;
    }
    setConfirmModal({
      isOpen: true,
      commentId,
      isReply,
      parentCommentId,
    });
  };

  const handleCommentDelete = async (commentId, isReplyParam = false, parentCommentIdParam = null) => {
    if (deletingCommentId === commentId) return;

    // OPTIMISTIC UPDATE: Remove from UI immediately
    let deletedComment = null;
    let isReply = isReplyParam;
    let parentCommentId = parentCommentIdParam;

    setComments((prev) => {
      const newComments = prev.map((comment) => {
        if (comment._id === commentId) {
          deletedComment = comment;
          return null; // Mark for removal
        }
        if (comment.replies && comment.replies.some(reply => reply._id === commentId)) {
          isReply = true;
          parentCommentId = comment._id;
          deletedComment = comment.replies.find(r => r._id === commentId);
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== commentId),
          };
        }
        return comment;
      });
      return newComments.filter(c => c !== null);
    });

    // Update comment count immediately
    setPost(prev => ({
      ...prev,
      commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
    }));

    // Make API call in background
    setDeletingCommentId(commentId);
    fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Sync with server
          setPost(prev => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
        } else {
          // Restore comment on error
          if (isReply && parentCommentId) {
            setComments(prev =>
              prev.map(comment =>
                comment._id === parentCommentId
                  ? {
                      ...comment,
                      replies: [...(comment.replies || []), deletedComment],
                    }
                  : comment
              )
            );
          } else {
            setComments(prev => [...prev, deletedComment]);
          }
          setPost(prev => ({
            ...prev,
            commentsCount: (prev?.commentsCount || 0) + 1,
          }));
        }
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
        // Restore comment on error
        if (isReply && parentCommentId) {
          setComments(prev =>
            prev.map(comment =>
              comment._id === parentCommentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), deletedComment],
                  }
                : comment
            )
          );
        } else {
          setComments(prev => [...prev, deletedComment]);
        }
        setPost(prev => ({
          ...prev,
          commentsCount: (prev?.commentsCount || 0) + 1,
        }));
      })
      .finally(() => {
        setDeletingCommentId(null);
      });
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-[#9f3562] hover:border-[#9f3562]/30 rounded-xl mb-6 sm:mb-8 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100"
          >
            <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-gray-100">
              <Link to={`/${post.mentor?.username || post.author?.username}`} className="relative">
                <img
                  src={(post.mentor || post.author)?.image || fallbackProfilePic}
                  alt={(post.mentor || post.author)?.name || 'User'}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-gray-100 shadow-md"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#9f3562] to-[#b14270] rounded-full border-2 border-white" />
              </Link>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg cursor-pointer hover:text-[#9f3562] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const username = (post.mentor || post.author)?.username;
                    if (username) navigate(`/${username}`);
                  }}>
                  {(post.mentor || post.author)?.name || 'User'}
                </h3>
                {(post.mentor || post.author)?.username && (
                  <p className="text-sm text-gray-500 cursor-pointer hover:text-[#9f3562] transition-colors" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${(post.mentor || post.author).username}`);
                  }}>@{(post.mentor || post.author).username}</p>
                )}
                {post.mentor?.tagline && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{post.mentor.tagline}</p>
                )}
              </div>
              {viewer && (post.mentor?._id || post.author?._id) && 
               viewer._id && 
               (post.mentor?._id || post.author?._id).toString() !== viewer._id.toString() && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      : 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent'
                  }`}
                >
                  {isFollowingLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </motion.button>
              )}
              <span className="text-xs font-medium text-gray-400 px-3 py-1.5 bg-gray-50 rounded-full flex-shrink-0">
                {formatDate(post.createdAt)}
              </span>
            </div>

            <div className="px-5 sm:px-6 py-5">
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
              <div
                className="text-gray-800 break-words text-base sm:text-lg leading-relaxed post-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
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
                className={`flex items-center gap-2.5 transition-colors disabled:opacity-50 ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
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

              <div className="space-y-4 mb-5 max-h-[500px] overflow-y-auto custom-scrollbar">
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
                      {viewer && comment.user?._id === viewer._id ? (
                        <Link
                          to={`/me`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        >
                          <img
                            src={comment.user?.image || fallbackProfilePic}
                            alt={comment.user?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                            onError={(e) => {
                              e.target.src = fallbackProfilePic;
                            }}
                          />
                        </Link>
                      ) : (
                        <img
                          src={comment.user?.image || fallbackProfilePic}
                          alt={comment.user?.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                          onError={(e) => {
                            e.target.src = fallbackProfilePic;
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                          {viewer && comment.user?._id === viewer._id ? (
                            <Link
                              to={`/me/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="block"
                            >
                              <p className="font-semibold text-sm text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                {comment.user?.name || 'Unknown User'}
                              </p>
                            </Link>
                          ) : (
                            <p className="font-semibold text-sm text-gray-900">
                              {comment.user?.name || 'Unknown User'}
                            </p>
                          )}
                          <p className="text-gray-800 mt-1 text-sm sm:text-base break-words">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-4">
                          <button
                            onClick={() => handleCommentLike(comment._id, comment.isLiked)}
                            disabled={likingCommentId === comment._id}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                              comment.isLiked
                                ? 'text-red-500'
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`}
                            />
                            <span>{comment.likesCount || 0}</span>
                          </button>
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#9f3562] transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                          {viewer && comment.user?._id === viewer._id && (
                            <button
                              onClick={() => handleCommentDeleteClick(comment._id, false, null)}
                              disabled={deletingCommentId === comment._id}
                              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="flex gap-3">
                                {viewer && reply.user?._id === viewer._id ? (
                                  <Link
                                    to={`/me/edit`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-shrink-0"
                                  >
                                    <img
                                      src={reply.user?.image || fallbackProfilePic}
                                      alt={reply.user?.name || 'User'}
                                      className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                                      onError={(e) => {
                                        e.target.src = fallbackProfilePic;
                                      }}
                                    />
                                  </Link>
                                ) : (
                                  <img
                                    src={reply.user?.image || fallbackProfilePic}
                                    alt={reply.user?.name || 'User'}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                    onError={(e) => {
                                      e.target.src = fallbackProfilePic;
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                    {viewer && reply.user?._id === viewer._id ? (
                                      <Link
                                        to={`/me/edit`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="block"
                                      >
                                        <p className="font-semibold text-xs text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                          {reply.user?.name || 'Unknown User'}
                                        </p>
                                      </Link>
                                    ) : (
                                      <p className="font-semibold text-xs text-gray-900">
                                        {reply.user?.name || 'Unknown User'}
                                      </p>
                                    )}
                                    <p className="text-gray-800 mt-1 text-xs sm:text-sm break-words">
                                      {reply.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 ml-3">
                                    <button
                                      onClick={() => handleCommentLike(reply._id, reply.isLiked)}
                                      disabled={likingCommentId === reply._id}
                                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                        reply.isLiked
                                          ? 'text-red-500'
                                          : 'text-gray-500 hover:text-red-500'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3.5 h-3.5 ${reply.isLiked ? 'fill-current' : ''}`}
                                      />
                                      <span>{reply.likesCount || 0}</span>
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(reply.createdAt)}
                                    </span>
                                    {viewer && reply.user?._id === viewer._id && (
                                      <button
                                        onClick={() => handleCommentDeleteClick(reply._id, true, comment._id)}
                                        disabled={deletingCommentId === reply._id}
                                        className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        {replyingTo === comment._id && (
                          <div className="mt-3 ml-4 flex gap-2">
                            <input
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562] transition-all"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplySubmit(comment._id);
                                }
                                if (e.key === 'Escape') {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }
                              }}
                              autoFocus
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReplySubmit(comment._id)}
                              disabled={!replyContent.trim() || isSubmittingReply}
                              className="px-4 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
                            >
                              {isSubmittingReply ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </motion.button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <img
                  src={(viewer && (viewer.imageUrl || viewer.image)) || fallbackProfilePic}
                  alt={viewer?.name || 'User avatar'}
                  className="max-w-10 max-h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, commentId: null, isReply: false, parentCommentId: null })}
        onConfirm={() => {
          setConfirmModal({ isOpen: false, commentId: null, isReply: false, parentCommentId: null });
          handleCommentDelete(
            confirmModal.commentId,
            confirmModal.isReply,
            confirmModal.parentCommentId
          );
        }}
        title="Delete Comment"
        message={confirmModal.isReply 
          ? "Are you sure you want to delete this reply? This action cannot be undone."
          : "Are you sure you want to delete this comment? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        isLoading={deletingCommentId === confirmModal.commentId}
      />
    </div>
  );
};

export default PostDetail;