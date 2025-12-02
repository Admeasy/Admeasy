import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUser, FaCheck, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { socket, isConnected, joinChat, sendMessage: socketSendMessage, isMentorOnline } = useSocket();
  const [mentor, setMentor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  useEffect(() => {
    // Only users can access user chats, mentors use different routes
    if (!user) {
      navigate('/login');
      return;
    }

    if (mentorId) {
      initializeChat();
    }
  }, [mentorId, user, navigate]);

  const initializeChat = async () => {
    try {
      // First, get or create the chat
      const chatResponse = await fetch(`/api/chats/${mentorId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to access chat');
      }

      const chatData = await chatResponse.json();
      setChatId(chatData.chat.chatId);

      // Join the chat room for real-time messaging
      joinChat(chatData.chat.chatId);

      // Fetch mentor details and messages
      await Promise.all([fetchMentorDetails(), fetchMessages(chatData.chat.chatId)]);
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
      console.log('Message sent successfully:', message);
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

  const fetchMentorDetails = async () => {
    try {
      const response = await fetch(`/api/mentors/${mentorId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mentor details');
      }

      const mentorData = await response.json();
      setMentor(mentorData);
    } catch (err) {
      console.error('Error fetching mentor details:', err);
      toast.error('Failed to load mentor information');
    }
  };

  const fetchMessages = async (chatIdParam) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chats/${mentorId}/messages`, {
        credentials: 'include'
      });

      if (!response.ok) {
        // If no chat exists yet (404), that's okay - user can start new conversation
        if (response.status === 404) {
          setMessages([]);
          setError(null);
        } else {
          throw new Error('Failed to fetch messages');
        }
      } else {
        const data = await response.json();
        setMessages(data.messages || []);
        setChatId(data.chatId);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't set error for 404s as it's expected for new chats
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

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Send message via Socket.io for real-time delivery
    socketSendMessage({
      chatId,
      senderId: user._id,
      message: messageToSend,
      senderRole: 'user'
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
    if (message.status === 'read') return <FaCheckDouble className="text-blue-500 text-xs" />;
    if (message.status === 'delivered') return <FaCheck className="text-gray-400 text-xs" />;
    return <FaCheck className="text-gray-300 text-xs" />;
  };

  if (isLoading && !mentor) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chats')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={mentor?.image || mentor?.imageUrl || fallbackProfilePic}
                  alt={mentor?.name || 'Mentor'}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                {mentorId && (
                  <div className="absolute -bottom-1 -right-1">
                    <FaCircle
                      className={`text-xs ${
                        isMentorOnline(mentorId) ? 'text-green-500' : 'text-gray-400'
                      }`}
                    />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {mentor?.name || 'Mentor'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {mentor?.username || 'Mentor'}
                  </p>
                  {mentorId && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isMentorOnline(mentorId)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isMentorOnline(mentorId) ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchMessages}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && messages.length === 0 && (
            <div className="text-center py-12">
              <FaUser className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Send your first message to begin chatting with {mentor?.name || 'this mentor'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = message.senderId === user?._id || message.senderId === user?.id;
              const isPreviousMessageFromSameSender = index > 0 && messages[index - 1].senderId === message.senderId;

              return (
                <div
                  key={message._id || index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isUser
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border'
                    } ${isPreviousMessageFromSameSender ? 'mt-1' : 'mt-4'}`}
                  >
                    <p className="text-sm leading-relaxed">{message.message || message.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                      isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatTime(message.createdAt || message.timestamp)}</span>
                      {isUser && getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-3 text-center">
              <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                Connecting to chat...
              </span>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${mentor?.name || 'mentor'}...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              disabled={isSending || !isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !isConnected}
              className={`px-6 py-3 rounded-full transition-colors flex items-center gap-2 ${
                newMessage.trim() && !isSending && isConnected
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaPaperPlane className="text-sm" />
              {isSending ? 'Sending...' : isConnected ? 'Send' : 'Offline'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
