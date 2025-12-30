import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft, FaUser, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isMentorOnline } = useSocket();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = Array.isArray(chats) ? chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    return (
      chat.mentorName?.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.toLowerCase().includes(searchLower)
    );
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    // Updated Wrapper
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-admeasy-bold text-thead1">
            My Chats
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaArrowLeft />
            Back
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="text-center py-8">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}

        {!error && filteredChats.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaUser className="mx-auto text-6xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start a conversation with a mentor to see your chats here'
              }
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filteredChats.map((chat) => (
            <Link
              key={chat.mentorId}
              to={`/chats/${chat.mentorId}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Mentor Avatar */}
                <div className="flex-shrink-0 relative">
                  <img
                    src={chat.mentorImage || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                    alt={chat.mentorName}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <FaCircle
                      className={`text-sm ${
                        isMentorOnline(chat.mentorId) ? 'text-green-500' : 'text-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-thead1 truncate">
                      {chat.mentorName || 'Mentor'}
                    </h3>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {formatLastMessageTime(chat.lastMessageTime)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {chat.lastMessage || 'No messages yet'}
                  </p>

                  {chat.unreadCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {chat.unreadCount} new message{chat.unreadCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow Indicator */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Chats;