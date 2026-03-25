import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import {
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Youtube,
  ArrowLeft,
  Send,
  Trash2,
  Reply,
  UserPlus,
  UserCheck,
  Repeat2,
  MoreVertical,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import PostCard from "../components/PostCard";
import PostViewTracker from "../components/PostViewTracker";
import EditPostModal from "../components/EditPostModal";
import SharePostModal from "../components/SharePostModal";
import { processMentions } from "../utils/processMentions";
import PollCard from "../components/PollCard";
import McqCard from "../components/McqCard";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const pathname = useLocation();
  const { user } = useUser();
  const { mentor } = useMentor();
  const viewer = user || mentor;

  const [loading, setLoading] = useState(true);
  const [postState, setPostState] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  // More Posts State
  const [morePosts, setMorePosts] = useState([]);
  const [morePostsPage, setMorePostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const morePostsObserverTargetRef = useRef(null);
  const isFetchingMorePostsRef = useRef(false);

  // Interaction Locks
  const isInteracting = useRef({ like: false, repost: false, follow: false });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    commentId: null,
    isReply: false,
    parentCommentId: null,
  });
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const postMenuRef = useRef(null);

  const fallbackProfilePic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Post not found");
          navigate("/");
          return;
        }
        throw new Error("Failed to fetch post");
      }

      const data = await response.json();

      if (data.success) {
        setPostState(data.post);
        setComments(data.post.comments || []);
        setIsFollowing(data.post.isFollowing || false);
      } else {
        throw new Error(data.message || "Failed to fetch post");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post. Please try again.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Fetch more posts (excluding current post)
  const fetchMorePosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (isFetchingMorePostsRef.current) return;
      isFetchingMorePostsRef.current = true;

      try {
        if (!append) setLoadingMorePosts(true);

        const response = await fetch(`/api/posts?page=${pageNum}&limit=20`, {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch posts");

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch posts");
        }

        // Filter out the current post
        const filteredPosts = data.posts.filter((p) => p._id !== postId);

        setMorePosts((prev) => {
          const newPosts = append ? [...prev, ...filteredPosts] : filteredPosts;
          return newPosts;
        });

        setHasMorePosts(
          filteredPosts.length > 0 && pageNum < data.pagination.pages,
        );
        setMorePostsPage(pageNum);
      } catch (err) {
        console.error("Error fetching more posts:", err);
        // Don't show toast for background loading
      } finally {
        setLoadingMorePosts(false);
        isFetchingMorePostsRef.current = false;
      }
    },
    [postId],
  );

  // Load more posts when post is loaded
  useEffect(() => {
    if (postState && morePosts.length === 0) {
      fetchMorePosts(1, false);
    }
  }, [postState, morePosts.length, fetchMorePosts]);

  // Infinite scroll for more posts
  useEffect(() => {
    if (!hasMorePosts || loadingMorePosts || morePosts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMorePostsRef.current) {
          fetchMorePosts(morePostsPage + 1, true);
        }
      },
      {
        root: null,
        rootMargin: "300px", // Start loading 300px before reaching the bottom
        threshold: 0.1,
      },
    );

    const currentTarget = morePostsObserverTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    hasMorePosts,
    loadingMorePosts,
    morePostsPage,
    morePosts.length,
    fetchMorePosts,
  ]);

  // Update post in more posts list
  const updatePostInMorePosts = useCallback((updatedPost) => {
    setMorePosts((prev) =>
      prev.map((p) =>
        p._id === updatedPost._id ? { ...p, ...updatedPost } : p,
      ),
    );
  }, []);

  // Listen for global post interaction changes
  useEffect(() => {
    const handlePostInteraction = (event) => {
      const {
        postId: eventPostId,
        isLiked,
        likesCount,
        isReposted,
        repostCount,
        commentsCount,
      } = event.detail;

      if (eventPostId === postId) {
        setPostState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(isLiked !== undefined && { isLiked }),
            ...(likesCount !== undefined && { likesCount }),
            ...(isReposted !== undefined && { isReposted }),
            ...(repostCount !== undefined && { repostCount }),
            ...(commentsCount !== undefined && { commentsCount }),
          };
        });
      }
    };

    window.addEventListener("postInteraction", handlePostInteraction);
    return () =>
      window.removeEventListener("postInteraction", handlePostInteraction);
  }, [postId]);

  useEffect(() => {
    if (!postState) return;
    const authorId = postState?.mentor?._id || postState?.author?._id;
    if (!authorId || !viewer || viewer._id?.toString() === authorId.toString())
      return;

    const handleFollowStatusChange = (event) => {
      const { targetId, isFollowing: newFollowingStatus } = event.detail;
      if (targetId === authorId.toString()) {
        setIsFollowing(newFollowingStatus);
      }
    };

    window.addEventListener("followStatusChanged", handleFollowStatusChange);
    return () => {
      window.removeEventListener(
        "followStatusChanged",
        handleFollowStatusChange,
      );
    };
  }, [postState, viewer]);

  const handleRepost = async (e) => {
    e?.stopPropagation();
    if (!viewer) {
      toast.info("Log in to repost");
      return;
    }

    if (isInteracting.current.repost) return;
    isInteracting.current.repost = true;

    // OPTIMISTIC UPDATE
    const wasReposted = postState.isReposted;
    const optimisticPost = {
      ...postState,
      isReposted: !wasReposted,
      repostCount: wasReposted
        ? postState.repostCount - 1
        : postState.repostCount + 1,
    };

    setPostState(optimisticPost);
    window.dispatchEvent(
      new CustomEvent("postInteraction", {
        detail: {
          postId,
          isReposted: !wasReposted,
          repostCount: optimisticPost.repostCount,
        },
      }),
    );

    try {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        const syncedPost = {
          ...postState,
          isReposted: data.isReposted,
          repostCount: data.repostCount,
        };
        setPostState(syncedPost);
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId, ...data },
          }),
        );
      } else {
        throw new Error();
      }
    } catch (error) {
      setPostState(postState); // Rollback
      window.dispatchEvent(
        new CustomEvent("postInteraction", {
          detail: {
            postId,
            isReposted: wasReposted,
            repostCount: postState.repostCount,
          },
        }),
      );
      toast.error("Failed to repost");
    } finally {
      isInteracting.current.repost = false;
    }
  };

  const handleLike = async () => {
    if (!viewer) {
      toast.info("Log in to like posts");
      return;
    }

    if (isInteracting.current.like) return;
    isInteracting.current.like = true;

    // OPTIMISTIC UPDATE
    const wasLiked = postState.isLiked;
    const optimisticPost = {
      ...postState,
      isLiked: !wasLiked,
      likesCount: wasLiked
        ? postState.likesCount - 1
        : postState.likesCount + 1,
    };

    setPostState(optimisticPost);
    window.dispatchEvent(
      new CustomEvent("postInteraction", {
        detail: {
          postId,
          isLiked: !wasLiked,
          likesCount: optimisticPost.likesCount,
        },
      }),
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setPostState((prev) => ({
          ...prev,
          isLiked: data.isLiked,
          likesCount: data.likesCount,
        }));
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId, ...data },
          }),
        );
      } else {
        throw new Error();
      }
    } catch (error) {
      setPostState(postState); // Rollback
      window.dispatchEvent(
        new CustomEvent("postInteraction", {
          detail: {
            postId,
            isLiked: wasLiked,
            likesCount: postState.likesCount,
          },
        }),
      );
    } finally {
      isInteracting.current.like = false;
    }
  };

  const handleShare = async () => {
    if (!viewer) {
      toast.info("Log in to share posts");
      return;
    }
    setShowShareModal(true);
  };

  const handleFollow = async () => {
    if (!viewer) {
      toast.info("Log in to follow users and mentors");
      return;
    }
    if (isInteracting.current.follow) return;
    isInteracting.current.follow = true;

    const authorId = postState?.mentor?._id || postState?.author?._id;
    if (!authorId) {
      isInteracting.current.follow = false;
      return;
    }

    const isOwnPost =
      viewer._id && authorId && viewer._id.toString() === authorId.toString();
    if (isOwnPost) {
      isInteracting.current.follow = false;
      return;
    }

    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    setIsFollowingLoading(true);
    fetch(`/api/users/${authorId}/follow`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsFollowing(data.isFollowing);
          window.dispatchEvent(
            new CustomEvent("followStatusChanged", {
              detail: {
                targetId: authorId.toString(),
                isFollowing: data.isFollowing,
              },
            }),
          );
        } else {
          setIsFollowing(previousFollowing);
        }
      })
      .catch((error) => {
        console.error("Error following:", error);
        setIsFollowing(previousFollowing);
      })
      .finally(() => {
        setIsFollowingLoading(false);
        isInteracting.current.follow = false;
      });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!viewer) {
      toast.info("Log in to comment");
      return;
    }
    if (!newComment.trim() || isSubmittingComment) return;

    const commentContent = newComment.trim();
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempCommentId,
      user: {
        _id: viewer._id,
        name: viewer.name || "You",
        image: viewer.imageUrl || viewer.image,
      },
      content: commentContent,
      likesCount: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);
    setPostState((prev) => ({
      ...prev,
      commentsCount: (prev?.commentsCount || 0) + 1,
    }));
    window.dispatchEvent(
      new CustomEvent("postInteraction", {
        detail: { postId, commentsCount: (postState?.commentsCount || 0) + 1 },
      }),
    );
    setNewComment("");
    setIsSubmittingComment(true);

    fetch(`/api/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: commentContent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments((prev) =>
            prev.map((comment) =>
              comment._id === tempCommentId
                ? { ...data.comment, replies: [] }
                : comment,
            ),
          );
          setPostState((prev) => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: { postId, commentsCount: data.commentsCount },
            }),
          );
        } else {
          setComments((prev) => prev.filter((c) => c._id !== tempCommentId));
          setPostState((prev) => ({
            ...prev,
            commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: {
                postId,
                commentsCount: Math.max(0, (postState?.commentsCount || 0) - 1),
              },
            }),
          );
          setNewComment(commentContent);
        }
      })
      .catch((error) => {
        console.error("Error adding comment:", error);
        setComments((prev) => prev.filter((c) => c._id !== tempCommentId));
        setPostState((prev) => ({
          ...prev,
          commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
        }));
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: {
              postId,
              commentsCount: Math.max(0, (postState?.commentsCount || 0) - 1),
            },
          }),
        );
        setNewComment(commentContent);
      })
      .finally(() => {
        setIsSubmittingComment(false);
      });
  };

  const handleReplySubmit = async (commentId) => {
    if (!viewer) {
      toast.info("Log in to reply");
      return;
    }
    if (!replyContent.trim() || isSubmittingReply) return;

    const replyText = replyContent.trim();
    const tempReplyId = `temp-reply-${Date.now()}`;
    const optimisticReply = {
      _id: tempReplyId,
      user: {
        _id: viewer._id,
        name: viewer.name || "You",
        image: viewer.imageUrl || viewer.image,
      },
      content: replyText,
      likesCount: 0,
      isLiked: false,
      parentCommentId: commentId,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply],
          };
        }
        return comment;
      }),
    );
    setPostState((prev) => ({
      ...prev,
      commentsCount: (prev?.commentsCount || 0) + 1,
    }));
    setReplyingTo(null);
    setReplyContent("");
    setIsSubmittingReply(true);

    fetch(`/api/posts/${postId}/comments/${commentId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: replyText }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === tempReplyId ? data.reply : reply,
                  ),
                };
              }
              return comment;
            }),
          );
          setPostState((prev) => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: { postId, commentsCount: data.commentsCount },
            }),
          );
        } else {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies.filter((r) => r._id !== tempReplyId),
                };
              }
              return comment;
            }),
          );
          setPostState((prev) => ({
            ...prev,
            commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: {
                postId,
                commentsCount: Math.max(0, (postState?.commentsCount || 0) - 1),
              },
            }),
          );
          setReplyingTo(commentId);
          setReplyContent(replyText);
        }
      })
      .catch((error) => {
        console.error("Error adding reply:", error);
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: comment.replies.filter((r) => r._id !== tempReplyId),
              };
            }
            return comment;
          }),
        );
        setPostState((prev) => ({
          ...prev,
          commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
        }));
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: {
              postId,
              commentsCount: Math.max(0, (postState?.commentsCount || 0) - 1),
            },
          }),
        );
        setReplyingTo(commentId);
        setReplyContent(replyText);
      })
      .finally(() => {
        setIsSubmittingReply(false);
      });
  };

  // FIXED: like comment / like reply logic (removed malformed ternary / extra object)
  const handleCommentLike = async (commentId) => {
    if (!viewer) {
      toast.info("Log in to like comments");
      return;
    }
    if (likingCommentId === commentId) return;

    let previousLiked = false;
    let previousCount = 0;
    let parentCommentId = null;

    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id === commentId) {
          previousLiked = comment.isLiked;
          previousCount = comment.likesCount || 0;
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked
              ? (comment.likesCount || 0) - 1
              : (comment.likesCount || 0) + 1,
          };
        }

        if (
          comment.replies &&
          comment.replies.some((r) => r._id === commentId)
        ) {
          parentCommentId = comment._id;
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply._id === commentId) {
                previousLiked = reply.isLiked;
                previousCount = reply.likesCount || 0;
                return {
                  ...reply,
                  isLiked: !reply.isLiked,
                  likesCount: reply.isLiked
                    ? (reply.likesCount || 0) - 1
                    : (reply.likesCount || 0) + 1,
                };
              }
              return reply;
            }),
          };
        }

        return comment;
      }),
    );

    setLikingCommentId(commentId);
    fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  isLiked: data.isLiked,
                  likesCount: data.likesCount,
                };
              }
              if (
                comment.replies &&
                comment.replies.some((reply) => reply._id === commentId)
              ) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === commentId
                      ? {
                          ...reply,
                          isLiked: data.isLiked,
                          likesCount: data.likesCount,
                        }
                      : reply,
                  ),
                };
              }
              return comment;
            }),
          );
        } else {
          // rollback
          setComments((prev) =>
            prev.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  isLiked: previousLiked,
                  likesCount: previousCount,
                };
              }
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === commentId
                      ? {
                          ...reply,
                          isLiked: previousLiked,
                          likesCount: previousCount,
                        }
                      : reply,
                  ),
                };
              }
              return comment;
            }),
          );
        }
      })
      .catch((error) => {
        console.error("Error liking comment:", error);
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === commentId) {
              return {
                ...comment,
                isLiked: previousLiked,
                likesCount: previousCount,
              };
            }
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply._id === commentId
                    ? {
                        ...reply,
                        isLiked: previousLiked,
                        likesCount: previousCount,
                      }
                    : reply,
                ),
              };
            }
            return comment;
          }),
        );
      })
      .finally(() => {
        setLikingCommentId(null);
      });
  };

  const handleCommentDeleteClick = (
    commentId,
    isReply = false,
    parentCommentId = null,
  ) => {
    if (!viewer) return;
    setConfirmModal({ isOpen: true, commentId, isReply, parentCommentId });
  };

  const handleCommentDelete = async (
    commentId,
    isReplyParam = false,
    parentCommentIdParam = null,
  ) => {
    if (deletingCommentId === commentId) return;

    let deletedComment = null;
    let isReply = isReplyParam;
    let parentCommentId = parentCommentIdParam;

    setComments((prev) => {
      const newComments = prev.map((comment) => {
        if (comment._id === commentId) {
          deletedComment = comment;
          return null;
        }
        if (
          comment.replies &&
          comment.replies.some((reply) => reply._id === commentId)
        ) {
          isReply = true;
          parentCommentId = comment._id;
          deletedComment = comment.replies.find((r) => r._id === commentId);
          return {
            ...comment,
            replies: comment.replies.filter((reply) => reply._id !== commentId),
          };
        }
        return comment;
      });
      return newComments.filter((c) => c !== null);
    });

    setPostState((prev) => ({
      ...prev,
      commentsCount: Math.max(0, (prev?.commentsCount || 0) - 1),
    }));
    window.dispatchEvent(
      new CustomEvent("postInteraction", {
        detail: {
          postId,
          commentsCount: Math.max(0, (postState?.commentsCount || 0) - 1),
        },
      }),
    );

    setDeletingCommentId(commentId);
    fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPostState((prev) => ({
            ...prev,
            commentsCount: data.commentsCount,
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: { postId, commentsCount: data.commentsCount },
            }),
          );
        } else {
          if (isReply && parentCommentId) {
            setComments((prev) =>
              prev.map((comment) =>
                comment._id === parentCommentId
                  ? {
                      ...comment,
                      replies: [...(comment.replies || []), deletedComment],
                    }
                  : comment,
              ),
            );
          } else {
            setComments((prev) => [...prev, deletedComment]);
          }
          setPostState((prev) => ({
            ...prev,
            commentsCount: (prev?.commentsCount || 0) + 1,
          }));
          window.dispatchEvent(
            new CustomEvent("postInteraction", {
              detail: { postId, commentsCount: postState?.commentsCount || 0 },
            }),
          );
        }
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
        if (isReply && parentCommentId) {
          setComments((prev) =>
            prev.map((comment) =>
              comment._id === parentCommentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), deletedComment],
                  }
                : comment,
            ),
          );
        } else {
          setComments((prev) => [...prev, deletedComment]);
        }
        setPostState((prev) => ({
          ...prev,
          commentsCount: (prev?.commentsCount || 0) + 1,
        }));
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId, commentsCount: postState?.commentsCount },
          }),
        );
      })
      .finally(() => {
        setDeletingCommentId(null);
      });
  };

  const handleEditPost = () => {
    setShowPostMenu(false);
    setShowEditModal(true);
  };

  const handleDeletePost = () => {
    setShowPostMenu(false);
    setShowDeletePostModal(true);
  };

  const handleDeletePostConfirm = async () => {
    try {
      setIsDeletingPost(true);
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete post");
      }

      toast.success("Post deleted successfully");
      setShowDeletePostModal(false);
      // Navigate back to feed after deletion
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPostState((prev) => ({ ...prev, ...updatedPost }));
    // Broadcast update to other components
    window.dispatchEvent(
      new CustomEvent("postInteraction", {
        detail: { postId, ...updatedPost },
      }),
    );
  };

  const handleLinkClick = (url) => {
    // Clean URL: remove any HTML tags that might have been included
    let cleanUrl = url;
    if (cleanUrl) {
      // Remove URL-encoded HTML tags at the end (like %3C/p%3E)
      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, "");
      // Remove any HTML tags (decoded)
      cleanUrl = cleanUrl.replace(/<[^>]*>/g, "");
      // Remove any remaining angle brackets
      cleanUrl = cleanUrl.replace(/[<>]/g, "");
      // Trim whitespace
      cleanUrl = cleanUrl.trim();
    }
    window.open(cleanUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10 px-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-[#9f3562]" />
            <div className="absolute inset-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#9f3562]/10 animate-ping" />
          </div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading post...
          </p>
        </div>
      </div>
    );
  }

  if (!postState) return null;

  const author = postState.mentor || postState.author;

  // Check if the current viewer owns this post
  const authorId = postState?.mentor?._id || postState?.author?._id;
  const isOwnPost =
    viewer &&
    authorId &&
    viewer._id &&
    viewer._id.toString() === authorId.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-3xl px-2 sm:px-4 md:px-6 py-0 sm:py-2 md:py-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-[#9f3562] hover:border-[#9f3562]/30 rounded-lg sm:rounded-xl mb-4 sm:mb-6 md:mb-8 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-6 border-b border-gray-100 flex-wrap">
              <Link
                to={`/${author?.username || ""}`}
                className="relative flex-shrink-0"
              >
                <img
                  src={author?.image || fallbackProfilePic}
                  alt={author?.name || "User"}
                  className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover aspect-square ring-2 ring-gray-100 shadow-md"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-gray-900 text-sm sm:text-base md:text-lg cursor-pointer hover:text-[#9f3562] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const username = author?.username;
                    if (username) navigate(`/${username}`);
                  }}
                >
                  {author?.name || "User"}
                </h3>
                {author?.username && (
                  <p
                    className="text-xs sm:text-sm text-gray-500 cursor-pointer hover:text-[#9f3562] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/${author.username}`);
                    }}
                  >
                    @{author.username}
                  </p>
                )}
                {postState.mentor?.tagline && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                    {postState.mentor.tagline}
                  </p>
                )}
              </div>

              {viewer &&
                (postState.mentor?._id || postState.author?._id) &&
                viewer._id &&
                (postState.mentor?._id || postState.author?._id).toString() !==
                  viewer._id.toString() &&
                !isFollowing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    disabled={isFollowingLoading}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 shadow-sm flex-shrink-0 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent`}
                  >
                    {isFollowingLoading ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden min-[360px]:inline">
                          Follow
                        </span>
                      </>
                    )}
                  </motion.button>
                )}

              {isOwnPost && (
                <div className="relative" ref={postMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPostMenu(!showPostMenu);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <AnimatePresence>
                    {showPostMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={handleEditPost}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">Edit post</span>
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Delete post
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <span className="text-[10px] sm:text-xs font-medium text-gray-400 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-full flex-shrink-0">
                {postState.isEdited && (
                  <span className="text-gray-500">(Edited) </span>
                )}
                {formatDate(postState.createdAt)}
              </span>
            </div>

            {/* Content */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <style>{`
    .post-content h1, .post-content h2, .post-content h3 { font-weight: 700; margin-top: 0.5rem; margin-bottom: 0.5rem; }
    .post-content p { margin-bottom: 0.75rem; line-height: 1.6; }
    .post-content ul, .post-content ol { margin-left: 1.5rem; margin-bottom: 0.75rem; }
    .post-content ul { list-style: disc; }
    .post-content ol { list-style: decimal; }
    .post-content a { color: #9f3562; text-decoration: underline; }
    .post-content a:hover { color: #b14270; }
    .post-content table { border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin: 1rem 0; font-size: 0.875rem; }
    .post-content table td, .post-content table th { padding: 0.5rem; border: 1px solid #e2e8f0; }
    @media (max-width: 400px) {
      .post-content table { font-size: 0.75rem; }
      .post-content table td, .post-content table th { padding: 0.25rem; }
      .post-content ul, .post-content ol { margin-left: 1rem; }
    }
  `}</style>

              {postState.type === "poll" ? (
                <PollCard
                  post={postState}
                  onVote={(updatedPost) =>
                    setPostState((prev) => ({ ...prev, ...updatedPost }))
                  }
                />
              ) : postState.type === "mcq" ? (
                <McqCard
                  post={postState}
                  onAnswer={(updatedPost) =>
                    setPostState((prev) => ({ ...prev, ...updatedPost }))
                  }
                />
              ) : (
                <div
                  className="text-gray-800 break-words text-sm sm:text-base md:text-lg leading-relaxed post-content"
                  dangerouslySetInnerHTML={{
                    __html: postState.content
                      ? processMentions(postState.content)
                      : "",
                  }}
                  onClick={(e) => {
                    const mentionLink = e.target.closest("a.mention-link");
                    if (mentionLink) {
                      e.preventDefault();
                      e.stopPropagation();
                      const username =
                        mentionLink.getAttribute("data-username");
                      if (username) navigate(`/${username}`);
                      return;
                    }
                    const link = e.target.closest("a");
                    if (link && link.href) {
                      e.preventDefault();
                      e.stopPropagation();
                      let cleanUrl = link.href;
                      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, "");
                      cleanUrl = cleanUrl.replace(/<[^>]*>/g, "");
                      cleanUrl = cleanUrl.replace(/[<>]/g, "");
                      cleanUrl = cleanUrl.trim();
                      window.open(cleanUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                />
              )}
            </div>

            {/* Image */}
            {postState.image && (
              <div className="w-full">
                <img
                  src={postState.image}
                  alt="Post"
                  className="w-full h-auto max-h-[300px] sm:max-h-[400px] md:max-h-[600px] object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {/* External link preview */}
            {postState.externalLink && postState.externalLink.url && (
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => handleLinkClick(postState.externalLink.url)}
                className="mx-3 sm:mx-4 md:mx-6 my-3 sm:my-4 md:my-5 border-2 border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden hover:border-[#9f3562]/30 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 bg-gradient-to-r from-gray-50 to-white group-hover:from-[#9f3562]/5 group-hover:to-pink-50/50 transition-all">
                  {postState.externalLink.preview?.platform === "youtube" ? (
                    <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <Youtube className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                      {postState.externalLink.preview?.favicon ? (
                        <img
                          src={postState.externalLink.preview.favicon}
                          alt={postState.externalLink.preview?.domain || "Link"}
                          className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                        />
                      ) : (
                        <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-600" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm md:text-base text-gray-900 line-clamp-1">
                      {postState.externalLink.preview?.title ||
                        postState.externalLink.preview?.domain ||
                        "External Link"}
                    </p>
                    {postState.externalLink.preview?.domain && (
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        {postState.externalLink.preview.domain}
                      </p>
                    )}
                    {postState.externalLink.preview?.description && (
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">
                        {postState.externalLink.preview.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-[#9f3562] transition-colors" />
                </div>
                {postState.externalLink.preview?.image && (
                  <img
                    src={postState.externalLink.preview.image}
                    alt="Link preview"
                    className="w-full h-40 sm:h-56 md:h-64 object-cover"
                    loading="lazy"
                  />
                )}
              </motion.div>
            )}

            {/* Post actions */}
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center gap-1.5 sm:gap-2.5 transition-colors ${
                  postState.isLiked
                    ? "text-red-500"
                    : "text-gray-600 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${
                    postState.isLiked ? "fill-current" : ""
                  }`}
                />
                <span className="text-sm sm:text-base md:text-lg font-bold">
                  {postState.likesCount}
                </span>
              </motion.button>

              <div className="flex items-center gap-1.5 sm:gap-2.5 text-gray-600">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                <span className="text-sm sm:text-base md:text-lg font-bold">
                  {postState.commentsCount}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRepost}
                className={`flex items-center gap-1.5 sm:gap-2.5 transition-colors ${
                  postState.isReposted
                    ? "text-[#9f3562]"
                    : "text-gray-600 hover:text-[#9f3562]"
                }`}
              >
                <Repeat2
                  className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${
                    postState.isReposted ? "fill-current" : ""
                  }`}
                />
                {postState.repostCount > 0 && (
                  <span className="text-sm sm:text-base md:text-lg font-bold">
                    {postState.repostCount}
                  </span>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors ml-auto"
              >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </motion.button>
            </div>

            {/* Comments */}
            <div className="border-t border-gray-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-5">
                Comments ({postState.commentsCount})
              </h3>

              <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 md:mb-5 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-white/80 rounded-xl sm:rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm sm:text-base">
                      No comments yet
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 sm:gap-3"
                    >
                      {viewer && comment.user?._id === viewer._id ? (
                        <Link
                          to="/me"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        >
                          <img
                            src={comment.user?.image || fallbackProfilePic}
                            alt={comment.user?.name || "User"}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover aspect-square ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                            onError={(e) => {
                              e.target.src = fallbackProfilePic;
                            }}
                          />
                        </Link>
                      ) : (
                        <Link
                          to={`/${comment.user?.username || ""}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        >
                          <img
                            src={comment.user?.image || fallbackProfilePic}
                            alt={comment.user?.name || "User"}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover aspect-square flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                            onError={(e) => {
                              e.target.src = fallbackProfilePic;
                            }}
                          />
                        </Link>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border border-gray-100">
                          {viewer && comment.user?._id === viewer._id ? (
                            <Link
                              to="/me"
                              onClick={(e) => e.stopPropagation()}
                              className="block"
                            >
                              <p className="font-semibold text-xs sm:text-sm text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                {comment.user?.name || "Unknown User"}
                              </p>
                            </Link>
                          ) : (
                            <Link
                              to={`/${
                                comment.user?.username || comment.user?._id
                              }`}
                              onClick={(e) => e.stopPropagation()}
                              className="block"
                            >
                              <p className="font-semibold text-xs sm:text-sm text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                {comment.user?.name || "Unknown User"}
                              </p>
                            </Link>
                          )}
                          <p className="text-gray-800 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base break-words">
                            {comment.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-1.5 sm:mt-2 ml-2 sm:ml-4 flex-wrap">
                          <button
                            onClick={() =>
                              handleCommentLike(comment._id, comment.isLiked)
                            }
                            disabled={likingCommentId === comment._id}
                            className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium transition-colors disabled:opacity-50 ${
                              comment.isLiked
                                ? "text-red-500"
                                : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                comment.isLiked ? "fill-current" : ""
                              }`}
                            />
                            <span>{comment.likesCount || 0}</span>
                          </button>

                          <button
                            onClick={() =>
                              setReplyingTo(
                                replyingTo === comment._id ? null : comment._id,
                              )
                            }
                            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-gray-500 hover:text-[#9f3562] transition-colors"
                          >
                            <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Reply</span>
                          </button>

                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>

                          {viewer && comment.user?._id === viewer._id && (
                            <button
                              onClick={() =>
                                handleCommentDeleteClick(
                                  comment._id,
                                  false,
                                  null,
                                )
                              }
                              disabled={deletingCommentId === comment._id}
                              className="ml-auto flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2 sm:mt-3 ml-2 sm:ml-4 space-y-2 sm:space-y-3 border-l-2 border-gray-100 pl-2 sm:pl-4">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply._id}
                                className="flex items-start gap-2 sm:gap-3"
                              >
                                {viewer && reply.user?._id === viewer._id ? (
                                  <Link
                                    to="/me"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-shrink-0"
                                  >
                                    <img
                                      src={
                                        reply.user?.image || fallbackProfilePic
                                      }
                                      alt={reply.user?.name || "User"}
                                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover aspect-square ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                                      onError={(e) => {
                                        e.target.src = fallbackProfilePic;
                                      }}
                                    />
                                  </Link>
                                ) : (
                                  <Link
                                    to={`/${
                                      reply.user?.username || reply.user?._id
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-shrink-0"
                                  >
                                    <img
                                      src={
                                        reply.user?.image || fallbackProfilePic
                                      }
                                      alt={reply.user?.name || "User"}
                                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover aspect-square ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all cursor-pointer"
                                      onError={(e) => {
                                        e.target.src = fallbackProfilePic;
                                      }}
                                    />
                                  </Link>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-50 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-100">
                                    {viewer &&
                                    reply.user?._id === viewer._id ? (
                                      <Link
                                        to="/me"
                                        onClick={(e) => e.stopPropagation()}
                                        className="block"
                                      >
                                        <p className="font-semibold text-[10px] sm:text-xs text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                          {reply.user?.name || "Unknown User"}
                                        </p>
                                      </Link>
                                    ) : (
                                      <Link
                                        to={`/${
                                          reply.user?.username ||
                                          reply.user?._id
                                        }`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="block"
                                      >
                                        <p className="font-semibold text-[10px] sm:text-xs text-gray-900 hover:text-[#9f3562] transition-colors cursor-pointer">
                                          {reply.user?.name || "Unknown User"}
                                        </p>
                                      </Link>
                                    )}
                                    <p className="text-gray-800 mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm break-words">
                                      {reply.content}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 ml-2 sm:ml-3 flex-wrap">
                                    <button
                                      onClick={() =>
                                        handleCommentLike(
                                          reply._id,
                                          reply.isLiked,
                                        )
                                      }
                                      disabled={likingCommentId === reply._id}
                                      className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium transition-colors disabled:opacity-50 ${
                                        reply.isLiked
                                          ? "text-red-500"
                                          : "text-gray-500 hover:text-red-500"
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                          reply.isLiked ? "fill-current" : ""
                                        }`}
                                      />
                                      <span>{reply.likesCount || 0}</span>
                                    </button>
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                      {formatDate(reply.createdAt)}
                                    </span>
                                    {viewer &&
                                      reply.user?._id === viewer._id && (
                                        <button
                                          onClick={() =>
                                            handleCommentDeleteClick(
                                              reply._id,
                                              true,
                                              comment._id,
                                            )
                                          }
                                          disabled={
                                            deletingCommentId === reply._id
                                          }
                                          className="ml-auto flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                                        >
                                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input */}
                        {replyingTo === comment._id && (
                          <div className="mt-2 sm:mt-3 ml-2 sm:ml-4 flex gap-1.5 sm:gap-2 flex-wrap">
                            <input
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 min-w-[120px] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562] transition-all"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplySubmit(comment._id);
                                }
                                if (e.key === "Escape") {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }
                              }}
                              autoFocus
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReplySubmit(comment._id)}
                              disabled={
                                !replyContent.trim() || isSubmittingReply
                              }
                              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
                            >
                              {isSubmittingReply ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </motion.button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                              className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-xs sm:text-sm"
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

              {/* Add comment */}
              <form
                onSubmit={handleCommentSubmit}
                className="flex items-start gap-2 sm:gap-3"
              >
                <img
                  src={
                    (viewer && (viewer.imageUrl || viewer.image)) ||
                    fallbackProfilePic
                  }
                  alt={viewer?.name || "User avatar"}
                  className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover aspect-square flex-shrink-0 ring-2 ring-gray-100"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                <div className="flex-1 flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={
                      viewer ? "Add a comment..." : "Log in to comment"
                    }
                    disabled={!viewer}
                    className="flex-1 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562] disabled:bg-gray-100 disabled:text-gray-400 transition-all text-xs sm:text-sm md:text-base"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={
                      !viewer || !newComment.trim() || isSubmittingComment
                    }
                    className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* More Posts Section */}
          {morePosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 sm:mt-12"
            >
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  More Posts
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Continue exploring
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {morePosts.map((post) => (
                  <div key={post._id} className="relative">
                    <PostViewTracker postId={post._id}>
                      <PostCard
                        post={post}
                        onPostUpdate={updatePostInMorePosts}
                      />
                    </PostViewTracker>
                  </div>
                ))}

                {/* Infinite scroll trigger */}
                {hasMorePosts && (
                  <div
                    ref={morePostsObserverTargetRef}
                    className="flex justify-center pt-8 pb-12 min-h-[100px]"
                  >
                    {loadingMorePosts && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin text-[#9f3562]" />
                        <span className="text-sm">Loading more posts...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* End of posts message */}
                {!hasMorePosts && morePosts.length > 0 && (
                  <div className="flex justify-center pt-8 pb-12">
                    <p className="text-gray-500 text-sm">
                      You've seen all available posts
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            commentId: null,
            isReply: false,
            parentCommentId: null,
          })
        }
        onConfirm={() => {
          setConfirmModal({
            isOpen: false,
            commentId: null,
            isReply: false,
            parentCommentId: null,
          });
          handleCommentDelete(
            confirmModal.commentId,
            confirmModal.isReply,
            confirmModal.parentCommentId,
          );
        }}
        title="Delete Comment"
        message={
          confirmModal.isReply
            ? "Are you sure you want to delete this reply? This action cannot be undone."
            : "Are you sure you want to delete this comment? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        isLoading={deletingCommentId === confirmModal.commentId}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={postState}
        onPostUpdated={handlePostUpdated}
      />

      <ConfirmModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleDeletePostConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        isLoading={isDeletingPost}
      />

      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={postState?._id}
        postData={postState}
      />
    </div>
  );
};

export default PostDetail;
