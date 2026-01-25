import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { mentor } = useMentor();
  const { socket, isConnected } = useSocket();
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);

  // Helper function to fetch unread count
  const fetchUnreadCount = useCallback(async (showLoading = false) => {
    if (!loggedInAccount) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      
      if (isUserAccount) {
        // For users, fetch from /api/chats
        const response = await fetch('/api/chats', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.chats)) {
            // Calculate total unread count
            const totalUnread = data.chats.reduce((sum, chat) => {
              return sum + (chat.unreadCount || 0);
            }, 0);
            setUnreadCount(totalUnread);
          }
        }
      } else {
        // For mentors, fetch from both endpoints and combine counts
        const [mentorToUserResponse, mentorToMentorResponse] = await Promise.all([
          fetch('/api/mentor/chats', { credentials: 'include' }),
          fetch('/api/mentor/mentor-chats', { credentials: 'include' })
        ]);

        let totalUnread = 0;

        if (mentorToUserResponse.ok) {
          const data = await mentorToUserResponse.json();
          if (data.success && Array.isArray(data.chats)) {
            totalUnread += data.chats.reduce((sum, chat) => {
              return sum + (chat.unreadCount || 0);
            }, 0);
          }
        }

        if (mentorToMentorResponse.ok) {
          const data = await mentorToMentorResponse.json();
          if (data.success && Array.isArray(data.chats)) {
            totalUnread += data.chats.reduce((sum, chat) => {
              return sum + (chat.unreadCount || 0);
            }, 0);
          }
        }

        setUnreadCount(totalUnread);
      }
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [loggedInAccount, isUserAccount]);

  // Fetch initial unread count
  useEffect(() => {
    fetchUnreadCount(true);

    // Poll for updates every 10 seconds (more frequent for better UX)
    const interval = setInterval(() => fetchUnreadCount(false), 10000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket || !isConnected || !loggedInAccount) return;

    const handleNewMessage = (message) => {
      // Check if message is from current user (don't count own messages)
      const isFromCurrentUser = (user && message.senderId && (
        message.senderId.toString() === user._id?.toString() || 
        message.senderId.toString() === user.id?.toString()
      )) || (mentor && message.senderId && (
        message.senderId.toString() === mentor._id?.toString() || 
        message.senderId.toString() === mentor.id?.toString()
      ));

      // Only refresh count if message is not from current user
      if (!isFromCurrentUser) {
        // Refresh immediately to get accurate count
        fetchUnreadCount(false);
      }
    };

    const handleMessageRead = () => {
      // Refresh unread count when messages are read
      fetchUnreadCount(false);
    };

    // Handle mentor-to-mentor messages (only for mentors)
    const handleMentorToMentorMessage = (message) => {
      if (!isUserAccount) {
        // Check if message is from current mentor (don't count own messages)
        const isFromCurrentMentor = mentor && message.senderId && (
          message.senderId.toString() === mentor._id?.toString() || 
          message.senderId.toString() === mentor.id?.toString()
        );

        // Only refresh count if message is not from current mentor
        if (!isFromCurrentMentor) {
          fetchUnreadCount(false);
        }
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('message_sent', handleNewMessage); // Also listen for sent messages to refresh
    
    // Listen for mentor-to-mentor messages (only for mentors)
    if (!isUserAccount) {
      socket.on('receive_mentor_to_mentor_message', handleMentorToMentorMessage);
    }

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('message_sent', handleNewMessage);
      if (!isUserAccount) {
        socket.off('receive_mentor_to_mentor_message', handleMentorToMentorMessage);
      }
    };
  }, [socket, isConnected, loggedInAccount, user, mentor, fetchUnreadCount]);

  return { unreadCount, isLoading };
};
