import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { useLocation } from 'react-router-dom';

export const useUnreadSpaceMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { mentor } = useMentor();
  const location = useLocation();
  const loggedInAccount = user || mentor;

  // Helper function to fetch unread space message count
  const fetchUnreadCount = useCallback(async (showLoading = false) => {
    if (!loggedInAccount) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      
      // Fetch notifications and filter for space-related ones
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          // Count unread space notifications
          // Space notifications are FOLLOWING_POST or REPLY with originPath starting with /spaces/
          const spaceNotifications = data.notifications.filter(notification => {
            const isSpaceNotification = 
              (notification.type === 'FOLLOWING_POST' || notification.type === 'REPLY') &&
              notification.originPath &&
              notification.originPath.startsWith('/spaces/');
            
            // Don't count if user is currently viewing that space
            if (isSpaceNotification && !notification.isRead) {
              const spaceIdMatch = notification.originPath.match(/\/spaces\/([^/]+)/);
              if (spaceIdMatch) {
                const spaceId = spaceIdMatch[1];
                const currentPath = location.pathname;
                // If user is on the space page, don't count it
                if (currentPath === `/spaces/${spaceId}`) {
                  return false;
                }
              }
              return true;
            }
            return false;
          });
          
          setUnreadCount(spaceNotifications.length);
        }
      }
    } catch (err) {
      console.error('Error fetching unread space messages:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [loggedInAccount, location.pathname]);

  // Fetch initial unread count
  useEffect(() => {
    fetchUnreadCount(true);

    // Poll for updates every 15 seconds
    const interval = setInterval(() => fetchUnreadCount(false), 15000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh when location changes (user navigates to/from space page)
  useEffect(() => {
    fetchUnreadCount(false);
  }, [location.pathname, fetchUnreadCount]);

  return { unreadCount, isLoading };
};
