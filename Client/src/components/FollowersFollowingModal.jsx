import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const FollowersFollowingModal = ({
  isOpen,
  onClose,
  targetId,
  type, // 'followers' or 'following'
  profileType, // 'user' or 'mentor'
}) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && targetId) {
      fetchList();
    } else {
      setList([]);
      setError(null);
    }
  }, [isOpen, targetId, type]);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/api/users/${targetId}/${type}`;
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch list');
      }

      const data = await response.json();
      if (data.success) {
        // Use image field directly from backend response (no need for additional API calls)
        setList(data[type]);
      } else {
        throw new Error(data.message || 'Failed to fetch list');
      }
    } catch (err) {
      console.error('Error fetching list:', err);
      setError(err.message || 'Failed to load list');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const getProfileUrl = (item) => {
    return `/${item.username || item._id}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/20 border border-gray-100 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9f3562] via-pink-500 to-[#b14270]" />

            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {type === 'followers' ? (
                    <Users className="w-5 h-5 text-blue-500" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {type === 'followers' ? 'Followers' : 'Following'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {loading ? 'Loading...' : `${list.length} ${list.length === 1 ? 'person' : 'people'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={fetchList}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {type === 'followers' ? 'followers' : 'following'} yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    {type === 'followers'
                      ? 'This profile doesn\'t have any followers yet.'
                      : 'This profile isn\'t following anyone yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {list.map((item) => (
                    <Link
                      key={item._id}
                      to={`/${item.username || item._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.imageUrl || item.image || fallbackProfilePic}
                          alt={item.name || item.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#9f3562]/30 transition-all"
                          onError={(e) => {
                            e.target.src = fallbackProfilePic;
                          }}
                        />
                        {item.type === 'mentor' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">M</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {item.name || item.username}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          @{item.username}
                          {item.type === 'mentor' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Mentor
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FollowersFollowingModal;
