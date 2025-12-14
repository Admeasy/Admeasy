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
  const reconnectTimeoutRef = useRef(null);
  const connectionAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Only initialize socket if user or mentor exists
    if (!user && !mentor) {
      console.log('No user or mentor, skipping socket connection');
      return;
    }

    // Prevent multiple socket connections
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected');
      return;
    }

    const initSocket = () => {
      console.log('Initializing socket connection...');
      
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 20000,
        autoConnect: true
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected successfully:', socket.id);
        setIsConnected(true);
        connectionAttempts.current = 0;

        // Auto-join based on user type - socket will verify session server-side
        if (user && user._id) {
          console.log('Joining as user:', user._id);
          socket.emit('join_user', user._id);
        } else if (mentor && mentor._id) {
          console.log('Joining as mentor:', mentor._id);
          socket.emit('join_mentor', mentor._id);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        connectionAttempts.current++;
        
        if (connectionAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          socket.disconnect();
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setOnlineMentors(new Set());

        // Only attempt reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Server initiated disconnect, might be intentional
          console.log('Server disconnected socket, not auto-reconnecting');
        }
      });

      // Authentication error handler
      socket.on('auth_error', (data) => {
        console.error('Authentication error:', data.message);
        setIsConnected(false);
        // Don't retry on auth errors
        socket.disconnect();
      });

      // Presence tracking events
      socket.on('user_online', (data) => {
        console.log('User came online:', data.userId);
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      socket.on('user_offline', (data) => {
        console.log('User went offline:', data.userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socket.on('mentor_online', (data) => {
        console.log('Mentor came online:', data.mentorId);
        setOnlineMentors(prev => new Set([...prev, data.mentorId]));
      });

      socket.on('mentor_offline', (data) => {
        console.log('Mentor went offline:', data.mentorId);
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
      console.log('Cleaning up socket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?._id, mentor?._id]); // Only reconnect when user/mentor ID changes

  // Utility functions
  const joinChat = (chatId) => {
    if (socketRef.current && isConnected) {
      console.log('Joining chat:', chatId);
      socketRef.current.emit('join_chat', chatId);
    } else {
      console.warn('Cannot join chat: socket not connected');
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current && isConnected) {
      console.log('Leaving chat:', chatId);
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (data) => {
    if (socketRef.current && isConnected) {
      console.log('Sending message:', data);
      socketRef.current.emit('send_message', data);
    } else {
      console.error('Cannot send message: socket not connected');
      // Emit error to trigger UI feedback
      if (socketRef.current) {
        socketRef.current.emit('message_error', { message: 'Not connected to server' });
      }
    }
  };

  const getOnlineStatus = (userId, mentorId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_online_status', { userId, mentorId });
    }
  };

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