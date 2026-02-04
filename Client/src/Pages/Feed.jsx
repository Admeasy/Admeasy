import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import PostCard from '../components/PostCard';
import PostViewTracker from '../components/PostViewTracker';
import MentorSuggestionSwiper from '../components/MentorSuggestionSwiper';
import SpaceSuggestionSwiper from '../components/SpaceSuggestionSwiper';
import NotificationBell from '../components/NotificationBell';
import AskDoubtCTA from '../components/AskDoubtCTA';
import AddExamInfoCTA from '../components/AddExamInfoCTA';
import AdCard from '../components/AdCard';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';

const FEED_STORAGE_KEY = 'admeasy:feed:state';

const Feed = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [ads, setAds] = useState([]);
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
  const observerTargetRef = useRef(null);
  const feedContainerRef = useRef(null);
  const shouldRestoreScrollRef = useRef(false);

  //🔥 SINGLE SOURCE OF TRUTH

  const updatePostInFeed = useCallback((updatedPost) => {
    // If post is deleted, remove it from the feed
    if (updatedPost.deleted) {
      setPosts((prev) => prev.filter((p) => p._id !== updatedPost._id));
      return;
    }
    // Otherwise, update the post
    setPosts((prev) =>
      prev.map((p) =>
        p._id === updatedPost._id ? { ...p, ...updatedPost } : p
      )
    );
  }, []);

  const updateAdInFeed = useCallback((updatedAd) => {
    // Update the ad in the ads array
    setAds((prev) =>
      prev.map((a) =>
        a._id === updatedAd._id ? { ...a, ...updatedAd } : a
      )
    );
  }, []);

  // Save feed state to sessionStorage
  const saveFeedState = useCallback((currentPage, currentPosts, scrollPosition) => {
    try {
      const state = {
        page: currentPage,
        posts: currentPosts.map(p => ({ _id: p._id })), // Store only IDs to save space
        scrollPosition,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save feed state:', err);
    }
  }, []);

  // Load feed state from sessionStorage
  const loadFeedState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(FEED_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Only restore if state is less than 30 minutes old
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          return state;
        }
      }
    } catch (err) {
      console.error('Failed to load feed state:', err);
    }
    return null;
  }, []);

  // Fetch Posts
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);

      const response = await fetch(
        `/api/posts?page=${pageNum}&limit=20`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      setPosts((prev) => {
        const newPosts = append ? [...prev, ...data.posts] : data.posts;
        // Save state after updating posts
        setTimeout(() => {
          saveFeedState(pageNum, newPosts, window.scrollY);
        }, 100);
        return newPosts;
      });

      setHasMore(
        data.posts.length === 20 &&
        pageNum < data.pagination.pages
      );
      setPage(pageNum);

      // Fetch ads on first page load
      if (pageNum === 1) {
        fetchAds();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      isFetchingRef.current = false;
    }
  }, [saveFeedState]);

  // Fetch ads
  const fetchAds = useCallback(async () => {
    try {
      const response = await fetch('/api/ads/feed/random?limit=5', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ads) {
          setAds(data.ads);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  }, []);

  // Load more posts (for infinite scroll)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isFetchingRef.current) return;
    const nextPage = page + 1;
    fetchPosts(nextPage, true);
  }, [page, loadingMore, hasMore, fetchPosts]);

  // Restore scroll position and load saved state
  useEffect(() => {
    // Check if we're returning from a post detail page
    const isReturningFromPost = document.referrer.includes('/posts/') || 
                                 sessionStorage.getItem('admeasy:fromPostDetail') === 'true';
    
    if (isReturningFromPost) {
      sessionStorage.removeItem('admeasy:fromPostDetail');
    }
    
    const savedState = loadFeedState();
    
    // Always restore if we have saved state and are returning from post detail
    // OR if saved state is recent (within 10 minutes)
    const shouldRestore = savedState && (
      isReturningFromPost || 
      (Date.now() - savedState.timestamp < 10 * 60 * 1000)
    );
    
    if (shouldRestore && savedState.scrollPosition > 0) {
      // We have saved state, restore it
      shouldRestoreScrollRef.current = true;
      setPage(savedState.page);
      
      // Load all pages up to saved page
      const loadAllPages = async () => {
        setLoading(true);
        try {
          const allPosts = [];
          for (let p = 1; p <= savedState.page; p++) {
            const response = await fetch(
              `/api/posts?page=${p}&limit=20`,
              { credentials: 'include' }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                allPosts.push(...data.posts);
              }
            }
          }
          setPosts(allPosts);
          
          // Restore scroll position after posts are fully rendered
          // Use multiple attempts to ensure DOM is ready
          let attempts = 0;
          const maxAttempts = 10;
          
          const restoreScroll = () => {
            attempts++;
            const scrollTarget = savedState.scrollPosition || 0;
            
            // Check if we can scroll to the target position
            if (scrollTarget > 0 && document.body.scrollHeight >= scrollTarget) {
              window.scrollTo({
                top: scrollTarget,
                behavior: 'auto' // Instant scroll, not smooth
              });
              shouldRestoreScrollRef.current = false;
            } else if (attempts < maxAttempts) {
              // Wait a bit more and try again
              setTimeout(restoreScroll, 100);
            } else {
              // Max attempts reached, scroll to best available position
              window.scrollTo({
                top: Math.min(scrollTarget, document.body.scrollHeight),
                behavior: 'auto'
              });
              shouldRestoreScrollRef.current = false;
            }
          };
          
          // Start restoration after initial render
          setTimeout(restoreScroll, 100);
        } catch (err) {
          console.error('Failed to restore feed state:', err);
          // Fallback to normal load
          fetchPosts(1, false);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllPages();
    } else {
      // No saved state or not returning from post, normal load
      // Clear old state if it exists and is too old
      if (savedState && Date.now() - savedState.timestamp > 10 * 60 * 1000) {
        sessionStorage.removeItem(FEED_STORAGE_KEY);
      }
      fetchPosts(1, false);
      fetchAds(); // Fetch ads on initial load
    }
  }, []); // Only run on mount

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the bottom
        threshold: 0.1,
      }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  // Save scroll position on scroll (throttled)
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (shouldRestoreScrollRef.current) return; // Don't save during restoration
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Save immediately with current scroll position
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        saveFeedState(page, posts, currentScroll);
      }, 300); // Throttle: save every 300ms (faster for better UX)
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [page, posts, saveFeedState]);

  // Save state when navigating away (location change)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      saveFeedState(page, posts, currentScroll);
    };

    // Save before navigation - use location change detection
    const handleLocationChange = () => {
      // Small delay to ensure scroll position is captured
      setTimeout(() => {
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        saveFeedState(page, posts, currentScroll);
      }, 50);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Save state when location changes (user navigates to post detail)
    // Also save on visibility change (tab switch)
    document.addEventListener('visibilitychange', handleLocationChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleLocationChange);
      // Final save on unmount
      const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      saveFeedState(page, posts, currentScroll);
    };
  }, [page, posts, saveFeedState, location.pathname]);
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

      {/* Ask Doubt CTA */}
      <AskDoubtCTA />

      {/* Add Exam Info CTA */}
      <AddExamInfoCTA />

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
                  className="w-fit h-fit px-1.5 py-1 font-semibold bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg cursor-pointer hover:shadow-lg hover:shadow-[#9f3562]/50 transition-all duration-1500"
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
            <div ref={feedContainerRef} className="space-y-8">
              {posts.map((post, index) => {
                const shouldShowAd = ads.length > 0 && index > 0 && index % 5 === 0;
                const adIndex = Math.floor(index / 5) % ads.length;
                const ad = shouldShowAd ? ads[adIndex] : null;

                return (
                  <div key={post._id} className="relative">
                    <PostViewTracker postId={post._id}>
                      <PostCard
                        post={post}
                        onPostUpdate={updatePostInFeed} // 🔥 CRITICAL
                      />
                    </PostViewTracker>
                    {/* Add mentor suggestion swiper after the first post */}
                    {index === 0 && <MentorSuggestionSwiper />}
                    {/* Add space suggestion swiper after the 3rd post */}
                    {index === 2 && <SpaceSuggestionSwiper />}
                    {/* Insert ad after every 5 posts */}
                    {ad && (
                      <div className="mt-8">
                        <AdCard ad={ad} onAdUpdate={updateAdInFeed} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div 
                  ref={observerTargetRef}
                  className="flex justify-center pt-8 pb-12 min-h-[100px]"
                >
                  {loadingMore && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader2 className="w-7.5 sm:w-10 h-7.5 sm:h-10 animate-spin text-[#9f3562]" />
                    </div>
                  )}
                </div>
              )}

              {/* End of feed message */}
              {!hasMore && posts.length > 0 && (
                <div className="flex justify-center pt-8 pb-12">
                  <p className="text-gray-500 text-sm">
                    {'No more posts for now. Come back for more :)'}
                  </p>
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
