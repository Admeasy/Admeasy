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
  const { mentor, isLoading: mentorLoading } = useMentor();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [onlineMentors, setOnlineMentors] = useState(new Set());
  const reconnectTimeoutRef = useRef(null);
  const authRetryTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Wait for mentor loading to complete before initializing socket
    if (mentorLoading) {
      console.log('Mentor still loading, waiting...');
      return;
    }

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

    const initSocket = async () => {
      console.log('Initializing socket connection...');
      
      // Make an authenticated HTTP request first to ensure session is set
      // This is critical for production where session cookies need to be established
      try {
        if (user && user._id) {
          console.log('Making authenticated request to set session before socket connection');
          await fetch('/api/users/me', {
            credentials: 'include',
            method: 'GET'
          }).catch(err => {
            console.warn('Failed to set session via /api/users/me:', err);
          });
          // Small delay to ensure session cookie is set and propagated
          await new Promise(resolve => setTimeout(resolve, 500));
        } else if (mentor && mentor._id) {
          console.log('Making authenticated request to set session before socket connection');
          const response = await fetch('/api/mentors/me', {
            credentials: 'include',
            method: 'GET'
          }).catch(err => {
            console.warn('Failed to set session via /api/mentors/me:', err);
            return null;
          });
          
          if (response && response.ok) {
            console.log('Session should be set now, waiting for cookie propagation...');
            // Small delay to ensure session cookie is set and propagated
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.warn('Failed to set session - response not OK:', response?.status);
          }
        }
      } catch (err) {
        console.warn('Error setting session before socket connection:', err);
      }
      
      // Fix: Use the correct backend URL instead of Vite dev server
      // In development, connect directly to backend (localhost:5000)
      // In production, use VITE_API_URL or default to same origin
      const getSocketUrl = () => {
        if (import.meta.env.VITE_API_URL) {
          return import.meta.env.VITE_API_URL;
        }
        // In development, backend is on port 5000
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:5000';
        }
        // In production, use same origin
        return window.location.origin;
      };
      
      const socketUrl = getSocketUrl();
      console.log('Connecting to socket server:', socketUrl);
      
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
        // Don't set isConnected to true yet - wait for authentication
        
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
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setOnlineMentors(new Set());
      });

      // Authentication events
      socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
        setIsConnected(true);
      });

      socket.on('auth_required', async (data) => {
        console.log('Authentication required:', data.message);
        setIsConnected(false);
        
        // Clear any existing retry timeout
        if (authRetryTimeoutRef.current) {
          clearTimeout(authRetryTimeoutRef.current);
        }
        
        // Make an authenticated HTTP request first to set the session
        // This is critical for production where session cookies need to be established
        try {
          if (user && user._id) {
            console.log('Making authenticated request to set session for user');
            // Make an authenticated request to set the session
            await fetch('/api/users/me', {
              credentials: 'include',
              method: 'GET'
            }).catch(err => {
              console.warn('Failed to set session via /api/users/me:', err);
            });
          } else if (mentor && mentor._id) {
            console.log('Making authenticated request to set session for mentor');
            // Make an authenticated request to set the session
            await fetch('/api/mentors/me', {
              credentials: 'include',
              method: 'GET'
            }).catch(err => {
              console.warn('Failed to set session via /api/mentors/me:', err);
            });
          }
        } catch (err) {
          console.warn('Error setting session:', err);
        }
        
        // Retry join after making authenticated HTTP request
        // This allows time for the session to be established
        authRetryTimeoutRef.current = setTimeout(() => {
          if (socket.connected && socketRef.current === socket) {
            if (user && user._id) {
              console.log('Retrying user join after auth_required');
              socket.emit('join_user', user._id);
            } else if (mentor && mentor._id) {
              console.log('Retrying mentor join after auth_required');
              socket.emit('join_mentor', mentor._id);
            }
          }
        }, 2000); // Wait 2 seconds for session to be set via HTTP request
      });

      // Authentication error handler
      socket.on('auth_error', (data) => {
        console.error('Authentication error:', data.message);
        setIsConnected(false);
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

    initSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (authRetryTimeoutRef.current) {
        clearTimeout(authRetryTimeoutRef.current);
      }
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?._id, mentor?._id, mentorLoading]); // Only reconnect when user/mentor ID changes or mentor loading completes

  // Retry authentication when user/mentor context updates (session might be set now)
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && !isConnected) {
      // Socket is connected but not authenticated - retry authentication
      if (user && user._id) {
        console.log('Retrying user authentication after context update');
        socketRef.current.emit('join_user', user._id);
      } else if (mentor && mentor._id) {
        console.log('Retrying mentor authentication after context update');
        socketRef.current.emit('join_mentor', mentor._id);
      }
    }
  }, [user, mentor, isConnected]);

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
