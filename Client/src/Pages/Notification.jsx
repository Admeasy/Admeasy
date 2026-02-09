import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { ArrowLeft, Heart, UserPlus, MessageCircle, ThumbsUp, Repeat2, Image as ImageIcon, Bell, AtSign, MoreVertical, Trash2, CheckCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { enableNotifications } from '../Firebase/enableNotifications';
import ConfirmModal from '../components/ConfirmModal';

const Notification = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenuForId, setShowMenuForId] = useState(null);
  const menuRefs = useRef({});

  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!user && !mentor) {
      navigate('/login');
      return;
    }
  }, [user, mentor, navigate]);

  useEffect(() => {
    if (user || mentor) {
      fetchNotifications();
    }
  }, [user, mentor]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to originPath
    if (notification.originPath) {
      let path = notification.originPath;

      // Handle comment anchor links - scroll to comment after navigation
      if (path.includes('#comment-')) {
        const [basePath, anchor] = path.split('#');
        navigate(basePath);
        // Scroll to comment after a short delay to allow page to load
        setTimeout(() => {
          const commentId = anchor.replace('comment-', '');
          const commentElement = document.getElementById(commentId) ||
            document.querySelector(`[data-comment-id="${commentId}"]`);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the comment briefly
            commentElement.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
            setTimeout(() => {
              commentElement.style.backgroundColor = '';
            }, 2000);
          }
        }, 800);
      } else {
        navigate(path);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MENTION':
        return <AtSign className="w-3 h-3 sm:w-5 sm:h-5 text-[#9f3562] fill-[#9f3562]" />;
      case 'POST_LIKE':
        return <Heart className="w-3 h-3 sm:w-5 sm:h-5 text-red-500 fill-red-500" />;
      case 'COMMENT_LIKE':
        return <ThumbsUp className="w-3 h-3 sm:w-5 sm:h-5 text-blue-500 fill-blue-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5 text-blue-500 fill-blue-500" />;
      case 'FOLLOW':
      case 'FOLLOW_BACK':
        return <UserPlus className="w-3 h-3 sm:w-5 sm:h-5 text-green-500 fill-green-500" />;
      case 'REPOST':
        return <Repeat2 className="w-3 h-3 sm:w-5 sm:h-5 text-purple-500" />;
      case 'FOLLOWING_POST':
        return <ImageIcon className="w-3 h-3 sm:w-5 sm:h-5 text-purple-500 fill-purple-500" />;
      case 'MESSAGE':
        return <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5 text-purple-500 fill-purple-500" />;
      default:
        return <Heart className="w-3 h-3 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteClick = (notification, e) => {
    e.stopPropagation();
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
    setShowMenuForId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/notifications/${notificationToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationToDelete._id)
        );
        toast.success('Notification deleted');
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(error.message || 'Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.values(menuRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target)) {
          setShowMenuForId(null);
        }
      });
    };

    if (showMenuForId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenuForId]);

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const handleEnableNotifications = async () => {
    const loggedInAccount = user || mentor;
    if (!loggedInAccount) return;

    const role = mentor ? 'mentor' : 'user';
    // Force re-request permission even if previously denied
    await enableNotifications(loggedInAccount._id, role, true);

    // Check permission again
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Notifications | Admeasy"
        description="View your notifications"
        url="https://admeasy.in/notification"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-2 py-2 sm:px-4 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <AtSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#9f3562]" />
              <h1 className="text-sm sm:text-xl font-bold text-gray-900">Notifications</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {notifications.length > 0 && notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b14270] transition-colors text-[10px] sm:text-sm font-medium"
              >
                <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                Mark all as read
              </button>
            )}
            {!permissionGranted && (
              <button
                onClick={handleEnableNotifications}
                className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-[10px] sm:text-sm font-medium"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                Enable Notifications
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">
              When you get notifications, you'll see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const actor = notification.actor || {};
              // Use username if available, otherwise fallback to name, but never "Unknown" or "Someone"
              const actorDisplayName = actor.username || actor.name || null;
              const actorImage = actor.image || null;

              // Clean up the message - remove "Someone", "Unknown", "undefined" and actor name if duplicated
              let displayMessage = notification.message || '';
              // Remove "Someone" and "Unknown" and "undefined" from the beginning of the message
              displayMessage = displayMessage.replace(/^(Someone|Unknown|undefined)\s+/i, '');
              // Remove actor name if it appears at the start (to avoid duplication)
              if (actor.name && actor.name !== 'Unknown' && actor.name !== 'Someone') {
                displayMessage = displayMessage.replace(new RegExp(`^${actor.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '');
              }
              if (actor.username) {
                displayMessage = displayMessage.replace(new RegExp(`^${actor.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '');
              }

              // If we don't have actor info, just show the message without a name prefix
              const showActorName = actorDisplayName && actorDisplayName !== 'Unknown' && actorDisplayName !== 'Someone';

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-2 py-2 sm:px-4 sm:py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Actor Profile Picture */}
                    <div className="flex-shrink-0">
                      {actor.username ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${actor.username}`);
                          }}
                          className="w-8 h-8 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          {actorImage ? (
                            <img
                              src={actorImage}
                              alt={actorDisplayName || 'User'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Failed to load actor image:', actorImage);
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                              onLoad={() => {
                                // Hide fallback when image loads successfully
                                const fallback = document.querySelector(`[data-fallback-${notification._id}]`);
                                if (fallback) {
                                  fallback.style.display = 'none';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            data-fallback={notification._id}
                            className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${actorImage ? 'hidden' : 'flex'
                              }`}
                            style={{
                              backgroundColor: showActorName && actorDisplayName
                                ? `hsl(${(actorDisplayName.charCodeAt(0) || 0) * 137.508 % 360}, 70%, 50%)`
                                : 'hsl(0, 0%, 60%)',
                            }}
                          >
                            {showActorName && actorDisplayName ? actorDisplayName.charAt(0).toUpperCase() : '?'}
                          </div>
                        </button>
                      ) : (
                        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
                          {actorImage ? (
                            <img
                              src={actorImage}
                              alt={actorDisplayName || 'User'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Failed to load actor image:', actorImage);
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                              onLoad={() => {
                                // Hide fallback when image loads successfully
                                const fallback = document.querySelector(`[data-fallback-${notification._id}]`);
                                if (fallback) {
                                  fallback.style.display = 'none';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            data-fallback={notification._id}
                            className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${actorImage ? 'hidden' : 'flex'
                              }`}
                            style={{
                              backgroundColor: showActorName && actorDisplayName
                                ? `hsl(${(actorDisplayName.charCodeAt(0) || 0) * 137.508 % 360}, 70%, 50%)`
                                : 'hsl(0, 0%, 60%)',
                            }}
                          >
                            {showActorName && actorDisplayName ? actorDisplayName.charAt(0).toUpperCase() : '?'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-xs sm:text-sm leading-relaxed">
                        {showActorName && (
                          <>
                            {actor.username ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/${actor.username}`);
                                }}
                                className="font-semibold hover:underline hover:text-[#9f3562] cursor-pointer transition-colors"
                              >
                                {actorDisplayName}
                              </button>
                            ) : (
                              <span className="font-semibold">{actorDisplayName}</span>
                            )}
                            {' '}
                          </>
                        )}
                        <span className="text-gray-600">{displayMessage}</span>
                      </p>
                      <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Icon/Thumbnail and Menu on the right */}
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}

                      {/* 3 Dots Menu */}
                      <div className="relative" ref={(el) => (menuRefs.current[notification._id] = el)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenuForId(showMenuForId === notification._id ? null : notification._id);
                          }}
                          className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                        </button>
                        <AnimatePresence>
                          {showMenuForId === notification._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => handleDeleteClick(notification, e)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50 transition-colors text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Notification;
