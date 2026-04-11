import React, { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { motion } from'framer-motion';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, User, CreditCard, Loader2, Sparkles } from'lucide-react';
import { toast } from'react-toastify';
import { useUser } from'../context/UserContext';
import ProtectedRoute from'../components/ProtectedRoute';
import SEO from'../components/SEO';

const MySubscriptions = () => {
 const navigate = useNavigate();
 const { user } = useUser();
 const [subscriptions, setSubscriptions] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (user) {
 fetchSubscriptions();
 }
 }, [user]);

 const fetchSubscriptions = async () => {
 try {
 setLoading(true);
 const response = await fetch('/api/subscriptions/my-subscriptions', {
 credentials:'include'
 });
 if (!response.ok) throw new Error('Failed to fetch subscriptions');
 const data = await response.json();
 if (data.success) {
 setSubscriptions(data.subscriptions);
 }
 } catch (error) {
 console.error('Error fetching subscriptions:', error);
 toast.error('Failed to load subscriptions');
 } finally {
 setLoading(false);
 }
 };

 const getStatusIcon = (status, endDate) => {
 if (status ==='active'&& new Date(endDate) > new Date()) {
 return <CheckCircle className="w-5 h-5 text-green-500"/>;
 } else if (status ==='expired') {
 return <XCircle className="w-5 h-5 text-gray-400"/>;
 } else if (status ==='cancelled') {
 return <XCircle className="w-5 h-5 text-red-500"/>;
 }
 return <Clock className="w-5 h-5 text-yellow-500"/>;
 };

 const getStatusColor = (status, endDate) => {
 if (status ==='active'&& new Date(endDate) > new Date()) {
 return'bg-green-100 text-green-700 border-green-200';
 } else if (status ==='expired') {
 return'bg-gray-100 text-gray-700 border-gray-200';
 } else if (status ==='cancelled') {
 return'bg-red-100 text-red-700 border-red-200';
 }
 return'bg-yellow-100 text-yellow-700 border-yellow-200';
 };

 const isActive = (subscription) => {
 return subscription.status ==='active'&& new Date(subscription.endDate) > new Date();
 };

 const activeSubscriptions = subscriptions.filter(isActive);
 const expiredSubscriptions = subscriptions.filter(sub => !isActive(sub));

 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center">
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center"
 >
 <Loader2 className="w-12 h-12 text-[#9f3562] animate-spin mx-auto mb-4"/>
 <p className="text-gray-600">Loading subscriptions...</p>
 </motion.div>
 </div>
 );
 }

 return (
 <ProtectedRoute user={user}>
 <SEO
 title="My Subscriptions | Admeasy"
 description="View and manage your mentor subscriptions"
 />
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden py-12 px-4 sm:px-6 lg:px-8">
 {/* Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'8s'}} />
 <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'10s'}} />
 </div>

 <div className="max-w-6xl mx-auto relative z-10">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="mb-8"
 >
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-2 text-gray-600 hover:text-[#9f3562] transition-colors mb-6"
 >
 <ArrowLeft className="w-5 h-5"/>
 <span>Back</span>
 </button>
 <div className="flex items-center gap-3 mb-4">
 <div className="p-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] rounded-xl">
 <Sparkles className="w-6 h-6 text-white"/>
 </div>
 <div>
 <h1 className="text-3xl sm:text-4xl font-admeasy-bold text-gray-900">My Subscriptions</h1>
 <p className="text-gray-600 mt-1">{subscriptions.length} subscription{subscriptions.length !== 1 ?'s':''}</p>
 </div>
 </div>
 </motion.div>

 {/* Active Subscriptions */}
 {activeSubscriptions.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="mb-8"
 >
 <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <CheckCircle className="w-5 h-5 text-green-500"/>
 Active Subscriptions ({activeSubscriptions.length})
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {activeSubscriptions.map((subscription, index) => (
 <motion.div
 key={subscription._id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 * index }}
 className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 p-6"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <h3 className="text-xl font-bold text-gray-900 mb-1">{subscription.plan?.name ||'Unknown Plan'}</h3>
 <div className="flex items-center gap-2 text-gray-600 mb-2">
 <User className="w-4 h-4"/>
 <span className="text-sm">{subscription.mentor?.name || subscription.mentor?.username ||'Unknown Mentor'}</span>
 </div>
 </div>
 <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status, subscription.endDate)}`}>
 {getStatusIcon(subscription.status, subscription.endDate)}
 {subscription.status}
 </span>
 </div>

 <div className="space-y-3">
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Calendar className="w-4 h-4"/>
 <span>Started: {new Date(subscription.startDate).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Calendar className="w-4 h-4"/>
 <span>Expires: {new Date(subscription.endDate).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <CreditCard className="w-4 h-4 text-[#9f3562]"/>
 <span className="font-semibold text-gray-900">
 ₹{subscription.payment?.amount?.toLocaleString() ||'N/A'} / {subscription.billingPeriod}
 </span>
 </div>
 {subscription.plan?.features && subscription.plan.features.length > 0 && (
 <div className="pt-3 border-t border-gray-200">
 <div className="text-xs font-semibold text-gray-500 mb-2">FEATURES</div>
 <ul className="space-y-1">
 {subscription.plan.features.slice(0, 3).map((feature, idx) => (
 <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
 <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"/>
 <span>{feature}</span>
 </li>
 ))}
 {subscription.plan.features.length > 3 && (
 <li className="text-xs text-gray-400 italic">+{subscription.plan.features.length - 3} more</li>
 )}
 </ul>
 </div>
 )}
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Expired/Cancelled Subscriptions */}
 {expiredSubscriptions.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.3 }}
 >
 <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <XCircle className="w-5 h-5 text-gray-400"/>
 Past Subscriptions ({expiredSubscriptions.length})
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {expiredSubscriptions.map((subscription, index) => (
 <motion.div
 key={subscription._id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 * index }}
 className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 opacity-75"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <h3 className="text-xl font-bold text-gray-900 mb-1">{subscription.plan?.name ||'Unknown Plan'}</h3>
 <div className="flex items-center gap-2 text-gray-600 mb-2">
 <User className="w-4 h-4"/>
 <span className="text-sm">{subscription.mentor?.name || subscription.mentor?.username ||'Unknown Mentor'}</span>
 </div>
 </div>
 <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status, subscription.endDate)}`}>
 {getStatusIcon(subscription.status, subscription.endDate)}
 {subscription.status}
 </span>
 </div>

 <div className="space-y-2 text-sm text-gray-600">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4"/>
 <span>Ended: {new Date(subscription.endDate).toLocaleDateString()}</span>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Empty State */}
 {subscriptions.length === 0 && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center py-16 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200"
 >
 <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
 <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Yet</h3>
 <p className="text-gray-600 mb-6">Subscribe to mentors to access exclusive content and features.</p>
 <button
 onClick={() => navigate('/mentors')}
 className="px-6 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all"
 >
 Browse Mentors
 </button>
 </motion.div>
 )}
 </div>
 </div>
 </ProtectedRoute>
 );
};

export default MySubscriptions;
