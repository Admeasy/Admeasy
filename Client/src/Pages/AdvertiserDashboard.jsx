import { useState, useEffect, useCallback } from'react';
import { Link, useOutletContext } from'react-router-dom';
import { motion } from'framer-motion';
import { Plus, Eye, MousePointerClick, Heart, TrendingUp, Calendar, Menu } from'lucide-react';
import { toast } from'react-toastify';
import SEO from'../components/SEO';

const AdvertiserDashboard = () => {
 const outletContext = useOutletContext() || {};
 const { setShowMobileMenu } = outletContext;
 const [stats, setStats] = useState({
 totalViews: 0,
 totalClicks: 0,
 totalLikes: 0,
 viewsByDate: {},
 clicksByDate: {},
 likesByDate: {}
 });
 const [period, setPeriod] = useState('month');
 const [loading, setLoading] = useState(true);

 // Fetch stats; optionally show a loading state (for initial load / period change),
 // but keep background refreshes silent so the UI doesn't rerender with a spinner.
 const fetchStats = useCallback(
 async (showLoading = false) => {
 try {
 if (showLoading) {
 setLoading(true);
 }

 const res = await fetch(`/api/advertisers/dashboard/stats?period=${period}`, {
 credentials:'include'
 });

 const data = await res.json();
 if (data.success) {
 setStats(data.stats);
 } else {
 toast.error('Failed to load stats');
 }
 } catch (error) {
 console.error('Stats error:', error);
 toast.error('Failed to load stats');
 } finally {
 if (showLoading) {
 setLoading(false);
 }
 }
 },
 [period]
 );

 useEffect(() => {
 // Initial load (and when period changes) - show loading spinner
 fetchStats(true);

 // Poll periodically so graphs feel real-time (background only, no spinner)
 const intervalId = setInterval(() => {
 fetchStats(false);
 }, 15000); // every 15 seconds

 return () => clearInterval(intervalId);
 }, [fetchStats]);

 const getChartData = (dataByDate) => {
 const dates = Object.keys(dataByDate).sort();
 const values = dates.map(date => dataByDate[date]);
 const maxValue = Math.max(...values, 1);
 
 return dates.map((date, index) => ({
 date: new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric'}),
 value: values[index],
 height: (values[index] / maxValue) * 100
 }));
 };

 const viewsData = getChartData(stats.viewsByDate);
 const clicksData = getChartData(stats.clicksByDate);
 const likesData = getChartData(stats.likesByDate);

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 return (
 <div>
 <SEO title="Advertiser Dashboard | Admeasy"description="Manage your ads and track performance"/>
 
 {/* Header */}
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
 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
 </div>
 <p className="text-sm sm:text-base text-gray-600">Track your ad performance and analytics</p>
 </div>
 <Link
 to="/advertiser/create-ad"
 className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
 >
 <Plus className="w-4 h-4 sm:w-5 sm:h-5"/>
 <span className="whitespace-nowrap">Create New Ad</span>
 </Link>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
 <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"/>
 </div>
 </div>
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalViews.toLocaleString()}</h3>
 <p className="text-sm sm:text-base text-gray-600">Total Views</p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
 <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"/>
 </div>
 </div>
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalClicks.toLocaleString()}</h3>
 <p className="text-sm sm:text-base text-gray-600">Total Clicks</p>
 <p className="text-xs text-gray-500 mt-1">Click-through rate: {stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}%</p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center">
 <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"/>
 </div>
 </div>
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalLikes.toLocaleString()}</h3>
 <p className="text-sm sm:text-base text-gray-600">Total Likes</p>
 </motion.div>
 </div>

 {/* Period Selector */}
 <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4">
 <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0"/>
 <select
 value={period}
 onChange={(e) => setPeriod(e.target.value)}
 className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base flex-1 sm:flex-initial"
 >
 <option value="month">This Month</option>
 <option value="year">This Year</option>
 </select>
 </div>

 {/* Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
 {/* Views Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
 <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"/>
 <span>Views</span>
 </h3>
 {viewsData.length > 0 ? (
 <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48 overflow-x-auto pb-2">
 {viewsData.map((item, index) => (
 <div key={index} className="flex-1 min-w-[20px] sm:min-w-0 flex flex-col items-center">
 <div className="w-full flex items-end justify-center"style={{ height:'160px', minHeight:'160px'}}>
 <motion.div
 initial={{ height: 0 }}
 animate={{ height:`${item.height}%`}}
 transition={{ duration: 0.5, delay: index * 0.05 }}
 className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer min-h-[4px]"
 title={`${item.value} views on ${item.date}`}
 />
 </div>
 <span className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 text-center transform -rotate-45 origin-center whitespace-nowrap">
 {item.date.split('')[1]}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400 text-sm">
 No data available
 </div>
 )}
 </motion.div>

 {/* Clicks Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
 <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0"/>
 <span>Clicks</span>
 </h3>
 {clicksData.length > 0 ? (
 <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48 overflow-x-auto pb-2">
 {clicksData.map((item, index) => (
 <div key={index} className="flex-1 min-w-[20px] sm:min-w-0 flex flex-col items-center">
 <div className="w-full flex items-end justify-center"style={{ height:'160px', minHeight:'160px'}}>
 <motion.div
 initial={{ height: 0 }}
 animate={{ height:`${item.height}%`}}
 transition={{ duration: 0.5, delay: index * 0.05 }}
 className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg hover:from-green-600 hover:to-green-500 transition-all cursor-pointer min-h-[4px]"
 title={`${item.value} clicks on ${item.date}`}
 />
 </div>
 <span className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 text-center transform -rotate-45 origin-center whitespace-nowrap">
 {item.date.split('')[1]}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400 text-sm">
 No data available
 </div>
 )}
 </motion.div>

 {/* Likes Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100"
 >
 <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
 <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0"/>
 <span>Likes</span>
 </h3>
 {likesData.length > 0 ? (
 <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48 overflow-x-auto pb-2">
 {likesData.map((item, index) => (
 <div key={index} className="flex-1 min-w-[20px] sm:min-w-0 flex flex-col items-center">
 <div className="w-full flex items-end justify-center"style={{ height:'160px', minHeight:'160px'}}>
 <motion.div
 initial={{ height: 0 }}
 animate={{ height:`${item.height}%`}}
 transition={{ duration: 0.5, delay: index * 0.05 }}
 className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg hover:from-red-600 hover:to-red-500 transition-all cursor-pointer min-h-[4px]"
 title={`${item.value} likes on ${item.date}`}
 />
 </div>
 <span className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 text-center transform -rotate-45 origin-center whitespace-nowrap">
 {item.date.split('')[1]}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="h-40 sm:h-48 flex items-center justify-center text-gray-400 text-sm">
 No data available
 </div>
 )}
 </motion.div>
 </div>
 </div>
 );
};

export default AdvertiserDashboard;
