import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaSchool, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { getSchoolAuthHeaders, clearSchoolToken } from '../utils/schoolAuth';

const SchoolDashboard = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    try {
      const res = await fetch('/api/schools/me', {
        credentials: 'include',
        headers: getSchoolAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        navigate('/school-login');
        return;
      }
      setSchool(data.school);
    } catch (err) {
      navigate('/school-login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSchoolToken();
    navigate('/school-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaSchool className="text-[#9f3562]" />
            {school?.schoolName || 'School'} Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        <div className="grid gap-6">
          <Link
            to="/school/add-teacher"
            className="p-6 bg-white rounded-xl shadow border border-gray-200 hover:border-[#9f3562]/30 flex items-center gap-4"
          >
            <FaUserPlus className="text-3xl text-[#9f3562]" />
            <div>
              <h2 className="font-semibold text-gray-900">Add Teacher</h2>
              <p className="text-sm text-gray-600">Invite teachers by email</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;
