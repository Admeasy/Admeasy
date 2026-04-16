import { useState, useEffect } from'react';
import { useNavigate, Link } from'react-router-dom';
import { FaSignOutAlt, FaStickyNote, FaUsers, FaComments } from'react-icons/fa';
import { getSchoolAuthHeaders, clearSchoolToken } from'../utils/schoolAuth';

const TeacherDashboard = () => {
 const navigate = useNavigate();
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchMe();
 }, []);

 const fetchMe = async () => {
 try {
 const res = await fetch('/api/schools/me', {
 credentials:'include',
 headers: getSchoolAuthHeaders(),
 });
 const json = await res.json();
 if (!res.ok || !json.success) {
 navigate('/school-login');
 return;
 }
 setData(json);
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

 const school = data?.school;
 const teacher = data?.teacher;

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 p-6">
 <div className="max-w-4xl mx-auto">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">
 {teacher?.name || teacher?.email ||'Teacher'} Dashboard
 </h1>
 <p className="text-gray-600">{school?.schoolName}</p>
 </div>
 <button
 onClick={handleLogout}
 className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
 >
 <FaSignOutAlt /> Logout
 </button>
 </div>

 <div className="grid gap-6 sm:grid-cols-2">
 <Link
 to="/notes"
 className="p-6 bg-white rounded-xl shadow border border-gray-200 hover:border-[#9f3562]/30 flex items-center gap-4"
 >
 <FaStickyNote className="text-3xl text-[#9f3562]"/>
 <div>
 <h2 className="font-semibold text-gray-900">Notes</h2>
 <p className="text-sm text-gray-600">Upload and share notes in spaces</p>
 </div>
 </Link>
 <Link
 to="/mentors"
 className="p-6 bg-white rounded-xl shadow border border-gray-200 hover:border-[#9f3562]/30 flex items-center gap-4"
 >
 <FaUsers className="text-3xl text-[#9f3562]"/>
 <div>
 <h2 className="font-semibold text-gray-900">Mentors</h2>
 <p className="text-sm text-gray-600">Browse and share mentor profiles</p>
 </div>
 </Link>
 <Link
 to="/spaces"
 className="p-6 bg-white rounded-xl shadow border border-gray-200 hover:border-[#9f3562]/30 flex items-center gap-4 sm:col-span-2"
 >
 <FaComments className="text-3xl text-[#9f3562]"/>
 <div>
 <h2 className="font-semibold text-gray-900">Space Management</h2>
 <p className="text-sm text-gray-600">Manage spaces, approve join requests, assign students</p>
 </div>
 </Link>
 </div>
 </div>
 </div>
 );
};

export default TeacherDashboard;
