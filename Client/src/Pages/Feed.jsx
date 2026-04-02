import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import PostCard from '../components/PostCard';
import PostViewTracker from '../components/PostViewTracker';
import MentorSuggestionSwiper from '../components/MentorSuggestionSwiper';
import SpaceSuggestionSwiper from '../components/SpaceSuggestionSwiper';
import NoteSuggestionSwiper from '../components/NoteSuggestionSwiper';
import CollegeSuggestionSwiper from '../components/CollegeSuggestionSwiper';
import NotificationBell from '../components/NotificationBell';
import AskDoubtCTA from '../components/AskDoubtCTA';
import AddExamInfoCTA from '../components/AddExamInfoCTA';
import AdCard from '../components/AdCard';
import { Loader2, X, BookOpen, Smile } from 'lucide-react';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Fetch function ──────────────────────────────────────────────────────────
const fetchFeedPage = async ({ pageParam = 1, queryKey }) => {
  const [, feedType, hashtag] = queryKey;
  const params = new URLSearchParams({
    page: pageParam,
    limit: 20,
    type: feedType,
  });
  if (hashtag) params.set('hashtag', hashtag);
  const res = await fetch(`/api/posts?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
};

// ─── Random hero messages ────────────────────────────────────────────────────
const STUDY_HERO = [
  { title: "Yeh feed marks badhane wali hai", subtitle: "Your study-first community feed" },
  { title: "Mentors ne bola, sunna padega", subtitle: "Your study-first community feed" },
  { title: "College clarity starts here", subtitle: "Your study-first community feed" },
  { title: "One right suggestion > 100 random videos", subtitle: "Ask seniors. Save time. Reduce stress." },
  { title: "Talk to seniors who've already cracked it.", subtitle: "Real experiences. Honest mistakes." },
];
const MASTI_HERO = [
  { title: "Chill mode: activated 😎", subtitle: "Student life, unfiltered vibes" },
  { title: "Study hard, laugh harder 😂", subtitle: "Your daily dose of campus life" },
  { title: "The feed that understands your struggle 🎉", subtitle: "Masti mode — no pressure, just vibes" },
];

const CollegeSuggestionSwiperSafe = () => {
  try {
    return <CollegeSuggestionSwiper />;
  } catch {
    return null;
  }
};

// ─── Main Feed Component ─────────────────────────────────────────────────────
const Feed = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag');

  // Feed type state: 'study' | 'masti'
  const [feedType, setFeedType] = useState(() => localStorage.getItem('feedType') || 'study');

  // Persistence: Save to local storage on change
  useEffect(() => {
    localStorage.setItem('feedType', feedType);
  }, [feedType]);

  // For ads
  const [ads, setAds] = useState([]);

  // Single source of truth for posts (merged from pages)
  const [allPosts, setAllPosts] = useState([]);

  const observerTargetRef = useRef(null);

  // ── React Query: infinite feed ─────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', feedType, tagFilter],
    queryFn: fetchFeedPage,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination || {};
      if (page < pages) return page + 1;
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages into a single posts array
  useEffect(() => {
    if (data) {
      const merged = data.pages.flatMap(p => p.posts || []);
      // Deduplicate by _id
      const seen = new Set();
      const unique = merged.filter(p => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      setAllPosts(unique);
    }
  }, [data]);

  // ── Fetch ads (one-shot, independent of feed type) ─────────────────────────
  useEffect(() => {
    fetch('/api/ads/feed/random?limit=5', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success && d.ads) setAds(d.ads); })
      .catch(() => { });
  }, []);

  // ── Optimistic post update ─────────────────────────────────────────────────
  const updatePostInFeed = useCallback((updatedPost) => {
    setAllPosts(prev => {
      if (updatedPost.deleted) return prev.filter(p => p._id !== updatedPost._id);
      return prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p);
    });
  }, []);

  const updateAdInFeed = useCallback((updatedAd) => {
    setAds(prev => prev.map(a => a._id === updatedAd._id ? { ...a, ...updatedAd } : a));
  }, []);

  // ── Infinite scroll observer ───────────────────────────────────────────────
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { root: null, rootMargin: '250px', threshold: 0.1 }
    );
    if (observerTargetRef.current) observer.observe(observerTargetRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Hero message ───────────────────────────────────────────────────────────
  const [hero, setHero] = useState({ title: '', subtitle: '' });
  useEffect(() => {
    const pool = feedType === 'masti' ? MASTI_HERO : STUDY_HERO;
    setHero(pool[Math.floor(Math.random() * pool.length)]);
  }, [feedType, user, mentor]);

  // ── Feed type toggle handler ───────────────────────────────────────────────
  const handleFeedTypeChange = (type) => {
    if (type === feedType) return;
    setFeedType(type);
    setAllPosts([]); // clear immediately so there's no stale flash
    window.scrollTo(0, 0);
  };

  const isMasti = feedType === 'masti';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading && allPosts.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isMasti ? 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100/60' : 'bg-gradient-to-br from-gray-50 via-white to-pink-50/30'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#9f3562]" />
          <p className="text-gray-600 font-medium text-sm">Loading {isMasti ? 'Masti' : 'Study'} feed...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <p className="text-gray-800 font-semibold">Failed to load feed</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-[#9f3562] text-white rounded-xl text-sm font-medium hover:bg-[#b14270] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${isMasti
      ? 'bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-pink-100/40'
      : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'}`}
    >
      <SEO
        title={tagFilter ? `#${tagFilter} - Admeasy Feed` : `${isMasti ? 'Masti' : 'Study'} Feed — Admeasy`}
        description="Discover knowledge shared by mentors and students"
        url="https://admeasy.in"
      />

      {/* Background Grids Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={feedType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 pointer-events-none z-0"
        >
          {isMasti && (
            // Yellowish square grid for Masti
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{ backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AskDoubtCTA />
      <AddExamInfoCTA />

      <div className="flex justify-center relative z-10">
        <div className="w-full max-w-2xl px-3 sm:px-4 py-4 sm:py-8">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {hero.title}
                </h1>
                <p className="text-gray-500 mt-1 text-xs sm:text-sm">{hero.subtitle}</p>
              </div>
              {!user && !mentor && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-fit px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg cursor-pointer hover:shadow-lg hover:shadow-[#9f3562]/40 transition-all"
                >
                  Log in
                </button>
              )}
            </div>
          </div>

          {/* ── Dual-Channel Toggle (Custom Animated Switch) ──────────────── */}
          <div className="mb-8 flex justify-center items-center gap-4">
            <span className={`text-sm font-bold transition-opacity duration-300 ${!isMasti ? 'text-[#9f3562] opacity-100' : 'text-gray-400 opacity-60'}`}>
              Study
            </span>

            <button
              onClick={() => handleFeedTypeChange(isMasti ? 'study' : 'masti')}
              className={`relative w-14 h-7 rounded-full transition-colors duration-500 ease-in-out focus:outline-none ${isMasti ? 'bg-rose-300 shadow-inner' : 'bg-[#9f3562] shadow-md'
                }`}
            >
              <motion.div
                animate={{ x: isMasti ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden"
              >
                {isMasti ? <Smile className="w-3 h-3 text-rose-500" /> : <BookOpen className="w-3 h-3 text-[#9f3562]" />}
              </motion.div>
            </button>

            <span className={`text-sm font-bold transition-opacity duration-300 ${isMasti ? 'text-rose-500 opacity-100' : 'text-gray-400 opacity-60'}`}>
              Masti
            </span>
          </div>

          {/* ── Hashtag Filter Banner ──────────────────────────── */}
          {tagFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-between bg-gradient-to-r from-pink-50 to-white p-3 rounded-2xl border border-pink-100 shadow-sm gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="bg-[#9f3562] text-white p-1.5 rounded-lg">
                  <span className="font-bold text-sm">#</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Filtering by</p>
                  <p className="text-sm font-bold text-gray-900">#{tagFilter}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-red-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-red-200 transition-all cursor-pointer"
              >
                <X size={14} /> Clear
              </button>
            </motion.div>
          )}

          {/* ── Feed Content ──────────────────────────────────── */}
          {allPosts.length === 0 && !isLoading ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
              <p className="text-base font-semibold text-gray-800">
                {tagFilter ? `No posts for #${tagFilter}` : `No ${isMasti ? 'Masti' : 'Study'} posts yet`}
              </p>
              <p className="text-gray-400 mt-1 text-sm">Check back later!</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {allPosts.map((post, index) => {
                const shouldShowAd = ads.length > 0 && index > 0 && index % 6 === 0;
                const adIndex = Math.floor(index / 6) % ads.length;
                const ad = shouldShowAd ? ads[adIndex] : null;

                return (
                  <div key={post._id} className="relative">
                    {/* Mentor Swiper — lead the feed, compact (Study only, index 0) */}
                    {index === 0 && !tagFilter && !isMasti && (
                      <div className="mb-2">
                        <MentorSuggestionSwiper compact />
                      </div>
                    )}

                    <PostViewTracker postId={post._id}>
                      <PostCard
                        post={post}
                        onPostUpdate={updatePostInFeed}
                        isMastiMode={isMasti}
                      />
                    </PostViewTracker>

                    {/* Notes Swiper after index 1 (Study only) */}
                    {index === 1 && !tagFilter && !isMasti && (
                      <div className="mt-2">
                        <NoteSuggestionSwiper compact />
                      </div>
                    )}

                    {/* Space Swiper after index 3 (Study only) */}
                    {index === 3 && !tagFilter && !isMasti && (
                      <div className="mt-2">
                        <SpaceSuggestionSwiper />
                      </div>
                    )}

                    {/* College Swiper after index 5 (Study only) */}
                    {index === 5 && !tagFilter && !isMasti && (
                      <div className="mt-2">
                        <CollegeSuggestionSwiperSafe />
                      </div>
                    )}

                    {/* Ads every 6th post */}
                    {ad && !tagFilter && (
                      <div className="mt-2">
                        <AdCard ad={ad} onAdUpdate={updateAdInFeed} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={observerTargetRef} className="flex justify-center py-6 min-h-[80px]">
                  {isFetchingNextPage && (
                    <Loader2 className="w-8 h-8 animate-spin text-[#9f3562]" />
                  )}
                </div>
              )}

              {/* End of feed */}
              {!hasNextPage && allPosts.length > 0 && (
                <div className="flex justify-center py-6">
                  <p className="text-gray-400 text-xs">
                    {isMasti ? "That's all the masti for now 🎉" : "You're all caught up! Come back for more 📚"}
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
