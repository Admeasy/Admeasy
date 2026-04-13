import { useState, useEffect } from'react';
import { Link, useOutletContext } from'react-router-dom';
import { motion } from'framer-motion';
import { Plus, Filter, Menu } from'lucide-react';
import { toast } from'react-toastify';
import AdvertiserAdCard from'../components/AdvertiserAdCard';
import SEO from'../components/SEO';

const MyAds = () => {
 const outletContext = useOutletContext() || {};
 const { setShowMobileMenu } = outletContext;
 const [ads, setAds] = useState([]);
 const [loading, setLoading] = useState(true);
 const [sort, setSort] = useState('latest');

 useEffect(() => {
 fetchAds();
 }, [sort]);

 const fetchAds = async () => {
 try {
 setLoading(true);
 const res = await fetch(`/api/advertisers/ads?sort=${sort}`, {
 credentials:'include'
 });

 const data = await res.json();
 if (data.success) {
 setAds(data.ads || []);
 } else {
 toast.error('Failed to load ads');
 }
 } catch (error) {
 console.error('Fetch ads error:', error);
 toast.error('Failed to load ads');
 } finally {
 setLoading(false);
 }
 };

 const handleAdUpdate = (updatedAd) => {
 setAds(prev => prev.map(ad => ad._id === updatedAd._id ? { ...ad, ...updatedAd } : ad));
 };

 const handleDeleteAd = async (adId) => {
 if (!window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
 return;
 }

 try {
 const res = await fetch(`/api/ads/${adId}`, {
 method:'DELETE',
 credentials:'include'
 });

 const data = await res.json();
 if (data.success) {
 toast.success('Ad deleted successfully');
 setAds(prev => prev.filter(ad => ad._id !== adId));
 } else {
 toast.error(data.message ||'Failed to delete ad');
 }
 } catch (error) {
 console.error('Delete ad error:', error);
 toast.error('Failed to delete ad');
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 return (
 <div>
 <SEO title="My Ads | Advertiser Dashboard"description="Manage your advertisements"/>
 
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
 <div>
 <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
 <button
 type="button"
 onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
 className="inline-flex xl:hidden items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
 >
 <Menu className="w-4 h-4"/>
 </button>
 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Ads</h1>
 </div>
 <p className="text-sm sm:text-base text-gray-600">Manage and track your advertisements</p>
 </div>
 <Link
 to="/advertiser/create-ad"
 className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
 >
 <Plus className="w-4 h-4 sm:w-5 sm:h-5"/>
 <span className="whitespace-nowrap">Create New Ad</span>
 </Link>
 </div>

 {/* Sort Filter */}
 <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4">
 <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0"/>
 <select
 value={sort}
 onChange={(e) => setSort(e.target.value)}
 className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base flex-1 sm:flex-initial"
 >
 <option value="latest">Latest</option>
 <option value="most-viewed">Most Viewed</option>
 <option value="most-liked">Most Liked</option>
 <option value="most-clicked">Most Clicked</option>
 <option value="best-performing">Best Performing</option>
 </select>
 </div>

 {/* Ads Grid */}
 {ads.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
 {ads.map((ad, index) => (
 <motion.div
 key={ad._id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.1 }}
 className="relative"
 >
 <AdvertiserAdCard 
 ad={ad} 
 onAdUpdate={handleAdUpdate} 
 showEditDelete={true}
 onDelete={handleDeleteAd}
 />
 </motion.div>
 ))}
 </div>
 ) : (
 <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center border border-gray-100">
 <p className="text-sm sm:text-base text-gray-600 mb-4">You haven't created any ads yet.</p>
 <Link
 to="/advertiser/create-ad"
 className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all text-sm sm:text-base"
 >
 <Plus className="w-4 h-4 sm:w-5 sm:h-5"/>
 Create Your First Ad
 </Link>
 </div>
 )}
 </div>
 );
};

export default MyAds;
