import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verify admin token on component mount
    const verifyAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Not authorized');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Verification failed:', error);
        navigate('/admin');
      }
    };

    verifyAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/admin');
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

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-gray-100 p-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-3d p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-admeasy-extrabold text-thead1">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add your admin dashboard content here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example cards - replace with actual admin features */}
          <div className="bg-white p-6 rounded-2xl shadow-3d">
            <h2 className="text-xl font-admeasy-bold text-thead1 mb-4">Manage Colleges</h2>
            <p className="text-gray-600">Add, edit, or remove college information</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-3d">
            <h2 className="text-xl font-admeasy-bold text-thead1 mb-4">Manage Courses</h2>
            <p className="text-gray-600">Update course details and information</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-3d">
            <h2 className="text-xl font-admeasy-bold text-thead1 mb-4">User Management</h2>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard; 