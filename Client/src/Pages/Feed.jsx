import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import PostCard from '../components/PostCard';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';

const Feed = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);


  //🔥 SINGLE SOURCE OF TRUTH

  const updatePostInFeed = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === updatedPost._id ? { ...p, ...updatedPost } : p
      )
    );
  }, []);


  // Fetch Posts

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);

      const response = await fetch(
        `/api/posts?page=${pageNum}&limit=10`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      setPosts((prev) =>
        append ? [...prev, ...data.posts] : data.posts
      );

      setHasMore(
        data.posts.length === 10 &&
        pageNum < data.pagination.pages
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#9f3562]" />
          <p className="text-gray-600 font-medium">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden">
      <SEO
        title="Admeasy"
        description="Discover knowledge shared by mentors"
        url="https://admeasy.in"
      />

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">

          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                  Introducing Admeasy{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9f3562] to-[#701a3c]">
                    Feed
                  </span>
                </h1>
                <p className="text-gray-600 mt-2">
                  Your study-first community feed
                </p>
              </div>


              {!user && !mentor && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-fit h-fit px-1 py-1 font-semibold bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-[#9f3562]/50 transition-all duration-1500"
                >
                  Log in to interact
                </button>
              )}
            </div>
          </div>

          {/* Feed */}
          {posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow">
              <p className="text-lg font-semibold text-gray-800">
                No posts available yet
              </p>
              <p className="text-gray-500 mt-1">
                Check back later for mentor updates
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <div key={post._id} className="relative">
                  <PostCard
                    post={post}
                    onPostUpdate={updatePostInFeed} // 🔥 CRITICAL
                  />
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-8 pb-12">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 bg-white border-2 border-gray-200 rounded-2xl flex items-center gap-3"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading...
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
    </div>
  );
};

export default Feed;
