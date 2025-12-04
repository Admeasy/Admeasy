import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useUser } from './UserContext';
import { useMentor } from './MentorContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [onlineMentors, setOnlineMentors] = useState(new Set());

  useEffect(() => {
    // Initialize socket connection
    const initSocket = () => {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);

        // Join appropriate room based on user type
        if (user && user._id) {
          socket.emit('join_user', user._id);
        } else if (mentor && mentor._id) {
          socket.emit('join_mentor', mentor._id);
        }
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        setOnlineUsers(new Set());
        setOnlineMentors(new Set());
      });

      // Presence tracking events
      socket.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      socket.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socket.on('mentor_online', (data) => {
        setOnlineMentors(prev => new Set([...prev, data.mentorId]));
      });

      socket.on('mentor_offline', (data) => {
        setOnlineMentors(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.mentorId);
          return newSet;
        });
      });

      return socket;
    };

    const socket = initSocket();

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Only run once on mount

  // Handle user/mentor changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    // Join appropriate room when user/mentor changes
    if (user && user._id) {
      socket.emit('join_user', user._id);
    } else if (mentor && mentor._id) {
      socket.emit('join_mentor', mentor._id);
    }
  }, [user, mentor, isConnected]);

  // Utility functions
  const joinChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', data);
    }
  };

  const getOnlineStatus = (userId, mentorId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_online_status', { userId, mentorId });
    }
  };

  // Listen for online status responses
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleOnlineStatus = (status) => {
      // This could be enhanced to provide callbacks or state updates
      console.log('Online status:', status);
    };

    socket.on('online_status', handleOnlineStatus);

    return () => {
      socket.off('online_status', handleOnlineStatus);
    };
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    onlineMentors,
    joinChat,
    leaveChat,
    sendMessage,
    getOnlineStatus,
    isUserOnline: (userId) => onlineUsers.has(userId),
    isMentorOnline: (mentorId) => onlineMentors.has(mentorId)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
