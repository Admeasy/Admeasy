import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import PostCard from '../components/PostCard';
import Footer from '../components/Footer';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const MentorPostsFeed = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // FIXED: useCallback to prevent infinite loops
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/mentor-posts?page=${pageNum}&limit=10`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      if (data.success) {
        if (append) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.posts.length === 10 && pageNum < data.pagination.pages);
      } else {
        throw new Error(data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // Empty deps - function is stable

  // FIXED: Remove navigate from deps
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 lg:ml-72 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#9f3562]" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#9f3562]/10 animate-ping" />
          </div>
          <p className="text-gray-600 font-medium">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 lg:ml-72 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                  Mentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9f3562] via-[#b14270] to-[#701a3c]">Insights</span>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base font-medium">Discover knowledge shared by top industry mentors</p>
              </div>
              
              {!user && !mentor && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-semibold whitespace-nowrap"
                >
                  Log in to interact
                </button>
              )}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-gray-200 shadow-xl shadow-gray-200/50">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-gray-900 text-lg font-semibold mb-2">No posts available yet</p>
              <p className="text-gray-500">Check back later for mentor updates!</p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {posts.map((post) => (
                <div key={post._id} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#9f3562]/20 via-pink-300/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>
                  <div className="relative">
                    <PostCard post={post} />
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-8 pb-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-white hover:border-[#9f3562]/30 hover:text-[#9f3562] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold shadow-lg shadow-gray-200/50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-[#9f3562]" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full mt-20 border-t border-gray-200/50 bg-white/60 backdrop-blur-xl relative z-20">
        <Footer />
      </div>
    </div>
  );
};

export default MentorPostsFeed;