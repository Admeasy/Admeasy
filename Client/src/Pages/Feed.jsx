import { useState, useEffect, useCallback, useRef } from'react';
import { useNavigate, useSearchParams } from'react-router-dom';
import { useInfiniteQuery } from'@tanstack/react-query';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';
import PostCard from'../components/PostCard';
import PostViewTracker from'../components/PostViewTracker';
import MentorSuggestionSwiper from'../components/MentorSuggestionSwiper';
import SpaceSuggestionSwiper from'../components/SpaceSuggestionSwiper';
import NoteSuggestionSwiper from'../components/NoteSuggestionSwiper';
import CollegeSuggestionSwiper from'../components/CollegeSuggestionSwiper';
import NotificationBell from'../components/NotificationBell';
import AskDoubtCTA from'../components/AskDoubtCTA';
import AddExamInfoCTA from'../components/AddExamInfoCTA';
import AdCard from'../components/AdCard';
import { Loader2, X, BookOpen, Smile, GraduationCap, Timer, Gamepad2, Music, PartyPopper, Edit3, Users, Search, Hash } from'lucide-react';
import { toast } from'react-toastify';
import SEO from'../components/SEO';
import { motion, AnimatePresence } from'framer-motion';

// ─── Fetch function ──────────────────────────────────────────────────────────
const fetchFeedPage = async ({ pageParam = 1, queryKey }) => {
 const [, feedType, hashtag] = queryKey;
 const params = new URLSearchParams({
 page: pageParam,
 limit: 20,
 type: feedType,
 });
 if (hashtag) params.set('hashtag', hashtag);
 const res = await fetch(`/api/posts?${params}`, { credentials:'include'});
 if (!res.ok) throw new Error('Failed to fetch posts');
 return res.json();
};

// ─── Random hero messages ────────────────────────────────────────────────────
const STUDY_HERO = [
 { title:"Yeh feed marks badhane wali hai", subtitle:"Your study-first community feed"},
 { title:"Mentors ne bola, sunna padega", subtitle:"Your study-first community feed"},
 { title:"College clarity starts here", subtitle:"Your study-first community feed"},
 { title:"One right suggestion > 100 random videos", subtitle:"Ask seniors. Save time. Reduce stress."},
 { title:"Talk to seniors who've already cracked it.", subtitle:"Real experiences. Honest mistakes."},
];
const MASTI_HERO = [
 { title:"Chill mode: activated 😎", subtitle:"Student life, unfiltered vibes"},
 { title:"Study hard, laugh harder 😂", subtitle:"Your daily dose of campus life"},
 { title:"The feed that understands your struggle 🎉", subtitle:"Masti mode — no pressure, just vibes"},
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

 // Feed type state:'study'|'masti'
 const [feedType, setFeedType] = useState(() => localStorage.getItem('feedType') ||'study');

 // Persistence: Save to local storage on change
 useEffect(() => {
 localStorage.setItem('feedType', feedType);
 }, [feedType]);

 // For ads
 const [ads, setAds] = useState([]);

 // Single source of truth for posts (merged from pages)
 const [allPosts, setAllPosts] = useState([]);

 const observerTargetRef = useRef(null);
 const [searchInput, setSearchInput] = useState('');

 const handleSearch = (e) => {
 e.preventDefault();
 if (searchInput.trim()) {
 const trimmed = searchInput.trim();
 if (trimmed.startsWith('#')) {
 navigate(`/explore?tag=${encodeURIComponent(trimmed.slice(1))}`);
 } else {
 navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
 }
 }
 };

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
 if (!p || !p._id || seen.has(p._id)) return false;
 seen.add(p._id);
 return true;
 });
 setAllPosts(unique);
 }
 }, [data]);

 // ── Fetch ads (one-shot, independent of feed type) ─────────────────────────
 useEffect(() => {
 fetch('/api/ads/feed/random?limit=5', { credentials:'include'})
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
 { root: null, rootMargin:'250px', threshold: 0.1 }
 );
 if (observerTargetRef.current) observer.observe(observerTargetRef.current);
 return () => observer.disconnect();
 }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

 // ── Hero message ───────────────────────────────────────────────────────────
 const [hero, setHero] = useState({ title:'', subtitle:''});
 useEffect(() => {
 const pool = feedType ==='masti'? MASTI_HERO : STUDY_HERO;
 setHero(pool[Math.floor(Math.random() * pool.length)]);
 }, [feedType, user, mentor]);

 const [isTransitioning, setIsTransitioning] = useState(false);

 // ── Feed type toggle handler ───────────────────────────────────────────────
 const handleFeedTypeChange = (type) => {
 if (type === feedType) return;
 setFeedType(type);
 setAllPosts([]); // clear immediately so there's no stale flash
 window.scrollTo(0, 0);
 setIsTransitioning(true);
 setTimeout(() => setIsTransitioning(false), 1200);
 };

 const isMasti = feedType ==='masti';

 // ── Loading skeleton ───────────────────────────────────────────────────────
 if (isLoading && allPosts.length === 0) {
 return (
 <div className={`min-h-screen flex items-center justify-center ${isMasti ?'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100/60':'bg-gradient-to-br from-gray-50 via-white to-pink-50/30'}`}>
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="w-10 h-10 animate-spin text-[#9f3562]"/>
 <p className="text-gray-600 font-medium text-sm">Loading {isMasti ?'Masti':'Study'} feed...</p>
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
 ?'bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-pink-100/40'
 :'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'}`}
 >
 <SEO
 title={tagFilter ?`#${tagFilter} - Admeasy Feed`:`${isMasti ?'Masti':'Study'} Feed — Admeasy`}
 description="Discover knowledge shared by mentors and students"
 url="https://admeasy.in"
 />

 {/* Dynamic Ambient Background Elements */}
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <AnimatePresence mode="wait">
 {isMasti ? (
 <motion.div key="masti-bg"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
 <motion.div
 animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
 transition={{ duration: 10, repeat: Infinity, ease:'easeInOut'}}
 className="absolute -top-40 -left-40 w-96 h-96 bg-pink-400/20 rounded-full blur-[100px]"
 />
 <motion.div
 animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
 transition={{ duration: 12, repeat: Infinity, ease:'easeInOut'}}
 className="absolute top-1/3 -right-20 w-80 h-80 bg-rose-400/15 rounded-full blur-[100px]"
 />
 <motion.div
 animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
 transition={{ duration: 15, repeat: Infinity, ease:'easeInOut'}}
 className="absolute -bottom-20 left-1/3 w-96 h-96 bg-yellow-400/15 rounded-full blur-[100px]"
 />
 {/* Subtle Grid overlay for Masti */}
 <div
 className="absolute inset-0 opacity-[0.1]"
 style={{ backgroundImage:'linear-gradient(#f43f5e 1px, transparent 1px), linear-gradient(90deg, #f43f5e 1px, transparent 1px)', backgroundSize:'40px 40px'}}
 />
 </motion.div>
 ) : (
 <motion.div key="study-bg"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
 <motion.div
 animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
 transition={{ duration: 15, repeat: Infinity, ease:'easeInOut'}}
 className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px]"
 />
 <motion.div
 animate={{ x: [0, -10, 0], y: [0, 20, 0] }}
 transition={{ duration: 18, repeat: Infinity, ease:'easeInOut'}}
 className="absolute top-1/2 -left-20 w-80 h-80 bg-[#9f3562]/5 rounded-full blur-[100px]"
 />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Immersive Feed Transition Overlay */}
 <AnimatePresence>
 {isTransitioning && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.5 }}
 className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden ${isMasti ?'bg-[#0f172a]':'bg-white'
 }`}
 >
 {/* Immersive Background Particles */}
 <div className="absolute inset-0 pointer-events-none">
 {[...Array(15)].map((_, i) => (
 <motion.div
 key={i}
 initial={{
 x: Math.random() * window.innerWidth,
 y: window.innerHeight + 100,
 rotate: 0,
 opacity: 0
 }}
 animate={{
 y: -100,
 rotate: 360,
 opacity: [0, 1, 1, 0]
 }}
 transition={{
 duration: 2 + Math.random() * 2,
 repeat: Infinity,
 delay: Math.random() * 1,
 ease:"linear"
 }}
 className="absolute"
 >
 {isMasti ? (
 <div className="text-2xl opacity-40">
 {['🎉','🎈','🍕','🎸','⚽'][i % 5]}
 </div>
 ) : (
 <div className="text-2xl opacity-20">
 {['📚','🎓','✏️','💡','🔍'][i % 5]}
 </div>
 )}
 </motion.div>
 ))}
 </div>

 <div className="relative z-10 flex flex-col items-center">
 {/* Main Animated Icon */}
 <motion.div
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{
 type:"spring",
 stiffness: 260,
 damping: 20,
 delay: 0.1
 }}
 className={`w-32 h-32 rounded-3xl flex items-center justify-center mb-8 shadow-2xl ${isMasti
 ?'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/40'
 :'bg-gradient-to-br from-[#9f3562] to-[#b14270] shadow-[#9f3562]/40'
 }`}
 >
 {isMasti ? (
 <Smile className="w-16 h-16 text-white"/>
 ) : (
 <BookOpen className="w-16 h-16 text-white"/>
 )}
 </motion.div>

 {/* Title with staggered characters */}
 <motion.div className="flex flex-col items-center text-center px-6">
 <motion.h2
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className={`text-3xl sm:text-4xl font-black mb-3 tracking-tighter ${isMasti ?'text-white':'text-gray-900'
 }`}
 >
 {isMasti ?'Entering Masti Zone':'Study Mode Active'}
 </motion.h2>

 <motion.div
 initial={{ width: 0 }}
 animate={{ width:"100%"}}
 transition={{ duration: 0.8, delay: 0.5 }}
 className={`h-1 rounded-full mb-4 ${isMasti ?'bg-rose-500':'bg-[#9f3562]'
 }`}
 />

 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.6 }}
 className={`text-sm sm:text-base font-medium uppercase tracking-[0.2em] ${isMasti ?'text-rose-400':'text-[#9f3562]'
 }`}
 >
 {isMasti ?'student life unfiltered':'preparing for excellence'}
 </motion.p>
 </motion.div>

 {/* Bottom Subtle Indicator */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: [0, 1, 0] }}
 transition={{ duration: 1.5, repeat: Infinity }}
 className="mt-12"
 >
 <div className={`flex gap-2`}>
 {[...Array(3)].map((_, i) => (
 <div
 key={i}
 className={`w-2 h-2 rounded-full ${isMasti ?'bg-rose-500':'bg-[#9f3562]'}`}
 style={{ animationDelay:`${i * 0.2}s`}}
 />
 ))}
 </div>
 </motion.div>
 </div>

 {/* Immersive Blur Circle */}
 <motion.div
 animate={{
 scale: [1, 1.2, 1],
 opacity: [0.3, 0.5, 0.3]
 }}
 transition={{ duration: 4, repeat: Infinity }}
 className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] -z-10 ${isMasti ?'bg-rose-900/40':'bg-[#9f3562]/10'
 }`}
 />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Floating Contextual Button */}
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8"
 >
 {isMasti ? (
 <button
 onClick={() => navigate('/posts/create')}
 className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform font-bold text-sm"
 >
 <Edit3 className="w-5 h-5"/>
 <span className="hidden sm:inline">Post an Update</span>
 <span className="sm:hidden">Post</span>
 </button>
 ) : (
 <button
 onClick={() => navigate('/mentors')}
 className="flex items-center gap-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white px-5 py-3 rounded-full shadow-lg shadow-[#9f3562]/30 hover:scale-105 transition-transform font-bold text-sm"
 >
 <Users className="w-5 h-5"/>
 <span className="hidden sm:inline">Find a Mentor</span>
 <span className="sm:hidden">Mentors</span>
 </button>
 )}
 </motion.div>

 <AskDoubtCTA />
 <AddExamInfoCTA />

 <div className="flex justify-center relative z-10">
 <div className="w-full max-w-3xl px-3 sm:px-4 py-2 sm:py-6">

 {/* ── Header ─────────────────────────────────────────── */}
 <div className="mb-6 sm:mb-8 mt-2">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex-1">
 <motion.h1
 key={hero.title +'title'}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight bg-clip-text text-transparent 
 ${isMasti ?'bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400':'bg-gradient-to-br from-gray-900 via-[#9f3562] to-gray-800'}
 leading-tight tracking-tight whitespace-normal md:whitespace-nowrap`}
 >
 {hero.title}
 </motion.h1>
 <motion.p
 key={hero.subtitle +'sub'}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.1 }}
 className="font-medium text-gray-500 mt-1.5 text-xs sm:text-sm md:text-base line-clamp-1"
 >
 {hero.subtitle}
 </motion.p>
 </div>

 </div>
 </div>

 {/* ── Dual-Channel Toggle (Now Smaller) ──────────────── */}
 <div className="mb-6 sm:mb-8 flex justify-center">
 <div className="flex items-center gap-4 p-1.5 px-5 rounded-[2rem] bg-white/60 backdrop-blur-xl shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06),0_8px_16px_-2px_rgba(0,0,0,0.03)] border border-white/80 hover:shadow-lg transition-all duration-300 transform">
 <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${!isMasti ?'text-[#9f3562]':'text-gray-400 opacity-60'}`}>
 Study
 </span>

 <button
 onClick={() => handleFeedTypeChange(isMasti ?'study':'masti')}
 className={`relative w-12 h-6 rounded-full transition-colors duration-500 ease-in-out focus:outline-none ${isMasti ?'bg-gradient-to-r from-rose-400 to-orange-400 shadow-inner':'bg-[#9f3562] shadow-inner'
 }`}
 >
 <motion.div
 animate={{ x: isMasti ? 26 : 2 }}
 transition={{ type:"spring", stiffness: 500, damping: 30 }}
 className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden"
 >
 {isMasti ? <Smile className="w-3 h-3 text-rose-500"/> : <BookOpen className="w-3 h-3 text-[#9f3562]"/>}
 </motion.div>
 </button>

 <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isMasti ?'text-rose-600 opacity-100 scale-105':'text-gray-400 opacity-60'}`}>
 Masti
 </span>
 </div>
 </div>

 {/* ── Search Bar Section (Compacted) ──────────────────────────── */}
 <div className="hidden sm:block mb-6 max-w-lg mx-auto px-2">
 <form onSubmit={handleSearch} className="relative group">
 <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
 {searchInput.startsWith('#') ? (
 <Hash className="w-4 h-4 text-[#9f3562]"/>
 ) : (
 <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#9f3562] transition-colors"/>
 )}
 </div>
 <input
 type="text"
 value={searchInput}
 onChange={(e) => setSearchInput(e.target.value)}
 placeholder="Search mentors, posts, notes..."
 className={`w-full pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#9f3562]/5 focus:border-[#9f3562]/30 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-gray-400 text-gray-900 ${searchInput.startsWith('#') ?'text-[#9f3562] font-semibold':''
 }`}
 />
 {searchInput && (
 <button
 type="button"
 onClick={() => setSearchInput("")}
 className="absolute inset-y-0 right-2 flex items-center pr-1.5 text-gray-400 hover:text-[#9f3562] transition-colors"
 >
 <X className="w-3.5 h-3.5"/>
 </button>
 )}
 </form>
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
 {tagFilter ?`No posts for #${tagFilter}`:`No ${isMasti ?'Masti':'Study'} posts yet`}
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
 <Loader2 className="w-8 h-8 animate-spin text-[#9f3562]"/>
 )}
 </div>
 )}

 {/* End of feed */}
 {!hasNextPage && allPosts.length > 0 && (
 <div className="flex justify-center py-6">
 <p className="text-gray-400 text-xs">
 {isMasti ?"That's all the masti for now 🎉":"You're all caught up! Come back for more 📚"}
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
