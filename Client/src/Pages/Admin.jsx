import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserAlt, FaLock, FaSignOutAlt } from 'react-icons/fa';
const logo = '/LOGO.webp';
import SEO from '../components/SEO';
import { getAdminAuthHeaders, setAdminToken, clearAdminToken } from '../utils/adminAuth';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include',
          headers: getAdminAuthHeaders()
        });
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Verification failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    verifyAdmin();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) setAdminToken(data.token);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: getAdminAuthHeaders()
      });
      clearAdminToken();
      setIsAuthenticated(false);
      setCredentials({ username: '', password: '' });
    } catch (error) {
      console.error('Logout failed:', error);
      clearAdminToken();
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <SEO title="Admin Dashboard | Admeasy" description="Admin Dashboard" />

        {/* Enhanced Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="max-w-4/5 mx-auto space-y-8 relative z-10">
          <img src={logo} alt="LOGO" className='w-150 aspect-auto mx-auto' />
          <button
            onClick={handleLogout} className="px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-center bg-red-500 text-white font-semibold absolute top-2 sm:top-5 right-2 sm:right-5 rounded-lg sm:rounded-xl hover:bg-red-600 transition-colors z-20">
            <FaSignOutAlt className="w-5 h-5 mr-2" />
            Logout
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/admin/colleges">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Colleges</h2>
                <p className="text-gray-600">Add, edit, or remove college information</p>
              </div>
            </Link>
            <Link to="/admin/blogs">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Blogs</h2>
                <p className="text-gray-600">Add, edit, or remove Blogs</p>
              </div>
            </Link>
            <Link to="/admin/users">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Users</h2>
                <p className="text-gray-600">View and Delete Users</p>
              </div>
            </Link>
            <Link to="/admin/mentors">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Mentors</h2>
                <p className="text-gray-600">View all registered mentors</p>
              </div>
            </Link>
            <Link to="/admin/applications">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Applications</h2>
                <p className="text-gray-600">Review, Accept/Reject Applications</p>
              </div>
            </Link>
            <Link to="/admin/messages">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Check Messages</h2>
                <p className="text-gray-600">Check and reply messages</p>
              </div>
            </Link>
            <Link to="/admin/enrollments">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Enrollments</h2>
                <p className="text-gray-600">Students Enrolled From the Banner</p>
              </div>
            </Link>
            <Link to="/admin/notes">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Notes</h2>
                <p className="text-gray-600">Review and manage uploaded notes</p>
              </div>
            </Link>
            <Link to="/admin/posts">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Posts</h2>
                <p className="text-gray-600">Manage posts</p>
              </div>
            </Link>
            <Link to="/admin/subscription-plans">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Subscription Plans</h2>
                <p className="text-gray-600">Add, edit, or remove subscription plans</p>
              </div>
            </Link>
            <Link to="/admin/payments">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Check Payments</h2>
                <p className="text-gray-600">View all payments with transaction details</p>
              </div>
            </Link>
            <Link to="/admin/schools">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Schools</h2>
                <p className="text-gray-600">Create schools, assign codes, manage credentials</p>
              </div>
            </Link>
            <Link to="/admin/spaces">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Spaces</h2>
                <p className="text-gray-600">View and delete spaces created by users</p>
              </div>
            </Link>
            <Link to="/admin/advertisers">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Advertisers</h2>
                <p className="text-gray-600">View and manage advertiser accounts</p>
              </div>
            </Link>
            <Link to="/admin/ads">
              <div className="admin-dashboard-card">
                <h2 className="text-xl font-admeasy-bold text-gray-900 mb-4">Manage Ads</h2>
                <p className="text-gray-600">Review and manage advertisements</p>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 relative z-10"
      >
        <h1 className="text-3xl font-admeasy-extrabold text-gray-900 text-center mb-8">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserAlt className="h-5 w-5 text-[#9f3562]" />
              </div>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
                placeholder="Username"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-[#9f3562]" />
              </div>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
                placeholder="Password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoginLoading}
            className={`w-full py-2.5 px-4 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9f3562]/50 ${isLoginLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isLoginLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default Admin;
