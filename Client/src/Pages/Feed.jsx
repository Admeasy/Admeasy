import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import PostCard from '../components/PostCard';
import MentorSuggestionSwiper from '../components/MentorSuggestionSwiper';
import NotificationBell from '../components/NotificationBell';
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
  const observerTarget = useRef(null);
  const observerRef = useRef(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

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
      loadingMoreRef.current = pageNum !== 1;

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

      const hasMoreValue = data.posts.length === 10 && pageNum < data.pagination.pages;
      setHasMore(hasMoreValue);
      hasMoreRef.current = hasMoreValue;
      pageRef.current = pageNum;
    } catch (err) {
      console.error(err);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current || isFetchingRef.current) {
      return;
    }
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  }, [fetchPosts]);

  // Infinite scroll with Intersection Observer and scroll fallback
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Only set up observer if we have more posts to load
    if (!hasMore) return;

    const handleScroll = () => {
      if (!hasMoreRef.current || loadingMoreRef.current || isFetchingRef.current) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user is within 300px of bottom
      if (scrollTop + windowHeight >= documentHeight - 300) {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    };

    // Try Intersection Observer first
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            if (hasMoreRef.current && !loadingMoreRef.current && !isFetchingRef.current) {
              const nextPage = pageRef.current + 1;
              pageRef.current = nextPage;
              setPage(nextPage);
              fetchPosts(nextPage, true);
            }
          }
        },
        { 
          threshold: 0.1,
          rootMargin: '200px'
        }
      );

      observerRef.current = observer;
      observer.observe(currentTarget);
    }

    // Add scroll listener as fallback
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, fetchPosts, posts.length]);
  const [randomHeading, setRandomHeading] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    const userName = (user?.name || "").split(' ')[0] || "there";
    const mentorName = (mentor?.name || "").split(' ')[0] || "there";

    const userHeadings = [
      { title: "Yeh feed marks badhane wali hai", subtitle: "Your study-first community feed" },
      { title: "Mentors ne bola, sunna padega", subtitle: "Your study-first community feed" },
      {
        title: "Scroll less nonsense. Scroll real study advice.",
        subtitle: "A feed made only for students."
      },
      { title: "College clarity starts here", subtitle: "Your study-first community feed" },
      { title: `Hey ${userName} 👋, mentors have dropped something useful`, subtitle: "Your study-first community feed" },
      { title: `Welcome back, ${userName}! Top mentors are active`, subtitle: "Your study-first community feed" },
      { title: "Marks, boards, college, sab ka scene clear hoga", subtitle: "Step-by-step guidance from real seniors" },
      {
        title: "Talk to seniors who’ve already cracked what you’re preparing for.", subtitle: "No guessing. No YouTube overload. Just clear direction"
      },
      {
        title: "Not teachers. Not influencers. Seniors who actually care.", subtitle: "Real experiences. Honest mistakes. Practical guidance."
      },
      {
        title: "One right suggestion > 100 random videos",
        subtitle: "Ask seniors. Save time. Reduce stress."
      },
      {
        title: "Jo galti tum kar rahe ho, hum already kar chuke hain.",
        subtitle: "Learn from seniors. Don’t repeat mistakes."
      },
    ];

    const mentorHeadings = [
      { title: `${mentorName}, Students need your guidance today`, subtitle: "Your experience matters" },
      { title: "Your experience can change someone’s college decision", subtitle: "Help them make the right choice" },
      { title: `${mentorName}, Help someone choose better`, subtitle: "Your guidance is valuable" },
      { title: `${mentorName}, Answer a student’s doubt`, subtitle: "Clear their path to success" },
      { title: `${mentorName}, Guide students today`, subtitle: "Inspire the next batch" }
    ];

    if (user) {
      const random = userHeadings[Math.floor(Math.random() * userHeadings.length)];
      setRandomHeading(random);
    } else if (mentor) {
      const random = mentorHeadings[Math.floor(Math.random() * mentorHeadings.length)];
      setRandomHeading(random);
    } else {
      setRandomHeading({
        title: "Introducing Admeasy Feed",
        subtitle: "Your study-first community feed"
      });
    }
  }, [user, mentor]);

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

      {/* Notification Bell */}
      <NotificationBell />

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">

          {/* Header */}
          <div className="w-9/10 mb-8 sm:mb-14">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  {user || mentor ? (
                    <>
                      {randomHeading.title.includes(user?.name?.split(' ')[0] || mentor?.name?.split(' ')[0]) ? (
                        <>
                          {randomHeading.title.split(user?.name?.split(' ')[0] || mentor?.name?.split(' ')[0])[0]}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9f3562] to-[#701a3c]">
                            {user?.name?.split(' ')[0] || mentor?.name?.split(' ')[0]}
                          </span>
                          {randomHeading.title.split(user?.name?.split(' ')[0] || mentor?.name?.split(' ')[0])[1]}
                        </>
                      ) : (
                        randomHeading.title
                      )}
                    </>
                  ) : (
                    <>
                      Introducing Admeasy{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9f3562] to-[#701a3c]">
                        Feed
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-gray-600 mt-2 text-xs sm:text-base md:text-lg">
                  {randomHeading.subtitle}
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
              {posts.map((post, index) => (
                <div key={post._id} className="relative">
                  <PostCard
                    post={post}
                    onPostUpdate={updatePostInFeed} // 🔥 CRITICAL
                  />
                  {/* Add mentor suggestion swiper after the first post */}
                  {index === 0 && <MentorSuggestionSwiper />}
                </div>
              ))}

              {/* Sentinel element for infinite scroll */}
              {hasMore && (
                <div 
                  ref={observerTarget} 
                  className="flex justify-center pt-8 pb-12 min-h-[100px]"
                  style={{ minHeight: '100px' }}
                >
                  {loadingMore && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader2 className="w-7.5 sm:w-10 h-7.5 sm:h-10 animate-spin" />
                    </div>
                  )}
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
