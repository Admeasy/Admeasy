import { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { FaArrowLeft, FaUserPlus } from'react-icons/fa';
import { ToastContainer, toast } from'react-toastify';
import'react-toastify/dist/ReactToastify.css';
import { getSchoolAuthHeaders } from'../utils/schoolAuth';

const AddTeacher = () => {
 const navigate = useNavigate();
 const [school, setSchool] = useState(null);
 const [email, setEmail] = useState('');
 const [name, setName] = useState('');
 const [loading, setLoading] = useState(false);
 const [created, setCreated] = useState(null);

 useEffect(() => {
 fetchMe();
 }, []);

 const fetchMe = async () => {
 try {
 const res = await fetch('/api/schools/me', {
 credentials:'include',
 headers: getSchoolAuthHeaders(),
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 navigate('/school-login');
 return;
 }
 if (data.role !=='school_admin') {
 toast.error('Only school admin can add teachers');
 navigate('/school/dashboard');
 return;
 }
 setSchool(data.school);
 } catch (err) {
 navigate('/school-login');
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!email.trim()) {
 toast.error('Email is required');
 return;
 }
 setLoading(true);
 setCreated(null);
 try {
 const res = await fetch('/api/schools/add-teacher', {
 method:'POST',
 credentials:'include',
 headers: getSchoolAuthHeaders({'Content-Type':'application/json'}),
 body: JSON.stringify({ email: email.trim(), name: name.trim() }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||'Failed to add teacher');
 setCreated(data.teacher);
 setEmail('');
 setName('');
 toast.success('Teacher added! Share the invite link.');
 } catch (err) {
 toast.error(err.message ||'Failed to add teacher');
 } finally {
 setLoading(false);
 }
 };

 if (!school) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 p-6">
 <button
 onClick={() => navigate('/school/dashboard')}
 className="flex items-center gap-2 mb-6 text-gray-700 hover:text-[#9f3562]"
 >
 <FaArrowLeft /> Back
 </button>

 <div className="max-w-md mx-auto">
 <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
 <FaUserPlus className="text-[#9f3562]"/>
 Add Teacher
 </h1>

 {created && (
 <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
 <p className="font-medium text-green-800">Invite link (share manually):</p>
 <a
 href={created.inviteLink}
 target="_blank"
 rel="noopener noreferrer"
 className="block mt-2 text-sm text-[#9f3562] break-all hover:underline"
 >
 {created.inviteLink}
 </a>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 />
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 bg-[#9f3562] text-white rounded-xl font-medium hover:bg-[#b14270] disabled:opacity-70"
 >
 {loading ?'Adding...':'Add Teacher'}
 </button>
 </form>
 </div>

 <ToastContainer />
 </div>
 );
};

export default AddTeacher;
