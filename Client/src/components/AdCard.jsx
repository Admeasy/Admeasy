import { useState, useEffect, useRef } from'react';
import { useNavigate, useLocation } from'react-router-dom';
import { Heart, ExternalLink, Eye, MousePointerClick, Edit, Trash2, MoreVertical } from'lucide-react';
import { motion, AnimatePresence } from'framer-motion';
import { toast } from'react-toastify';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';
import { processMentions } from'../utils/processMentions';

const AdCard = ({ ad, isPreview = false, onAdUpdate, showEditDelete = false, onDelete }) => {
 const navigate = useNavigate();
 const location = useLocation();
 const { user } = useUser();
 const { mentor } = useMentor();
 const isAuthed = Boolean(user || mentor);
 const viewedRef = useRef(false);
 const [currentAdvertiserId, setCurrentAdvertiserId] = useState(null);

 // Initialize adState with proper isLiked boolean
 const [adState, setAdState] = useState({
 ...ad,
 isLiked: ad.isLiked === false // Ensure it's always a boolean
 });
 const [showLikeAnimation, setShowLikeAnimation] = useState(false);
 const [showMenu, setShowMenu] = useState(false);
 const isInteracting = useRef({ like: false });
 const menuRef = useRef(null);

 useEffect(() => {
 // Sync adState with ad prop, ensuring isLiked is always a boolean
 // Only sync if we're not in the middle of a like interaction
 if (!isInteracting.current.like) {
 setAdState(prev => {
 // Only update if the ad data actually changed (by ID or isLiked status)
 if (prev._id !== ad._id || prev.isLiked !== (ad.isLiked === true)) {
 return {
 ...ad,
 isLiked: ad.isLiked === true // Ensure it's always a boolean
 };
 }
 return prev; // No change needed
 });
 }
 }, [ad]);

 // Close menu when clicking outside
 useEffect(() => {
 const handleClickOutside = (event) => {
 if (menuRef.current && !menuRef.current.contains(event.target)) {
 setShowMenu(false);
 }
 };

 if (showMenu) {
 document.addEventListener('mousedown', handleClickOutside);
 }

 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }, [showMenu]);

 // Check if current user is an advertiser viewing their own ad
 useEffect(() => {
 const isAdvertiserRoute = location.pathname.startsWith('/advertiser');
 
 if (isAdvertiserRoute && !isPreview) {
 // Fetch current advertiser info
 fetch('/api/advertisers/me', {
 credentials:'include'
 })
 .then(res => {
 if (res.ok) {
 return res.json();
 }
 return null;
 })
 .then(data => {
 if (data && data.success && data.advertiser) {
 setCurrentAdvertiserId(data.advertiser._id);
 }
 })
 .catch(console.error);
 }
 }, [location.pathname, isPreview]);

 // Track view when ad comes into viewport (only once)
 useEffect(() => {
 if (isPreview || !ad._id) return;

 // Don't track view if advertiser is viewing their own ad
 const adAdvertiserId = ad.advertiserId?._id || ad.advertiserId || (typeof ad.advertiserId ==='string'? ad.advertiserId : null);
 if (currentAdvertiserId && adAdvertiserId && currentAdvertiserId === adAdvertiserId) {
 return; // Skip tracking for own ads
 }

 const observer = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting && !viewedRef.current) {
 viewedRef.current = true;
 // Track view
 fetch(`/api/ads/${ad._id}/view`, {
 method:'POST',
 credentials:'include'
 }).catch(console.error);
 }
 });
 },
 { threshold: 0.5 }
 );

 const cardElement = document.getElementById(`ad-${ad._id}`);
 if (cardElement) {
 observer.observe(cardElement);
 }

 return () => {
 if (cardElement) {
 observer.unobserve(cardElement);
 }
 };
 }, [ad._id, isPreview, currentAdvertiserId, ad.advertiserId]);

 const handleLike = async (e) => {
 e.stopPropagation();
 if (!isAuthed) {
 toast.info('Log in to like ads');
 return;
 }

 if (isInteracting.current.like || isPreview) return;
 isInteracting.current.like = true;

 const previousState = { ...adState };
 const wasLiked = adState.isLiked;
 const optimisticAd = {
 ...adState,
 isLiked: !wasLiked,
 likesCount: wasLiked ? (adState.likesCount - 1) : (adState.likesCount + 1)
 };

 setAdState(optimisticAd);
 if (onAdUpdate) onAdUpdate(optimisticAd);

 if (!wasLiked) {
 setShowLikeAnimation(true);
 setTimeout(() => setShowLikeAnimation(false), 800);
 }

 try {
 const res = await fetch(`/api/ads/${ad._id}/like`, {
 method:'POST',
 credentials:'include'
 });
 const data = await res.json();

 if (data.success) {
 const syncedAd = {
 ...optimisticAd,
 isLiked: data.isLiked,
 likesCount: data.likesCount
 };
 setAdState(syncedAd);
 if (onAdUpdate) onAdUpdate(syncedAd);
 } else {
 throw new Error();
 }
 } catch (error) {
 setAdState(previousState);
 if (onAdUpdate) onAdUpdate(previousState);
 toast.error('Failed to like ad');
 } finally {
 isInteracting.current.like = false;
 }
 };

 const handleAdClick = async (e) => {
 if (isPreview) return;
 
 // Don't trigger if clicking on advertiser info or like button
 if (e.target.closest('.advertiser-info') || e.target.closest('button') || e.target.closest('.ad-actions')) {
 return;
 }
 
 e.stopPropagation();
 
 // Get the URL from adState first, then fallback to ad
 const targetUrl = adState.externalLink?.url || ad.externalLink?.url;

 if (!targetUrl) return;
 
 try {
 const res = await fetch(`/api/ads/${ad._id}/click`, {
 method:'POST',
 credentials:'include'
 });
 const data = await res.json();
 // Use the URL from response if available, otherwise use the ad's URL
 const urlToOpen = data.url || targetUrl;
 if (data.success || urlToOpen) {
 console.log('urlToOpen', urlToOpen);
 window.open(urlToOpen,'_blank','noopener,noreferrer');
 }
 } catch (error) {
 console.error('Click tracking error:', error);
 // Still open the link even if tracking fails
 window.open(targetUrl,'_blank','noopener,noreferrer');
 }
 };

 const handleAdvertiserClick = (e) => {
 e.stopPropagation();
 if (advertiser.username) {
 navigate(`/${advertiser.username}`);
 }
 };

 const fallbackProfilePic ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
 const advertiser = ad.advertiser || (ad.advertiserId && typeof ad.advertiserId ==='object'? ad.advertiserId : null) || { name:'Advertiser', username:'advertiser', image: null };

 return (
 <motion.div
 id={ad._id ?`ad-${ad._id}`: undefined}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, ease:"easeOut"}}
 onClick={handleAdClick}
 className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-md hover:shadow-gray-200/30 transition-all duration-500 cursor-pointer border border-gray-100 hover:border-[#9f3562]/10 group relative">
 <style>{`
 .ad-content h1, .ad-content h2, .ad-content h3 {
 font-weight: 700;
 margin-top: 0.5rem;
 margin-bottom: 0.5rem;
 }
 .ad-content p {
 margin-bottom: 0.75rem;
 line-height: 1.6;
 }
 .ad-content ul, .ad-content ol {
 margin-left: 1.5rem;
 margin-bottom: 0.75rem;
 }
 .ad-content a {
 color: #9f3562;
 text-decoration: underline;
 }
`}</style>

 {/* Sponsored Badge */}
 <div className="absolute top-4 right-4 z-10">
 <span className="px-3 py-1 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-xs font-semibold rounded-full shadow-md">
 Sponsored
 </span>
 </div>

 {/* Content */}
 <div className="relative z-10">
 {/* Header */}
 <div className="flex items-center gap-3 p-5 sm:p-6 advertiser-info"onClick={handleAdvertiserClick}>
 <img
 src={advertiser.image || fallbackProfilePic}
 alt={advertiser.name ||'Advertiser'}
 className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-gray-100 shadow-md cursor-pointer hover:ring-[#9f3562]/30 transition-all"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 <div className="flex-1 min-w-0 cursor-pointer">
 <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate hover:text-[#9f3562] transition-colors">
 {advertiser.name ||'Advertiser'}
 </h3>
 {advertiser.username && (
 <p className="text-xs sm:text-sm text-gray-500 truncate hover:text-[#9f3562] transition-colors">
 @{advertiser.username}
 </p>
 )}
 </div>
 </div>

 {/* Content */}
 <div className="pb-4">
 <div
 className="text-gray-800 break-words leading-relaxed text-sm sm:text-[15px] ad-contentp px-5 sm:px-6"
 dangerouslySetInnerHTML={{ __html: processMentions(adState.content || ad.content) }}
 />
 </div>

 {/* Image */}
 {(adState.image || ad.image) && (
 <div className="relative w-full overflow-hidden">
 <motion.img
 whileHover={{ scale: 1.02 }}
 transition={{ duration: 0.4 }}
 src={adState.image || ad.image}
 alt="Ad"
 className="w-full aspect-square object-cover"
 loading="lazy"/>
 </div>
 )}

 {/* Link Preview */}
 {adState.externalLink && adState.externalLink.url && (
 <motion.div
 whileHover={{ scale: 1.01 }}
 className="mx-5 sm:mx-6 mb-4 sm:mb-5 mt-3 sm:mt-4 border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-[#9f3562]/30 hover:shadow-md transition-all cursor-pointer group/link">
 <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white group-hover/link:from-[#9f3562]/5 group-hover/link:to-pink-50/50 transition-all duration-300">
 <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
 {adState.externalLink.preview?.favicon ? (
 <img
 src={adState.externalLink.preview.favicon}
 alt="Link"
 className="w-8 h-8 object-contain"
 />
 ) : (
 <ExternalLink className="w-6 h-6 text-gray-600"/>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-sm text-gray-900 truncate">
 {adState.externalLink.linkText || adState.externalLink.preview?.title || adState.externalLink.preview?.domain ||'External Link'}
 </p>
 {adState.externalLink.preview?.domain && (
 <p className="text-xs text-gray-500 truncate">
 {adState.externalLink.preview.domain}
 </p>
 )}
 </div>
 <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover/link:text-[#9f3562] transition-colors"/>
 </div>
 {adState.externalLink.preview?.image && (
 <img
 src={adState.externalLink.preview.image}
 alt="Link preview"
 className="w-full h-44 sm:h-52 object-contain"
 loading="lazy"
 />
 )}
 </motion.div>
 )}

 {/* Actions */}
 <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-t border-gray-100 ad-actions">
 <div className="flex items-center gap-5 sm:gap-7">
 <motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={handleLike}
 className="flex items-center gap-2 group/like"
 >
 <Heart
 className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
 adState.isLiked
 ?'fill-red-500 text-red-500'
 :'text-gray-500 group-hover/like:text-red-500 group-hover/like:scale-110'
 }`}
 />
 <span className={`text-sm sm:text-base font-bold transition-colors ${
 adState.isLiked ?'text-red-500':'text-gray-600 group-hover/like:text-red-500'
 }`}>
 {adState.likesCount || 0}
 </span>
 </motion.button>
 </div>

 {/* Edit/Delete Menu */}
 {showEditDelete && !isPreview && (
 <div className="relative"ref={menuRef}>
 <motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={(e) => {
 e.stopPropagation();
 setShowMenu(!showMenu);
 }}
 className="p-2 rounded-full hover:bg-gray-100 transition-colors"
 >
 <MoreVertical className="w-5 h-5 text-gray-600"/>
 </motion.button>
 <AnimatePresence>
 {showMenu && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -10 }}
 className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={(e) => {
 e.stopPropagation();
 setShowMenu(false);
 navigate(`/advertiser/ads/${ad._id}/edit`);
 }}
 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
 >
 <Edit className="w-4 h-4"/>
 <span className="text-sm font-medium">Edit ad</span>
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setShowMenu(false);
 if (onDelete) {
 onDelete(ad._id);
 }
 }}
 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600"
 >
 <Trash2 className="w-4 h-4"/>
 <span className="text-sm font-medium">Delete ad</span>
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 );
};

export default AdCard;
