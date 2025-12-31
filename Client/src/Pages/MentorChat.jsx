import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUser, FaCheck, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useMentor } from '../context/MentorContext';
import { useSocket } from '../context/SocketContext';

const MentorChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { mentor } = useMentor();
  const { socket, isConnected, joinChat, sendMessage: socketSendMessage, isUserOnline } = useSocket();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  useEffect(() => {
    // Only mentors can access mentor chats, users use different routes
    if (!mentor) {
      navigate('/mentors/login');
      return;
    }

    if (userId) {
      initializeChat();
    }
  }, [userId, mentor, navigate]);

  const initializeChat = async () => {
    try {
      // Fetch user details and messages
      await Promise.all([fetchUserDetails(), fetchMessages()]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load chat');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io listeners for real-time messages
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleReceiveMessage = (message) => {
      // Add new message to state
      setMessages(prevMessages => {
        // Check if message already exists (avoid duplicates)
        const exists = prevMessages.some(m => m._id === message._id);
        if (!exists) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });
    };

    const handleMessageError = (error) => {
      console.error('Message error:', error);
      toast.error(error.message || 'Failed to send message');
      setIsSending(false);
    };

    const handleMessageSent = (message) => {
      setIsSending(false);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_error', handleMessageError);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_error', handleMessageError);
      socket.off('message_sent', handleMessageSent);
    };
  }, [socket, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user details:', err);
      toast.error('Failed to load student information');
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/mentor/chats/${userId}/messages`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No conversation exists - mentors cannot initiate chats
          setError('No conversation exists with this student');
          setMessages([]);
        } else {
          throw new Error('Failed to fetch messages');
        }
      } else {
        const data = await response.json();
        setMessages(data.messages || []);
        setChatId(data.chatId);

        // Join the chat room for real-time messaging
        if (data.chatId) {
          joinChat(data.chatId);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!err.message.includes('404')) {
        setError(err.message);
        toast.error('Failed to load messages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || isSending || !isConnected) return;

    // Check if this is a reply to an existing conversation
    if (messages.length === 0) {
      toast.error('You can only reply to existing conversations');
      return;
    }

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Send message via Socket.io for real-time delivery
    socketSendMessage({
      chatId,
      senderId: mentor._id,
      message: messageToSend,
      senderRole: 'mentor'
    });

    // Note: The message will be added to state via the 'receive_message' event
    // This provides instant feedback while the server processes it
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getMessageStatus = (message) => {
    if (message.status === 'read') return <FaCheckDouble className="text-pink-200 text-xs" />;
    if (message.status === 'delivered') return <FaCheck className="text-pink-200/70 text-xs" />;
    return <FaCheck className="text-pink-200/50 text-xs" />;
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex flex-col transition-all duration-300 relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mentor/chats')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#9f3562]"
            >
              <FaArrowLeft />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Link to={`/${user?.username}`}>
                  <img
                    src={user?.image || user?.imageUrl || fallbackProfilePic}
                    alt={user?.name || 'Student'}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = fallbackProfilePic;
                    }}
                  />
                </Link>
                {userId && (
                  <div className="absolute -bottom-0 -right-0">
                    <FaCircle
                      className={`text-xs ${isUserOnline(userId) ? 'text-green-500' : 'text-gray-400'
                        }`}
                    />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {user?.name || 'Student'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {user?.course || 'Student'}
                  </p>
                  {userId && (
                    <span className={`text-xs px-2 py-1 rounded-full ${isUserOnline(userId)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {isUserOnline(userId) ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-red-200 shadow-xl shadow-gray-200/50">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => navigate('/mentor/chats')}
                className="px-6 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300"
              >
                Back to Messages
              </button>
            </div>
          )}

          {!error && messages.length === 0 && (
            <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
              <FaUser className="mx-auto text-6xl text-[#9f3562]/30 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No conversation yet
              </h3>
              <p className="text-gray-600">
                This student hasn't started a conversation with you yet.
                You can only reply to messages they send you.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => {
              const isMentor = message.senderId === mentor?._id || message.senderId === mentor?.id;
              const isPreviousMessageFromSameSender = index > 0 && messages[index - 1].senderId === message.senderId;

              return (
                <div
                  key={message._id || index}
                  className={`flex ${isMentor ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isMentor
                      ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-br-md'
                      : 'bg-white/95 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200'
                      } ${isPreviousMessageFromSameSender ? 'mt-1' : 'mt-4'}`}
                  >
                    <p className="text-sm leading-relaxed">{message.message || message.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isMentor ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                      <span>{formatTime(message.createdAt || message.timestamp)}</span>
                      {isMentor && getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Only show if there's an existing conversation */}
      {messages.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0 z-10 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* Connection Status */}
            {!isConnected && (
              <div className="mb-3 text-center">
                <span className="text-sm text-orange-600 bg-orange-100/80 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-200">
                  Connecting to chat...
                </span>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Reply to ${user?.name || 'student'}...`}
                className="flex-1 px-4 py-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100 text-gray-900 placeholder:text-gray-500 shadow-sm"
                disabled={isSending || !isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending || !isConnected || messages.length === 0}
                className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 shadow-sm ${newMessage.trim() && !isSending && isConnected && messages.length > 0
                  ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white hover:scale-105 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <FaPaperPlane className="text-sm" />
                {isSending ? 'Sending...' : isConnected ? 'Reply' : 'Offline'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorChat;