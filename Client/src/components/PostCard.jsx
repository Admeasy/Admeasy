import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Youtube,
  Repeat2,
  UserPlus,
  UserCheck,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Copy,
  Link2,
  Send,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import EditPostModal from "./EditPostModal";
import ConfirmModal from "./ConfirmModal";
import { processMentions } from "../utils/processMentions";
import { truncateHtml } from "../utils/textUtils";
import SharePostModal from "./SharePostModal";
import PollCard from "./PollCard";
import McqCard from "./McqCard";
const fallbackProfilePic =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const PostCard = ({ post, onPostUpdate, isMastiMode, compact }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { mentor } = useMentor();

  const isOwnProfilePage =
    location.pathname === "/me" ||
    (user?.username && location.pathname === `/${user.username}`) ||
    (mentor?.username && location.pathname === `/${mentor.username}`);

  const isAuthed = Boolean(user || mentor);
  const [showShareModal, setShowShareModal] = useState(false);
  const scrollRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Read More State
  const [isExpanded, setIsExpanded] = useState(false);

  // Fullscreen Image State
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // SINGLE SOURCE OF TRUTH
  const [postState, setPostState] = useState(post);
  const hasImages = (postState.images?.length > 0) || (post.images?.length > 0) || !!postState.image || !!post.image;

  // Calculate processed and truncated content
  const processedContent = useMemo(
    () => processMentions(postState.content || post.content || ""),
    [postState.content, post.content],
  );

  const truncatedContent = useMemo(
    () => truncateHtml(processedContent, compact ? 18 : 30),
    [processedContent, compact],
  );

  const contentRef = useRef(null);
  const [isClipped, setIsClipped] = useState(false);

  useEffect(() => {
    if (contentRef.current && !isExpanded && hasImages) {
      const { scrollHeight, clientHeight } = contentRef.current;
      setIsClipped(scrollHeight > clientHeight + 2);
    }
  }, [processedContent, isExpanded, hasImages, compact]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setFullscreenImageUrl(null);
        setZoomLevel(1);
      }
    };
    if (fullscreenImageUrl) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [fullscreenImageUrl]);

  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const menuRef = useRef(null);

  // Interaction Locks (Action Locks)
  const isInteracting = useRef({ like: false, repost: false, follow: false });

  useEffect(() => {
    if (!isInteracting.current.like && !isInteracting.current.repost) {
      setPostState((prev) => {
        if (
          prev._id !== post._id ||
          prev.isLiked !== post.isLiked ||
          prev.likesCount !== post.likesCount ||
          prev.isReposted !== post.isReposted ||
          prev.repostCount !== post.repostCount ||
          prev.commentsCount !== post.commentsCount ||
          JSON.stringify(prev.commentPreview) !== JSON.stringify(post.commentPreview)
        ) {
          if (prev._id !== post._id) return { ...post };
          const finalCategory = prev.category !== post.category ? prev.category : post.category;
          return { ...post, category: finalCategory };
        }
        return prev;
      });
    }
    if (!isInteracting.current.follow) {
      setIsFollowing(post.isFollowing || false);
    }
  }, [post]);

  const author = post.author || post.mentor;
  const isMentorPost = Boolean(post.mentor) || Boolean(author && author.username);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info("Log in to like posts");
      return;
    }
    if (isInteracting.current.like) return;
    isInteracting.current.like = true;

    const previousState = { ...postState };
    const wasLiked = postState.isLiked;
    const optimisticPost = {
      ...postState,
      isLiked: !wasLiked,
      likesCount: wasLiked ? postState.likesCount - 1 : postState.likesCount + 1,
    };

    setPostState(optimisticPost);
    if (onPostUpdate) onPostUpdate(optimisticPost);

    if (!wasLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const syncedPost = {
          ...optimisticPost,
          isLiked: data.isLiked,
          likesCount: data.likesCount,
        };
        setPostState(syncedPost);
        if (onPostUpdate) onPostUpdate(syncedPost);
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId: post._id, ...data },
          })
        );
      } else {
        throw new Error();
      }
    } catch {
      setPostState(previousState);
      if (onPostUpdate) onPostUpdate(previousState);
      toast.error("Failed to like post");
    } finally {
      isInteracting.current.like = false;
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info("Log in to share posts");
      return;
    }
    setShowShareModal(true);
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info("Log in to repost");
      return;
    }
    if (mentor) {
      toast.info("mentors cannot repost dude😁");
      return;
    }
    if (isInteracting.current.repost) return;
    isInteracting.current.repost = true;

    const wasReposted = postState.isReposted;
    const optimisticPost = {
      ...postState,
      isReposted: !wasReposted,
      repostCount: wasReposted ? postState.repostCount - 1 : postState.repostCount + 1,
    };

    setPostState(optimisticPost);
    if (onPostUpdate) onPostUpdate(optimisticPost);

    try {
      const res = await fetch(`/api/posts/${post._id}/repost`, {
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
        if (onPostUpdate) onPostUpdate(syncedPost);
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId: post._id, ...data },
          })
        );
      } else {
        throw new Error();
      }
    } catch (error) {
      setPostState(postState);
      if (onPostUpdate) onPostUpdate(postState);
      toast.error("Failed to repost");
    } finally {
      isInteracting.current.repost = false;
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isAuthed) {
      toast.info("Log in to follow users and mentors");
      return;
    }
    if (isInteracting.current.follow) return;
    isInteracting.current.follow = true;

    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setIsFollowingLoading(true);

    fetch(`/api/users/${author._id}/follow`, {
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
                targetId: author._id.toString(),
                isFollowing: data.isFollowing,
              },
            })
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

  const isOwnPost =
    author &&
    ((user && user._id && author._id && user._id.toString() === author._id.toString()) ||
      (mentor && mentor._id && author._id && mentor._id.toString() === author._id.toString()));

  useEffect(() => {
    const handleGlobalUpdate = (event) => {
      const { postId, isLiked, likesCount, isReposted, repostCount, commentsCount } = event.detail;
      if (postId === post._id) {
        setPostState((prev) => ({
          ...prev,
          ...(isLiked !== undefined && { isLiked }),
          ...(likesCount !== undefined && { likesCount }),
          ...(isReposted !== undefined && { isReposted }),
          ...(repostCount !== undefined && { repostCount }),
          ...(commentsCount !== undefined && { commentsCount }),
        }));
      }
    };
    window.addEventListener("postInteraction", handleGlobalUpdate);
    return () => window.removeEventListener("postInteraction", handleGlobalUpdate);
  }, [post._id]);

  useEffect(() => {
    if (isAuthed && author && author._id && !isOwnPost) {
      fetch(`/api/users/${author._id}/follow-status`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setIsFollowing(data.isFollowing);
        });
    }
  }, [isAuthed, author, isOwnPost]);

  const handleLinkClick = (e, url) => {
    e.stopPropagation();
    let cleanUrl = url;
    if (cleanUrl) {
      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, "");
      cleanUrl = cleanUrl.replace(/<[^>]*>/g, "");
      cleanUrl = cleanUrl.replace(/[<>]/g, "");
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
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete post");
      }
      toast.success("Post deleted successfully");
      if (onPostUpdate) {
        onPostUpdate({ ...postState, deleted: true });
      }
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPostState((prev) => ({ ...prev, ...updatedPost }));
    if (onPostUpdate) {
      onPostUpdate({ ...prev, ...updatedPost });
    }
  };

  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleDirectComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      toast.info("Log in to comment");
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Comment added!");
        setCommentText("");
        const updatedPost = {
          ...postState,
          commentsCount: data.commentsCount,
          commentPreview: data.comment,
        };
        setPostState(updatedPost);
        if (onPostUpdate) onPostUpdate(updatedPost);
        window.dispatchEvent(
          new CustomEvent("postInteraction", {
            detail: { postId: post._id, commentsCount: data.commentsCount },
          })
        );
      } else {
        toast.error(data.message || "Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setIsSubmittingComment(false);
    }
  };
  const handleImageDoubleClick = (e) => {
    e.stopPropagation();
    if (!isAuthed) return;
    handleLike(e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-md hover:shadow-gray-200/30 transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100 hover:border-[#9f3562]/10 group relative"
      onClick={() => navigate(`/posts/${post._id}`)}
    >
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#9f3562]/0 via-pink-500/0 to-purple-500/0 group-hover:from-[#9f3562]/2 group-hover:via-pink-500/2 group-hover:to-purple-500/2 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-6 pb-2 sm:pb-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="relative"
          >
            <img
              src={author?.image || fallbackProfilePic}
              alt={author?.name || "User"}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-gray-100 shadow-md group-hover:ring-[#9f3562]/30 transition-all cursor-pointer"
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
                className="font-bold text-gray-900 text-[13px] sm:text-base truncate cursor-pointer hover:text-[#9f3562] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (author?.username) {
                    navigate(`/${author.username}`);
                  }
                }}
              >
                {author?.name || "User"}
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
            {postState.space && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {postState.space.logo && (
                  <img src={postState.space.logo} alt={postState.space.name} className="w-4 h-4 rounded-full object-cover" />
                )}
                <span className="text-[11px] text-[#9f3562] font-semibold">{postState.space.name}</span>
              </div>
            )}
          </div>
          {isAuthed && !isOwnPost && author && author._id && !isFollowing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={isFollowingLoading}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all disabled:opacity-50 shadow-sm bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent`}
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
          {isOwnPost && (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </motion.button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit post</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete post</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="px-3.5 sm:px-5 pb-2 sm:pb-3">
          {postState.headline && (
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-snug">
              {postState.headline}
            </h2>
          )}

          {postState.type !== "poll" && postState.type !== "mcq" && (
            <>
              <div
                ref={contentRef}
                className={`text-gray-700 break-words leading-snug text-[13px] sm:text-[14px] post-content ${!isExpanded && hasImages ? 'line-clamp-1' : ''}`}
                dangerouslySetInnerHTML={{
                  __html: isExpanded
                    ? processedContent
                    : truncatedContent.hasMore
                      ? truncatedContent.html
                      : processedContent,
                }}
                onClick={(e) => {
                  const mentionLink = e.target.closest("a.mention-link");
                  if (mentionLink) {
                    e.preventDefault();
                    e.stopPropagation();
                    const username = mentionLink.getAttribute("data-username");
                    if (username) navigate(`/${username}`);
                    return;
                  }

                  const link = e.target.closest("a");
                  if (link && link.href) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLinkClick(e, link.href);
                  }
                }}
              />

              {(hasImages ? (isExpanded || isClipped) : truncatedContent.hasMore) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="mt-1 text-[#9f3562] hover:text-[#b14270] font-medium text-sm focus:outline-none hover:underline flex items-center gap-0.5 transition-colors"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </>
          )}
        </div>

        {postState.hashtags && postState.hashtags.length > 0 && (
          <div className="px-3.5 sm:px-6 pb-2.5 sm:pb-4 flex flex-wrap gap-1.5 sm:gap-2">
            {postState.hashtags.map((tag, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/explore?tag=${encodeURIComponent(tag)}`);
                }}
                className="text-[#9f3562] bg-[#9f3562]/10 px-2.5 py-1 rounded-md text-xs font-bold hover:bg-[#9f3562] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Type Specific Rendering */}
        {postState.type === "poll" && postState.poll && (
          <div className="px-3.5 sm:px-5 pb-4" onClick={(e) => e.stopPropagation()}>
            <PollCard post={postState} onUpdate={handlePostUpdated} />
          </div>
        )}

        {postState.type === "mcq" && postState.mcq && (
          <div className="px-3.5 sm:px-5 pb-4" onClick={(e) => e.stopPropagation()}>
            <McqCard post={postState} onUpdate={handlePostUpdated} />
          </div>
        )}

        {/* Multi-Image Carousel */}
        {(() => {
          const images = (postState.images || post.images || []).filter(img => !!img);
          if (images.length === 0 && (postState.image || post.image)) {
            images.push(postState.image || post.image);
          }
          if (images.length === 0) return null;

          const handleScroll = (e) => {
            const element = e.target;
            const index = Math.round(element.scrollLeft / element.clientWidth);
            setCurrentImageIndex(index);
          };

          const scroll = (direction) => {
            if (!scrollRef.current) return;
            const scrollAmount = scrollRef.current.clientWidth;
            scrollRef.current.scrollBy({
              left: direction === "left" ? -scrollAmount : scrollAmount,
              behavior: "smooth",
            });
          };

          return (
            <div className="relative w-full overflow-hidden bg-gray-50/50 group/image">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {images.map((imgUrl, idx) => (
                  <div key={idx} className={`relative shrink-0 snap-center w-full ${compact ? "aspect-video" : "max-h-[250px] sm:max-h-[500px]"}`} style={{ display: "flex", justifyContent: "center" }}>
                    <motion.img
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      src={imgUrl}
                      alt={`Post Image ${idx + 1}`}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImageUrl(imgUrl);
                      }}
                      loading="lazy"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleLike(e);
                      }}
                    />
                  </div>
                ))}
              </div>

              {images.length > 1 && (
                <>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm shadow-md z-20">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); scroll("left"); }}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-800 shadow-lg transition-all hover:bg-white z-20 ${currentImageIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); scroll("right"); }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-800 shadow-lg transition-all hover:bg-white z-20 ${currentImageIndex === images.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <AnimatePresence>
                {showLikeAnimation && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  >
                    <Heart className="w-20 h-20 sm:w-28 sm:h-28 text-white fill-red-500 drop-shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {post.externalLink && post.externalLink.url && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={(e) => handleLinkClick(e, post.externalLink.url)}
            className="mx-3.5 sm:mx-6 mb-3 sm:mb-5 border border-gray-200 overflow-hidden rounded-xl"
          >
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white hover:from-[#9f3562]/5 hover:to-pink-50/50 transition-all duration-300 group/link">
              {post.externalLink.preview?.platform === "youtube" ? (
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Youtube className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                  {post.externalLink.preview?.favicon ? (
                    <img src={post.externalLink.preview.favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                  ) : (
                    <ExternalLink className="w-6 h-6 text-gray-600" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {post.externalLink.preview?.title || post.externalLink.preview?.domain || "External Link"}
                </p>
                {post.externalLink.preview?.domain && (
                  <p className="text-xs text-gray-500 truncate">{post.externalLink.preview.domain}</p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover/link:text-[#9f3562] transition-colors" />
            </div>
            {post.externalLink.preview?.image && (
              <img
                src={post.externalLink.preview.image}
                alt="Link preview"
                className="w-full h-28 sm:h-52 object-cover bg-gray-50/50"
                loading="lazy"
              />
            )}
          </motion.div>
        )}

        <div className="flex items-center gap-3 sm:gap-6 px-3.5 sm:px-5 py-2 sm:py-3 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center gap-2 group/like"
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${postState.isLiked ? "fill-red-500 text-red-500" : "text-gray-500 group-hover/like:text-red-500"}`} />
            <span className={`text-sm font-bold transition-colors ${postState.isLiked ? "text-red-500" : "text-gray-600 group-hover/like:text-red-500"}`}>
              {postState.likesCount}
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/posts/${post._id}`); }}
            className="flex items-center gap-2 text-gray-500 hover:text-[#9f3562] transition-colors group/comment"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{postState.commentsCount}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRepost}
            className={`flex items-center gap-2 transition-colors ${postState.isReposted ? "text-[#9f3562]" : "text-gray-500"}`}
          >
            <Repeat2 className={`w-5 h-5 ${postState.isReposted ? "fill-current" : ""}`} />
            {postState.repostCount > 0 && <span className="text-sm font-bold">{postState.repostCount}</span>}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
          {isOwnProfilePage && (
            <div className="ml-auto flex items-center bg-gray-100/80 p-1 rounded-lg border border-gray-200/50" onClick={(e) => e.stopPropagation()}>
              {['study', 'masti'].map((mode) => {
                const isActive = (postState.category || 'study') === mode;
                return (
                  <button
                    key={mode}
                    disabled={isChangingCategory || isActive}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isChangingCategory || isActive) return;
                      setIsChangingCategory(true);
                      const prevCat = postState.category || 'study';
                      setPostState(prev => ({ ...prev, category: mode }));
                      try {
                        const res = await fetch(`/api/posts/${post._id}/category`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ category: mode }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(`Moved to ${mode === 'study' ? 'Study' : 'Masti'} feed`);
                        } else {
                          setPostState(prev => ({ ...prev, category: prevCat }));
                        }
                      } catch {
                        setPostState(prev => ({ ...prev, category: prevCat }));
                      } finally {
                        setIsChangingCategory(false);
                      }
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${isActive ? 'bg-white text-[#9f3562] shadow-sm' : 'text-gray-500'}`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isMastiMode && (
          <div className="px-3.5 sm:px-5 pb-3 pt-1 border-t border-gray-50/50" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleDirectComment} className="flex items-center gap-2">
              <img
                src={(user?.imageUrl || user?.image || mentor?.imageUrl || mentor?.image) || fallbackProfilePic}
                alt="Me"
                className="w-7 h-7 rounded-full object-cover border border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 relative group/input">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm py-1.5 px-3 rounded-full border border-gray-100 focus:border-[#9f3562]/30 focus:outline-none transition-all pr-10"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${commentText.trim() ? 'bg-[#9f3562] text-white shadow-md' : 'text-gray-300'}`}
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmittingComment ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </form>
          </div>
        )}

        {postState.commentPreview && (
          <div className="px-3.5 sm:px-5 pb-2">
            <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 relative">
              {postState.commentPreview.isMentor && (
                <span className="absolute top-1 right-2 text-[9px] font-bold text-[#9f3562] uppercase tracking-wider">Mentor</span>
              )}
              <img
                src={postState.commentPreview.author?.image || fallbackProfilePic}
                alt={postState.commentPreview.author?.name || "User"}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-gray-200 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] font-semibold text-gray-700 cursor-pointer hover:text-[#9f3562] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (postState.commentPreview.author?.username) navigate(`/${postState.commentPreview.author.username}`);
                  }}
                >
                  {postState.commentPreview.author?.name || "User"}:
                </span>
                <span className="text-[11px] text-gray-500 ml-1 line-clamp-1">
                  {postState.commentPreview.content?.replace(/<[^>]*>/g, '') || ''}
                </span>
              </div>
            </div>
          </div>
        )}

        <h6 className="text-[10px] font-medium text-gray-400 flex-shrink-0 mx-3.5 sm:mx-5 mb-1 text-right">
          {postState.isEdited && <span className="text-gray-400">(Edited) </span>}
          {formatDate(postState.createdAt)}
        </h6>
      </div>

      <EditPostModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} post={postState} onPostUpdated={handlePostUpdated} />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} title="Delete Post" message="Are you sure you want to delete this post? This action cannot be undone." confirmText="Delete" cancelText="Cancel" confirmColor="danger" isLoading={isDeleting} />
      
      {fullscreenImageUrl && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-0"
            onClick={(e) => { e.stopPropagation(); setFullscreenImageUrl(null); setZoomLevel(1); }}
            style={{ overflow: 'hidden' }}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-5 right-5 z-[1001] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg"
              onClick={(e) => { e.stopPropagation(); setFullscreenImageUrl(null); setZoomLevel(1); }}
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            <div className="w-full h-full flex items-center justify-center relative cursor-move" onClick={(e) => e.stopPropagation()}>
              <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit>
                {({ zoomIn, zoomOut, resetTransform, scale }) => (
                  <>
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                      <img src={fullscreenImageUrl} alt="Fullscreen view" className="w-full h-full object-contain" />
                    </TransformComponent>
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl z-[1001]"
                    >
                      <button onClick={() => zoomOut()} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><ZoomOut className="w-5 h-5" /></button>
                      <button onClick={() => zoomIn()} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><ZoomIn className="w-5 h-5" /></button>
                    </motion.div>
                  </>
                )}
              </TransformWrapper>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      <SharePostModal postId={post._id} postData={post} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </motion.div>
  );
};

export default PostCard;
