import { useState } from'react';
import { useNavigate } from'react-router-dom';
import { FaSchool, FaLock, FaUser } from'react-icons/fa';
import { ToastContainer, toast } from'react-toastify';
import'react-toastify/dist/ReactToastify.css';
import { setSchoolToken } from'../utils/schoolAuth';

const SchoolLogin = () => {
 const navigate = useNavigate();
 const [tab, setTab] = useState('school'); //'school'|'teacher'
 const [loading, setLoading] = useState(false);
 const [schoolForm, setSchoolForm] = useState({ schoolCode:'', password:''});
 const [teacherForm, setTeacherForm] = useState({ schoolCode:'', email:'', password:''});
 const [error, setError] = useState('');

 const handleSchoolLogin = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);
 try {
 const res = await fetch('/api/schools/login', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 credentials:'include',
 body: JSON.stringify({
 schoolCode: schoolForm.schoolCode.trim().toUpperCase(),
 password: schoolForm.password,
 }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||'Login failed');
 if (data.token) setSchoolToken(data.token);
 toast.success('Logged in successfully');
 navigate('/school/dashboard');
 } catch (err) {
 setError(err.message ||'Login failed');
 } finally {
 setLoading(false);
 }
 };

 const handleTeacherLogin = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);
 try {
 const res = await fetch('/api/teachers/login', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 credentials:'include',
 body: JSON.stringify({
 schoolCode: teacherForm.schoolCode.trim().toUpperCase(),
 email: teacherForm.email.trim().toLowerCase(),
 password: teacherForm.password,
 }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||'Login failed');
 if (data.token) setSchoolToken(data.token);
 toast.success('Logged in successfully');
 navigate('/school/teacher/dashboard');
 } catch (err) {
 setError(err.message ||'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
 <div className="flex items-center justify-center gap-2 mb-8">
 <FaSchool className="text-3xl text-[#9f3562]"/>
 <h1 className="text-2xl font-bold text-gray-900">School Login</h1>
 </div>

 <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
 <button
 type="button"
 onClick={() => { setTab('school'); setError(''); }}
 className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
 tab ==='school'?'bg-white shadow text-[#9f3562]':'text-gray-600 hover:text-gray-900'
 }`}
 >
 School Admin
 </button>
 <button
 type="button"
 onClick={() => { setTab('teacher'); setError(''); }}
 className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
 tab ==='teacher'?'bg-white shadow text-[#9f3562]':'text-gray-600 hover:text-gray-900'
 }`}
 >
 Teacher
 </button>
 </div>

 {error && (
 <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
 )}

 {tab ==='school'? (
 <form onSubmit={handleSchoolLogin} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
 <div className="relative">
 <FaSchool className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="text"
 value={schoolForm.schoolCode}
 onChange={(e) => setSchoolForm((f) => ({ ...f, schoolCode: e.target.value }))}
 placeholder="AA00001"
 className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
 <div className="relative">
 <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="password"
 value={schoolForm.password}
 onChange={(e) => setSchoolForm((f) => ({ ...f, password: e.target.value }))}
 className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 bg-[#9f3562] text-white rounded-xl font-medium hover:bg-[#b14270] disabled:opacity-70"
 >
 {loading ?'Logging in...':'Login'}
 </button>
 </form>
 ) : (
 <form onSubmit={handleTeacherLogin} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
 <div className="relative">
 <FaSchool className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="text"
 value={teacherForm.schoolCode}
 onChange={(e) => setTeacherForm((f) => ({ ...f, schoolCode: e.target.value }))}
 placeholder="AA00001"
 className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
 <div className="relative">
 <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="email"
 value={teacherForm.email}
 onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))}
 className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
 <div className="relative">
 <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="password"
 value={teacherForm.password}
 onChange={(e) => setTeacherForm((f) => ({ ...f, password: e.target.value }))}
 className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 required
 />
 </div>
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 bg-[#9f3562] text-white rounded-xl font-medium hover:bg-[#b14270] disabled:opacity-70"
 >
 {loading ?'Logging in...':'Login'}
 </button>
 </form>
 )}

 <p className="mt-6 text-center text-sm text-gray-500">
 <a href="/"className="text-[#9f3562] hover:underline">← Back to Admeasy</a>
 </p>
 </div>
 </div>
 <ToastContainer position="top-right"autoClose={3000} />
 </div>
 );
};

export default SchoolLogin;
