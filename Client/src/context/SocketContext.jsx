import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useUser } from './UserContext';
import { useMentor } from './MentorContext';
import config from '../config';


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
  const { mentor, isLoading: mentorLoading } = useMentor();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [onlineMentors, setOnlineMentors] = useState(new Set());
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (mentorLoading) {
      return;
    }

    // Disconnect any existing socket if auth context is cleared
    if (!user && !mentor) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers(new Set());
      setOnlineMentors(new Set());
      return;
    }

    // Recreate socket whenever the authenticated identity changes
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = config.apiUrl;

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

    socket.on('connect', () => {
    });

    socket.on('authenticated', (data) => {
      setIsConnected(true);
    });

    socket.on('auth_error', (data) => {
      console.error('Authentication error:', data.message);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setOnlineUsers(new Set());
      setOnlineMentors(new Set());
    });

    // Presence tracking events
    socket.on('user_online', (data) => {
      const userId = String(data.userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user_offline', (data) => {
      const userId = String(data.userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on('mentor_online', (data) => {
      const mentorId = String(data.mentorId);
      setOnlineMentors(prev => new Set([...prev, mentorId]));
    });

    socket.on('mentor_offline', (data) => {
      const mentorId = String(data.mentorId);
      setOnlineMentors(prev => {
        const newSet = new Set(prev);
        newSet.delete(mentorId);
        return newSet;
      });
    });

    // Listen for online_status responses
    socket.on('online_status', (status) => {
      if (status.userOnline && status.userId) {
        const userId = String(status.userId);
        if (status.userOnline) {
          setOnlineUsers(prev => new Set([...prev, userId]));
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
      if (status.mentorOnline !== undefined && status.mentorId) {
        const mentorId = String(status.mentorId);
        if (status.mentorOnline) {
          setOnlineMentors(prev => new Set([...prev, mentorId]));
        } else {
          setOnlineMentors(prev => {
            const newSet = new Set(prev);
            newSet.delete(mentorId);
            return newSet;
          });
        }
      }
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?._id, mentor?._id, mentorLoading]); // Reconnect when identity changes

  // Utility functions
  const joinChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    } else {
      console.warn('Cannot join chat: socket not connected');
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

  const joinSpace = (spaceId) => {
    if (socketRef.current && isConnected) {
      console.log('Joining space room:', spaceId);
      socketRef.current.emit('join_space', spaceId);
    } else {
      console.warn('Cannot join space: socket not connected', {
        hasSocket: !!socketRef.current,
        isConnected
      });
    }
  };

  const leaveSpace = (spaceId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_space', spaceId);
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
    joinSpace,
    leaveSpace,
    isUserOnline: (userId) => userId ? onlineUsers.has(String(userId)) : false,
    isMentorOnline: (mentorId) => mentorId ? onlineMentors.has(String(mentorId)) : false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
