import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock } from 'react-icons/fa';
import logo from '../assets/Admeasy/LOGO.webp';

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
    // Verify admin token on component mount
    const verifyAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
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
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setCredentials({ username: '', password: '' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        className="min-h-screen p-8">
        <div className="max-w-9/10 mx-auto space-y-8">
          <img src={logo} alt="LOGO" className='h-28 mx-auto' />
          <button
            onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white font-semibold absolute top-8 right-8 rounded-xl hover:bg-red-600 transition-colors">
            Logout
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/admin/colleges">
            <div className="bg-white p-6 rounded-2xl shadow-3d hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-admeasy-bold text-thead1 mb-4">Manage Colleges</h2>
              <p className="text-gray-600">Add, edit, or remove college information</p>
            </div>
            </Link>
            <Link to="/admin/users">
            <div className="bg-white p-6 rounded-2xl shadow-3d hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-admeasy-bold text-thead1 mb-4">User Management</h2>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md p-8 bg-white rounded-2xl shadow-3d"
      >
        <h1 className="text-3xl font-admeasy-extrabold text-thead1 text-center mb-8">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Username"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className={`w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${isLoginLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
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
