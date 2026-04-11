import { useState, useEffect, useRef } from'react';
import { useNavigate } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { HelpCircle, X } from'lucide-react';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';

const ASK_DOUBT_STORAGE_KEY ='admeasy:askDoubt:state';
const DISMISSED_KEY ='admeasy:askDoubt:dismissed';
const LAST_POST_KEY ='admeasy:askDoubt:lastPost';
const SCROLL_THRESHOLD = 500; // Show after scrolling 500px
const TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutes of scrolling without interaction
const POST_RECENCY_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

const AskDoubtCTA = () => {
 const navigate = useNavigate();
 const { user } = useUser();
 const { mentor } = useMentor();
 const [showCTA, setShowCTA] = useState(false);
 const [isDismissed, setIsDismissed] = useState(false);
 const scrollStartTimeRef = useRef(null);
 const scrollDistanceRef = useRef(0);
 const lastInteractionRef = useRef(Date.now());
 const checkTimeoutRef = useRef(null);

 // Only show for users, not mentors (mentors answer questions, users ask them)
 const isLoggedIn = !!user && !mentor;

 // Check if CTA should be shown
 const shouldShowCTA = () => {
 // Don't show if user is not logged in or is a mentor
 if (!isLoggedIn) return false;

 // Check if dismissed in this session
 const dismissed = sessionStorage.getItem(DISMISSED_KEY);
 if (dismissed ==='true') return false;

 // Check if shown recently (within last hour)
 const lastShown = sessionStorage.getItem(ASK_DOUBT_STORAGE_KEY);
 if (lastShown && Date.now() - parseInt(lastShown) < 60 * 60 * 1000) {
 return false;
 }

 // Check if user posted recently
 const lastPostTime = sessionStorage.getItem(LAST_POST_KEY);
 if (lastPostTime) {
 const timeSinceLastPost = Date.now() - parseInt(lastPostTime);
 // If posted within 24 hours, don't show
 if (timeSinceLastPost < POST_RECENCY_THRESHOLD) {
 return false;
 }
 }

 // Check scroll behavior
 const scrollDistance = scrollDistanceRef.current;
 const scrollTime = scrollStartTimeRef.current
 ? Date.now() - scrollStartTimeRef.current
 : 0;

 // Show if:
 // 1. Scrolled more than threshold AND scrolled for more than time threshold without interaction
 // OR
 // 2. User hasn't posted in 24+ hours AND has scrolled some
 if (scrollDistance > SCROLL_THRESHOLD && scrollTime > TIME_THRESHOLD) {
 return true;
 }

 if (!lastPostTime && scrollDistance > 300) {
 return true;
 }

 return false;
 };

 // Track scroll behavior
 useEffect(() => {
 let scrollTimeout;
 let lastScrollY = window.scrollY;

 const handleScroll = () => {
 const currentScrollY = window.scrollY;
 const scrollDelta = Math.abs(currentScrollY - lastScrollY);

 if (scrollDelta > 10) {
 // User is scrolling
 if (!scrollStartTimeRef.current) {
 scrollStartTimeRef.current = Date.now();
 }
 scrollDistanceRef.current += scrollDelta;
 lastScrollY = currentScrollY;

 // Reset interaction timer on scroll
 lastInteractionRef.current = Date.now();
 }

 // Check if we should show CTA (debounced)
 clearTimeout(scrollTimeout);
 scrollTimeout = setTimeout(() => {
 if (shouldShowCTA() && !isDismissed) {
 setShowCTA(true);
 // Mark as shown
 sessionStorage.setItem(ASK_DOUBT_STORAGE_KEY, Date.now().toString());
 }
 }, 1000); // Check after 1 second of scrolling
 };

 window.addEventListener('scroll', handleScroll, { passive: true });

 return () => {
 window.removeEventListener('scroll', handleScroll);
 clearTimeout(scrollTimeout);
 };
 }, [isDismissed, isLoggedIn]);

 // Track user interactions (clicks, likes, comments)
 useEffect(() => {
 const handleInteraction = () => {
 lastInteractionRef.current = Date.now();
 // Reset scroll tracking on interaction
 scrollStartTimeRef.current = null;
 scrollDistanceRef.current = 0;
 };

 // Listen for clicks on interactive elements
 document.addEventListener('click', handleInteraction, true);
 document.addEventListener('touchstart', handleInteraction, true);

 return () => {
 document.removeEventListener('click', handleInteraction, true);
 document.removeEventListener('touchstart', handleInteraction, true);
 };
 }, []);

 // Check periodically if CTA should be shown
 useEffect(() => {
 const checkInterval = setInterval(() => {
 if (shouldShowCTA() && !isDismissed && !showCTA) {
 setShowCTA(true);
 sessionStorage.setItem(ASK_DOUBT_STORAGE_KEY, Date.now().toString());
 }
 }, 5000); // Check every 5 seconds

 return () => clearInterval(checkInterval);
 }, [isDismissed, showCTA, isLoggedIn]);

 const handleDismiss = (e) => {
 e.preventDefault();
 e.stopPropagation();
 setShowCTA(false);
 setIsDismissed(true);
 sessionStorage.setItem(DISMISSED_KEY,'true');
 };

 const handleClick = (e) => {
 // Don't navigate if clicking the dismiss button
 if (e.target.closest('button[aria-label="Dismiss"]')) {
 return;
 }

 // Mark as shown
 sessionStorage.setItem(ASK_DOUBT_STORAGE_KEY, Date.now().toString());
 setShowCTA(false);
 setIsDismissed(true);
 sessionStorage.setItem(DISMISSED_KEY,'true');

 // Navigate to create post with query param for auto-focus
 navigate('/posts/create?askDoubt=true');
 };

 // Reset dismissal state on page load (but respect session storage)
 useEffect(() => {
 const dismissed = sessionStorage.getItem(DISMISSED_KEY);
 if (dismissed ==='true') {
 setIsDismissed(true);
 }
 }, []);

 if (!isLoggedIn || isDismissed) return null;

 return (
 <AnimatePresence>
 {showCTA && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.9 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.9 }}
 transition={{
 type:'spring',
 stiffness: 300,
 damping: 25,
 duration: 0.4
 }}
 className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 
 sm:bottom-24 md:bottom-28"
 style={{
 maxWidth:'calc(100% - 2rem)',
 width:'auto',
 minWidth:'280px'
 }}
 >
 <div
 onClick={handleClick}
 className="relative bg-gradient-to-r from-[#9f3562] to-[#b14270] 
 text-white rounded-2xl px-4 py-3 shadow-lg 
 hover:shadow-xl hover:shadow-[#9f3562]/50 
 transition-all duration-300 cursor-pointer
 flex items-center gap-3
 border-2 border-white/20
 backdrop-blur-sm"
 style={{
 boxShadow:'0 10px 25px rgba(159, 53, 98, 0.3)',
 }}
 >
 {/* Icon */}
 <div className="flex-shrink-0">
 <motion.div
 animate={{
 rotate: [0, -10, 10, -10, 0],
 scale: [1, 1.1, 1, 1.1, 1]
 }}
 transition={{
 duration: 2,
 repeat: Infinity,
 repeatDelay: 3,
 ease:'easeInOut'
 }}
 >
 <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7"/>
 </motion.div>
 </div>

 {/* Text */}
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
 Ask your Doubts NOW!
 </p>
 <p className="text-xs sm:text-sm opacity-90 mt-0.5">
 Get answers from mentors
 </p>
 </div>

 {/* Dismiss button */}
 <button
 type="button"
 onClick={handleDismiss}
 className="flex-shrink-0 p-1 rounded-full hover:bg-black/20 
 transition-colors duration-200 relative z-10"
 aria-label="Dismiss"
 >
 <X className="w-4 h-4 sm:w-5 sm:h-5"/>
 </button>

 {/* Pulse animation ring */}
 <motion.div
 className="absolute inset-0 rounded-2xl border-2 border-white/30 pointer-events-none"
 animate={{
 scale: [1, 1.05, 1],
 opacity: [0.5, 0.3, 0.5],
 }}
 transition={{
 duration: 2,
 repeat: Infinity,
 ease:'easeInOut',
 }}
 />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};

export default AskDoubtCTA;
