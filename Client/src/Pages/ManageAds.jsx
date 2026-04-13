import { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { FaArrowLeft, FaSearch, FaTrash, FaCheckCircle, FaTimesCircle, FaEye, FaExternalLinkAlt, FaCalendarAlt, FaUser } from'react-icons/fa';
import { ToastContainer, toast } from'react-toastify';
import'react-toastify/dist/ReactToastify.css';
import { processMentions } from'../utils/processMentions';
import SEO from'../components/SEO';
import { getAdminAuthHeaders } from'../utils/adminAuth';

const ManageAds = () => {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('live');
 const [liveAds, setLiveAds] = useState([]);
 const [adRequests, setAdRequests] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [deletingAdId, setDeletingAdId] = useState(null);
 const [showImageModal, setShowImageModal] = useState(false);
 const [imageModal, setImageModal] = useState(null);

 useEffect(() => {
 verifyAuth();
 }, []);

 useEffect(() => {
 if (activeTab ==='live') {
 fetchLiveAds();
 } else {
 fetchAdRequests();
 }
 }, [activeTab]);

 const verifyAuth = async () => {
 try {
 const res = await fetch('/api/admin/verify', {
 credentials:'include',
 headers: getAdminAuthHeaders()
 });
 if (!res.ok) {
 throw new Error('Not authenticated');
 }
 } catch (err) {
 console.error('Admin auth failed:', err);
 navigate('/admin');
 }
 };

 const fetchLiveAds = async () => {
 try {
 setLoading(true);
 const res = await fetch('/api/ads/admin/live', {
 credentials:'include',
 headers: getAdminAuthHeaders()
 });

 const data = await res.json();
 if (data.success) {
 setLiveAds(data.ads || []);
 } else {
 toast.error('Failed to load live ads');
 }
 } catch (error) {
 console.error('Fetch live ads error:', error);
 toast.error('Failed to load live ads');
 } finally {
 setLoading(false);
 }
 };

 const fetchAdRequests = async () => {
 try {
 setLoading(true);
 const res = await fetch('/api/ads/admin/requests', {
 credentials:'include',
 headers: getAdminAuthHeaders()
 });

 const data = await res.json();
 if (data.success) {
 setAdRequests(data.adRequests || []);
 } else {
 toast.error('Failed to load ad requests');
 }
 } catch (error) {
 console.error('Fetch ad requests error:', error);
 toast.error('Failed to load ad requests');
 } finally {
 setLoading(false);
 }
 };

 const handleDelete = async (adId) => {
 if (!window.confirm('Are you sure you want to delete this ad?')) {
 return;
 }

 setDeletingAdId(adId);
 try {
 const res = await fetch(`/api/ads/admin/${adId}`, {
 method:'DELETE',
 credentials:'include',
 headers: getAdminAuthHeaders()
 });

 const data = await res.json();
 if (data.success) {
 toast.success('Ad deleted successfully');
 setLiveAds(prev => prev.filter(a => a._id !== adId));
 } else {
 toast.error(data.message ||'Failed to delete ad');
 }
 } catch (error) {
 console.error('Delete error:', error);
 toast.error('Failed to delete ad');
 } finally {
 setDeletingAdId(null);
 }
 };

 const handleApprove = async (requestId) => {
 try {
 const res = await fetch(`/api/ads/admin/requests/${requestId}/approve`, {
 method:'POST',
 credentials:'include',
 headers: getAdminAuthHeaders()
 });

 const data = await res.json();
 if (data.success) {
 toast.success('Ad approved and published successfully');
 setAdRequests(prev => prev.filter(r => r._id !== requestId));
 fetchLiveAds();
 } else {
 toast.error(data.message ||'Failed to approve ad');
 }
 } catch (error) {
 console.error('Approve error:', error);
 toast.error('Failed to approve ad');
 }
 };

 const handleReject = async (requestId, reason) => {
 try {
 const res = await fetch(`/api/ads/admin/requests/${requestId}/reject`, {
 method:'POST',
 headers: getAdminAuthHeaders({'Content-Type':'application/json'}),
 body: JSON.stringify({ reason }),
 credentials:'include'
 });

 const data = await res.json();
 if (data.success) {
 toast.success('Ad request rejected');
 setAdRequests(prev => prev.filter(r => r._id !== requestId));
 } else {
 toast.error(data.message ||'Failed to reject ad');
 }
 } catch (error) {
 console.error('Reject error:', error);
 toast.error('Failed to reject ad');
 }
 };

 const filteredLiveAds = liveAds.filter((ad) => {
 const advertiserName = ad.advertiserId?.name ||'';
 const advertiserUsername = ad.advertiserId?.username ||'';
 const contentText = (ad.content ||'').replace(/<[^>]+>/g,'');
 const q = searchQuery.toLowerCase();
 return (
 advertiserName.toLowerCase().includes(q) ||
 advertiserUsername.toLowerCase().includes(q) ||
 contentText.toLowerCase().includes(q)
 );
 });

 const filteredAdRequests = adRequests.filter((request) => {
 const advertiserName = request.advertiserId?.name ||'';
 const advertiserUsername = request.advertiserId?.username ||'';
 const contentText = (request.content ||'').replace(/<[^>]+>/g,'');
 const q = searchQuery.toLowerCase();
 return (
 advertiserName.toLowerCase().includes(q) ||
 advertiserUsername.toLowerCase().includes(q) ||
 contentText.toLowerCase().includes(q)
 );
 });

 const formatDateTime = (iso) => {
 if (!iso) return'';
 try {
 return new Date(iso).toLocaleString();
 } catch {
 return iso;
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse"/>
 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"style={{ animationDelay:'1s'}} />
 <div className="relative z-10">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 </div>
 );
 }

 return (
 <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <SEO title="Manage Ads | Admin"description="Manage advertisements and ad requests"/>
 
 {/* Enhanced Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'8s'}} />
 <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'10s'}} />
 <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'6s'}} />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"/>
 </div>

 <button
 className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]"
 onClick={() => navigate(-1)}
 >
 <FaArrowLeft />
 Back
 </button>

 <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
 Manage Ads
 </h1>

 <ToastContainer position="top-right"autoClose={3000} />

 <div className="max-w-6xl mx-auto relative z-10">
 {/* Search */}
 <div className="relative mb-6">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <FaSearch className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="text"
 placeholder="Search by advertiser or content..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
 />
 </div>

 {/* Stats */}
 <div className="flex items-center justify-center gap-4 mb-6">
 <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 flex flex-col items-center w-48 border border-gray-200 hover:border-[#9f3562]/30 transition-all duration-300">
 <h2 className="text-lg font-bold text-gray-800">Live Ads</h2>
 <p className="text-3xl font-extrabold text-[#9f3562] mt-1">
 {filteredLiveAds.length}
 </p>
 </div>
 <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 flex flex-col items-center w-48 border border-gray-200 hover:border-[#9f3562]/30 transition-all duration-300">
 <h2 className="text-lg font-bold text-gray-800">Pending Requests</h2>
 <p className="text-3xl font-extrabold text-orange-500 mt-1">
 {filteredAdRequests.length}
 </p>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-4 mb-6 border-b border-gray-200">
 <button
 onClick={() => setActiveTab('live')}
 className={`px-6 py-3 font-semibold transition-all ${
 activeTab ==='live'
 ?'text-[#9f3562] border-b-2 border-[#9f3562]'
 :'text-gray-600 hover:text-gray-900'
 }`}
 >
 Live Ads ({filteredLiveAds.length})
 </button>
 <button
 onClick={() => setActiveTab('requests')}
 className={`px-6 py-3 font-semibold transition-all ${
 activeTab ==='requests'
 ?'text-[#9f3562] border-b-2 border-[#9f3562]'
 :'text-gray-600 hover:text-gray-900'
 }`}
 >
 Ad Requests ({filteredAdRequests.length})
 </button>
 </div>

 <AnimatePresence mode="wait">
 {activeTab ==='live'? (
 <motion.div
 key="live"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 >
 {filteredLiveAds.length > 0 ? (
 <ul className="space-y-4">
 {filteredLiveAds.map((ad) => (
 <li
 key={ad._id}
 className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30"
 >
 <div className="flex items-start justify-between gap-4 mb-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
 {ad.advertiserId?.image ? (
 <img
 src={ad.advertiserId.image}
 alt={ad.advertiserId.name ||'Advertiser'}
 className="w-full h-full object-cover"
 />
 ) : (
 <FaUser className="text-gray-500"/>
 )}
 </div>
 <div>
 <p className="font-semibold text-gray-900">
 {ad.advertiserId?.name ||'Unknown Advertiser'}
 </p>
 {ad.advertiserId?.username && (
 <p className="text-sm text-gray-500">@{ad.advertiserId.username}</p>
 )}
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white mt-1">
 Sponsored
 </span>
 </div>
 </div>
 <div className="text-sm text-gray-500 whitespace-nowrap">
 {formatDateTime(ad.createdAt)}
 </div>
 </div>

 <div className="text-sm text-gray-800 mb-3">
 <div
 className="prose prose-sm max-w-none"
 dangerouslySetInnerHTML={{
 __html: processMentions(ad.content ||'')
 }}
 />
 </div>

 {ad.image && (
 <div className="mt-3 mb-3">
 <img
 src={ad.image}
 alt="Ad"
 className="max-h-48 w-full object-contain rounded-lg border border-gray-200 cursor-pointer"
 onClick={() => {
 setShowImageModal(true);
 setImageModal(ad.image);
 }}
 />
 </div>
 )}

 {ad.externalLink?.url && (
 <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
 <FaExternalLinkAlt className="text-[#9f3562]"/>
 <a
 href={ad.externalLink.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-[#9f3562] hover:underline truncate"
 >
 {ad.externalLink.url}
 </a>
 </div>
 )}

 <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
 <div className="flex items-center gap-4 text-sm text-gray-600">
 <span><FaEye className="inline mr-1"/> {ad.viewsCount || 0} views</span>
 <span>❤️ {ad.likesCount || 0} likes</span>
 <span>👆 {ad.clicksCount || 0} clicks</span>
 </div>
 <button
 onClick={() => handleDelete(ad._id)}
 disabled={deletingAdId === ad._id}
 className={`px-4 sm:px-6 py-2 flex items-center gap-2 rounded-xl text-white text-sm sm:text-base transition-all duration-300 hover:scale-105 active:scale-95 ${
 deletingAdId === ad._id
 ?'bg-gray-400 cursor-not-allowed'
 :'bg-red-500 hover:bg-red-600'
 }`}
 >
 <FaTrash />
 {deletingAdId === ad._id ?'Deleting...':'Delete'}
 </button>
 </div>
 </li>
 ))}
 </ul>
 ) : (
 <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <p className="text-gray-700 font-bold text-lg">No live ads found.</p>
 </div>
 )}
 </motion.div>
 ) : (
 <motion.div
 key="requests"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 >
 {filteredAdRequests.length > 0 ? (
 <ul className="space-y-4">
 {filteredAdRequests.map((request) => (
 <li
 key={request._id}
 className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30"
 >
 <div className="flex items-start justify-between gap-4 mb-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
 {request.advertiserId?.image ? (
 <img
 src={request.advertiserId.image}
 alt={request.advertiserId.name ||'Advertiser'}
 className="w-full h-full object-cover"
 />
 ) : (
 <FaUser className="text-gray-500"/>
 )}
 </div>
 <div>
 <p className="font-semibold text-gray-900">
 {request.advertiserId?.name ||'Unknown Advertiser'}
 </p>
 {request.advertiserId?.username && (
 <p className="text-sm text-gray-500">@{request.advertiserId.username}</p>
 )}
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white mt-1">
 Pending Review
 </span>
 </div>
 </div>
 <div className="text-sm text-gray-500 whitespace-nowrap">
 {formatDateTime(request.createdAt)}
 </div>
 </div>

 <div className="text-sm text-gray-800 mb-3">
 <div
 className="prose prose-sm max-w-none"
 dangerouslySetInnerHTML={{
 __html: processMentions(request.content ||'')
 }}
 />
 </div>

 {request.image && (
 <div className="mt-3 mb-3">
 <img
 src={request.image}
 alt="Ad"
 className="max-h-48 w-full object-contain rounded-lg border border-gray-200 cursor-pointer"
 onClick={() => {
 setShowImageModal(true);
 setImageModal(request.image);
 }}
 />
 </div>
 )}

 {request.externalLink?.url && (
 <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
 <FaExternalLinkAlt className="text-[#9f3562]"/>
 <a
 href={request.externalLink.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-[#9f3562] hover:underline truncate"
 >
 {request.externalLink.url}
 </a>
 </div>
 )}

 <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
 <button
 onClick={() => handleApprove(request._id)}
 className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
 >
 <FaCheckCircle />
 Approve
 </button>
 <button
 onClick={() => {
 const reason = prompt('Rejection reason (optional):');
 if (reason !== null) {
 handleReject(request._id, reason);
 }
 }}
 className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
 >
 <FaTimesCircle />
 Reject
 </button>
 </div>
 </li>
 ))}
 </ul>
 ) : (
 <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <p className="text-gray-700 font-bold text-lg">No ad requests found.</p>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Image Modal */}
 {showImageModal && (
 <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
 <img src={imageModal} alt="Ad"className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg border border-gray-200"/>
 <button
 onClick={() => setShowImageModal(false)}
 className="absolute top-4 right-4 text-gray-500 hover:text-[#9f3562] text-4xl font-bold transition-colors"
 >
 ×
 </button>
 </div>
 )}
 </main>
 );
};

export default ManageAds;
