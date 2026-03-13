import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaCreditCard, FaUser, FaCalendar, FaCheckCircle, FaTimesCircle, FaClock, FaUndo } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { getAdminAuthHeaders } from '../utils/adminAuth';

const CheckPayments = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    const showError = (error) => { toast.error(error); return "" };
    const showSuccess = (msg) => toast.success(msg);

    useEffect(() => {
        verifyAuth();
    }, []);

    const verifyAuth = async () => {
        try {
            const response = await fetch('/api/admin/verify', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Not authenticated');
            }

            fetchPayments();
        } catch (error) {
            console.error('Authentication failed:', error);
            navigate('/admin');
        }
    };

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/payments/all', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to fetch payments');
            }
            const data = await response.json();
            if (data.success) {
                setPayments(data.payments);
            } else {
                throw new Error(data.message || 'Failed to fetch payments');
            }
        } catch (err) {
            setError(err.message);
            showError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <FaCheckCircle className="text-green-500" />;
            case 'failed':
                return <FaTimesCircle className="text-red-500" />;
            case 'pending':
                return <FaClock className="text-yellow-500" />;
            case 'refunded':
                return <FaUndo className="text-blue-500" />;
            default:
                return <FaClock className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'refunded':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = 
            (payment.user?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.user?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.razorpayPaymentId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.razorpayOrderId?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
        const matchesType = filterType === 'all' || payment.paymentType === filterType;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalAmount = filteredPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (isLoading) {
        return (
            <main className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center'>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9f3562] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payments...</p>
                </div>
            </main>
        );
    }

    return (
        <main className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]'>
            {/* Enhanced Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            <button
                className='absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]'
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
                Back
            </button>

            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
                Check Payments
            </h1>

            <ToastContainer className='hidden' />

            {error && showError(error)}

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-gray-200"
                    >
                        <div className="text-sm text-gray-600 mb-1">Total Payments</div>
                        <div className="text-2xl font-bold text-gray-900">{filteredPayments.length}</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-gray-200"
                    >
                        <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-gray-200"
                    >
                        <div className="text-sm text-gray-600 mb-1">Completed</div>
                        <div className="text-2xl font-bold text-green-600">
                            {filteredPayments.filter(p => p.status === 'completed').length}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-gray-200"
                    >
                        <div className="text-sm text-gray-600 mb-1">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {filteredPayments.filter(p => p.status === 'pending').length}
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, transaction ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="note">Note Purchase</option>
                            <option value="subscription">Subscription</option>
                        </select>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payee</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredPayments.map((payment, index) => (
                                    <motion.tr
                                        key={payment._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-mono text-xs text-gray-600">
                                                {payment.razorpayPaymentId || payment.razorpayOrderId || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-gray-400" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {payment.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.user?.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FaCreditCard className="text-[#9f3562]" />
                                                <span className="capitalize">{payment.paymentType || 'note'}</span>
                                            </div>
                                            {payment.paymentType === 'subscription' && payment.mentor && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Mentor: {payment.mentor?.name || payment.mentor?.username || 'Unknown'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-semibold text-gray-900">₹{payment.amount?.toLocaleString() || '0'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                                {getStatusIcon(payment.status)}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <FaCalendar className="text-gray-400" />
                                                {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredPayments.length === 0 && (
                        <div className="text-center py-12">
                            <FaCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No payments found</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default CheckPayments;
