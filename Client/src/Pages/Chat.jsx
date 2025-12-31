import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);
  const initializationDone = useRef(false);

  const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  useEffect(() => {
    // Only users can access user chats
    if (!user) {
      navigate('/login');
      return;
    }

    if (mentorId && !initializationDone.current) {
      initializationDone.current = true;
      initializeChat();
    }
  }, [mentorId, user, navigate]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionError(false);

      // First, get or create the chat
      const chatResponse = await fetch(`/api/chats/${mentorId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to access chat');
      }

      const chatData = await chatResponse.json();
      
      if (!chatData.success || !chatData.chat) {
        throw new Error('Invalid chat response');
      }

      setChatId(chatData.chat.chatId);

      // Set mentor data from chat response
      if (chatData.chat.mentorName) {
        setMentor({
          _id: chatData.chat.mentorId,
          name: chatData.chat.mentorName,
          username: chatData.chat.mentorUsername,
          image: chatData.chat.mentorImage
        });
      }

      // Fetch messages immediately (don't wait for socket)
      await fetchMessages(chatData.chat.chatId);
      
      // Join socket room in background (non-blocking)
      if (isConnected && socket) {
        joinChat(chatData.chat.chatId);
        console.log('Successfully joined chat:', chatData.chat.chatId);
      } else {
        // If socket not ready, try to join when it becomes available
        const tryJoinChat = () => {
          if (isConnected && socket && chatData.chat.chatId) {
            joinChat(chatData.chat.chatId);
            console.log('Successfully joined chat after socket ready:', chatData.chat.chatId);
          }
        };
        
        // Try immediately
        setTimeout(tryJoinChat, 100);
        
        // Also set up a listener for when socket becomes connected
        if (socket) {
          socket.once('authenticated', () => {
            if (chatData.chat.chatId) {
              joinChat(chatData.chat.chatId);
            }
          });
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load chat');
      setIsLoading(false);
      toast.error('Failed to initialize chat');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat room when socket becomes connected
  useEffect(() => {
    if (isConnected && socket && chatId) {
      joinChat(chatId);
      console.log('Joined chat room:', chatId);
    }
  }, [isConnected, socket, chatId, joinChat]);

  // Socket.io listeners for real-time messages
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleReceiveMessage = (message) => {
      console.log('Received message:', message);
      // Only add message if it belongs to this chat
      if (message.chatId && message.chatId.toString() === chatId.toString()) {
        setMessages(prevMessages => {
          const exists = prevMessages.some(m => 
            m._id && message._id && m._id.toString() === message._id.toString()
          );
          if (!exists) {
            return [...prevMessages, message];
          }
          return prevMessages;
        });
        // Clear sending state when message is received
        setIsSending(false);
        // Scroll to bottom when new message arrives
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const handleMessageError = (error) => {
      console.error('Message error:', error);
      toast.error(error.message || 'Failed to send message');
      setIsSending(false);
    };

    const handleMessageSent = (message) => {
      console.log('Message sent successfully:', message);
      // Add the sent message to the list if it's not already there
      if (message.chatId && message.chatId.toString() === chatId.toString()) {
        setMessages(prevMessages => {
          const exists = prevMessages.some(m => 
            m._id && message._id && m._id.toString() === message._id.toString()
          );
          if (!exists) {
            return [...prevMessages, message];
          }
          return prevMessages;
        });
      }
      setIsSending(false);
      setTimeout(() => scrollToBottom(), 100);
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

  const fetchMessages = async (chatIdParam) => {
    try {
      const response = await fetch(`/api/chats/${mentorId}/messages`, {
        credentials: 'include'
      });

      if (!response.ok) {
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
      if (!err.message.includes('404')) {
        setError(err.message);
        toast.error('Failed to load messages');
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || isSending) return;

    if (!isConnected || !socket) {
      toast.error('Not connected to server. Please wait...');
      return;
    }

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Send message via Socket.io
    socketSendMessage({
      chatId,
      senderId: user._id,
      message: messageToSend,
      senderRole: 'user'
    });

    // Set timeout to reset sending state if no response
    setTimeout(() => {
      setIsSending(false);
    }, 5000);
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

  if (isLoading && !mentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562] mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex flex-col transition-all duration-300 relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      
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
              onClick={() => navigate('/chats')}
              className="text-xl p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#9f3562]"
            >
              <FaArrowLeft />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Link to={`/${mentor?.username}`}>
                  <img
                    src={mentor?.image || mentor?.imageUrl || fallbackProfilePic}
                    alt={mentor?.name || 'Mentor'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 hover:ring-[#9f3562]/30 transition-all"
                    onError={(e) => {
                      e.target.src = fallbackProfilePic;
                    }}
                  />
                </Link>
                {mentorId && (
                  <div className="absolute -bottom-0 -right-0">
                    <FaCircle
                      className={`text-xs ${isMentorOnline(mentorId) ? 'text-green-500' : 'text-gray-400'}`}
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
                    <span className={`text-xs px-2 py-1 rounded-full ${isMentorOnline(mentorId)
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
      <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-red-200 shadow-xl shadow-gray-200/50">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => initializeChat()}
                className="px-6 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          )}

          {connectionError && (
            <div className="mb-4 p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl text-yellow-800 text-sm shadow-sm">
              Connection unstable. Messages may be delayed.
            </div>
          )}

          {!error && messages.length === 0 && (
            <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
              <FaUser className="mx-auto text-6xl text-[#9f3562]/30 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600">
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
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isUser
                      ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-br-md'
                      : 'bg-white/95 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200'
                      } ${isPreviousMessageFromSameSender ? 'mt-1' : 'mt-4'}`}
                  >
                    <p className="text-sm leading-relaxed">{message.message || message.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isUser ? 'text-pink-100' : 'text-gray-500'}`}>
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
              placeholder={`Message ${mentor?.name || 'mentor'}...`}
              className="flex-1 px-4 py-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100 text-gray-900 placeholder:text-gray-500 shadow-sm"
              disabled={isSending || !isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !isConnected}
              className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 shadow-sm ${newMessage.trim() && !isSending && isConnected
                ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <FaPaperPlane className="text-sm" />
              {isSending ? 'Sending...' : isConnected ? 'Send' : 'Offline'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Chat;