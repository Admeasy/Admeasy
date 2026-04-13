import { useState, useEffect } from'react';
import { useParams, useNavigate, useLocation, Link, useOutletContext } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { Edit, ExternalLink, Globe, Link2, BarChart3, Menu } from'lucide-react';
import { toast } from'react-toastify';
import AdvertiserAdCard from'../components/AdvertiserAdCard';
import AdCard from'../components/AdCard';
import SEO from'../components/SEO';

const AdvertiserProfile = () => {
 const { username } = useParams();
 const location = useLocation();
 const navigate = useNavigate();
 const outletContext = useOutletContext() || {};
 const { setShowMobileMenu } = outletContext;
 const [advertiser, setAdvertiser] = useState(null);
 const [ads, setAds] = useState([]);
 const [loading, setLoading] = useState(true);
 
 // Check if viewing own profile (no username param or at /advertiser/profile) or another advertiser's profile
 const isOwnProfile = !username || location.pathname ==='/advertiser/profile';
 
 // Use AdCard (with tracking) when accessed via /:username route, AdvertiserAdCard (without tracking) when in advertiser panel
 const isPublicView = !location.pathname.startsWith('/advertiser');
 const AdComponent = isPublicView ? AdCard : AdvertiserAdCard;

 useEffect(() => {
 fetchProfile();
 }, [username, isOwnProfile]);

 const fetchProfile = async () => {
 try {
 setLoading(true);
 let res;
 
 if (isOwnProfile) {
 // Fetch current advertiser's profile
 res = await fetch('/api/advertisers/me', {
 credentials:'include'
 });
 } else {
 // Fetch advertiser by username using unified profile route
 res = await fetch(`/api/profile/${username}`);
 }
 
 const data = await res.json();

 if (data.success) {
 const advertiserData = isOwnProfile ? data.advertiser : data.profile;
 
 // If it's from unified route, check if it's an advertiser
 if (!isOwnProfile && data.type !=='advertiser') {
 toast.error('Profile not found');
 navigate('/');
 return;
 }
 
 setAdvertiser(advertiserData);
 
 // Fetch ads using advertiser ID or username
 if (isOwnProfile) {
 fetchAdsByAdvertiserId(advertiserData._id);
 } else {
 fetchAdsByUsername(username);
 }
 } else {
 toast.error('Advertiser not found');
 if (isOwnProfile) {
 navigate('/advertiser/dashboard');
 } else {
 navigate('/');
 }
 }
 } catch (error) {
 console.error('Profile error:', error);
 toast.error('Failed to load profile');
 } finally {
 setLoading(false);
 }
 };

 const fetchAdsByUsername = async (usernameParam) => {
 try {
 const res = await fetch(`/api/advertisers/${usernameParam}/ads`);
 const data = await res.json();
 if (data.success) {
 setAds(data.ads || []);
 }
 } catch (error) {
 console.error('Fetch ads error:', error);
 }
 };

 const fetchAdsByAdvertiserId = async (advertiserId) => {
 try {
 // For own profile, fetch ads using the advertiser's own ads endpoint
 const res = await fetch('/api/advertisers/ads', {
 credentials:'include'
 });
 const data = await res.json();
 if (data.success) {
 setAds(data.ads || []);
 }
 } catch (error) {
 console.error('Fetch ads error:', error);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 if (!advertiser) {
 return null;
 }

 const fallbackProfilePic ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
 const profileName = advertiser.name || advertiser.username ||'Advertiser';
 const profileUsername = advertiser.username ?`@${advertiser.username}`: null;
 const adsCount = isOwnProfile ? ads.length : (advertiser.adsCount || 0);

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
 <SEO
 title={`${profileName} | Advertiser Profile`}
 description={advertiser.bio ||`View ${profileName}'s advertisements`}
 />

 {/* Main Container */}
 <div className="max-w-5xl mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8">
 {/* Profile Card (match Profile.jsx style) */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35, ease:'easeOut'}}
 className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden mb-4 sm:mb-6 relative"
 >
 {/* Cover Background */}
 <div className="h-20 sm:h-24 md:h-32 bg-gradient-to-r from-pink-50 via-white to-purple-50 border-b border-slate-200"/>

 {/* Account Tag */}
 <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
 <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-[10px] sm:text-xs font-semibold rounded-full shadow-lg">
 Advertiser
 </span>
 </div>

 {/* Profile Content */}
 <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
 {/* Avatar + Actions */}
 <div className="flex justify-between items-start -mt-10 sm:-mt-12 md:-mt-16 mb-3 sm:mb-4 gap-2 sm:gap-3">
 <div className="relative">
 <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 sm:border-4 border-white shadow-xl overflow-hidden bg-white">
 <img
 src={advertiser.image || fallbackProfilePic}
 alt={profileName}
 className="w-full h-full object-cover"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 </div>
 </div>

 {/* Action Buttons (no Follow/Message/Subscribe) */}
 <div className="flex gap-1.5 sm:gap-2 mt-2 items-center flex-wrap justify-end">
 {isOwnProfile && (
 <Link
 to="/advertiser/profile/edit"
 className="px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white border border-slate-200 hover:bg-gray-100 shadow-sm rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-gray-800 transition-colors flex items-center gap-1 sm:gap-2"
 >
 <Edit size={14} className="sm:w-4 sm:h-4"/>
 <span className="hidden sm:inline">Edit</span>
 </Link>
 )}
 {advertiser.website && (
 <a
 href={advertiser.website}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all flex items-center gap-1 sm:gap-2"
 >
 <ExternalLink size={14} className="sm:w-4 sm:h-4"/>
 <span>Visit</span>
 </a>
 )}
 </div>
 </div>

 {/* Name + Username */}
 <div className="flex flex-col gap-0.5 sm:gap-1 mb-3 sm:mb-4">
 <div className="flex items-center gap-2 sm:gap-3">
 <button
 type="button"
 onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
 className="inline-flex xl:hidden items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
 >
 <Menu className="w-4 h-4"/>
 </button>
 <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
 {profileName}
 </h1>
 </div>
 {profileUsername && (
 <p className="text-xs sm:text-sm text-gray-500 font-medium">{profileUsername}</p>
 )}
 </div>

 {/* Bio */}
 {advertiser.bio ? (
 <p className="text-gray-700 text-xs sm:text-sm md:text-[15px] leading-relaxed mb-3 sm:mb-4">
 {advertiser.bio}
 </p>
 ) : (
 <p className="text-gray-500 text-xs sm:text-sm md:text-[15px] leading-relaxed mb-3 sm:mb-4">
 {isOwnProfile ?'Add a bio to tell users what you offer.':'No bio provided.'}
 </p>
 )}

 {/* Info chips */}
 <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
 <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
 <BarChart3 size={14} className="sm:w-4 sm:h-4 text-[#9f3562] flex-shrink-0"/>
 <span className="text-xs sm:text-sm font-semibold">{adsCount}</span>
 <span className="text-xs sm:text-sm">Ads</span>
 </div>
 {advertiser.website && (
 <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
 <Link2 size={14} className="sm:w-4 sm:h-4 text-[#9f3562] flex-shrink-0"/>
 <span className="text-xs sm:text-sm font-medium line-clamp-1 max-w-[180px] sm:max-w-[220px]">
 {advertiser.website.replace(/^https?:\/\//,'')}
 </span>
 </div>
 )}
 </div>
 </div>
 </motion.div>

 {/* Ads Section */}
 <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
 <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-2">
 <div className="flex items-center gap-1.5 sm:gap-2">
 <Globe size={16} className="sm:w-[18px] sm:h-[18px] text-[#9f3562] flex-shrink-0"/>
 <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Ads</h2>
 </div>
 <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-semibold whitespace-nowrap">
 {ads.length} {ads.length === 1 ?'ad':'ads'}
 </span>
 </div>

 <div className="p-3 sm:p-4 md:p-6">
 {ads.length > 0 ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
 {ads.map((ad, index) => (
 <motion.div
 key={ad._id}
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(index * 0.05, 0.35) }}
 >
 <AdComponent ad={{ ...ad, advertiser }} />
 </motion.div>
 ))}
 </div>
 ) : (
 <div className="rounded-xl sm:rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8 md:p-10 text-center">
 <p className="text-sm sm:text-base text-gray-700 font-semibold mb-1">No ads yet</p>
 <p className="text-xs sm:text-sm text-gray-500">
 {isOwnProfile ?'Create your first ad to start reaching students.':'Check back later.'}
 </p>
 {isOwnProfile && (
 <div className="mt-3 sm:mt-4">
 <Link
 to="/advertiser/create-ad"
 className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all text-sm sm:text-base"
 >
 Create an Ad
 <ExternalLink size={14} className="sm:w-4 sm:h-4"/>
 </Link>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdvertiserProfile;
