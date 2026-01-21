import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { ArrowLeft, Heart, UserPlus, MessageCircle, ThumbsUp, Repeat2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';

const Notification = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
      case 'POST_LIKE':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'COMMENT_LIKE':
        return <ThumbsUp className="w-5 h-5 text-blue-500 fill-blue-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500" />;
      case 'FOLLOW':
      case 'FOLLOW_BACK':
        return <UserPlus className="w-5 h-5 text-green-500 fill-green-500" />;
      case 'REPOST':
        return <Repeat2 className="w-5 h-5 text-purple-500" />;
      case 'FOLLOWING_POST':
        return <ImageIcon className="w-5 h-5 text-purple-500 fill-purple-500" />;
      case 'MESSAGE':
        return <MessageCircle className="w-5 h-5 text-purple-500 fill-purple-500" />;
      default:
        return <Heart className="w-5 h-5 text-gray-500" />;
    }
  };

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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
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
              
              // Clean up the message - remove "Someone", "Unknown", and actor name if duplicated
              let displayMessage = notification.message || '';
              // Remove "Someone" and "Unknown" from the beginning of the message
              displayMessage = displayMessage.replace(/^(Someone|Unknown)\s+/i, '');
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
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Actor Profile Picture */}
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
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
                          className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${
                            actorImage ? 'hidden' : 'flex'
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
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm leading-relaxed">
                        {showActorName && (
                          <>
                            <span className="font-semibold">{actorDisplayName}</span>{' '}
                          </>
                        )}
                        <span className="text-gray-600">{displayMessage}</span>
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Icon/Thumbnail on the right */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 mt-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
