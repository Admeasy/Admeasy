import { useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import { FaArrowLeft, FaPlus, FaSearch, FaSchool } from'react-icons/fa';
import { ToastContainer, toast } from'react-toastify';
import'react-toastify/dist/ReactToastify.css';
import { getAdminAuthHeaders } from'../utils/adminAuth';

const ManageSchools = () => {
 const navigate = useNavigate();
 const [schools, setSchools] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [showCreate, setShowCreate] = useState(false);
 const [creating, setCreating] = useState(false);
 const [form, setForm] = useState({
 schoolName:'',
 city:'',
 board:'',
 adminEmail:'',
 password:'',
 schoolCode:'',
 });

 useEffect(() => {
 verifyAuthAndFetch();
 }, []);

 const verifyAuthAndFetch = async () => {
 try {
 const res = await fetch('/api/admin/verify', {
 credentials:'include',
 headers: getAdminAuthHeaders(),
 });
 if (!res.ok) throw new Error('Not authenticated');
 await fetchSchools();
 } catch (err) {
 navigate('/admin');
 }
 };

 const fetchSchools = async () => {
 try {
 setIsLoading(true);
 const res = await fetch('/api/admin/schools', {
 credentials:'include',
 headers: getAdminAuthHeaders(),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||'Failed to fetch schools');
 setSchools(data.schools || []);
 } catch (err) {
 toast.error(err.message ||'Failed to load schools');
 } finally {
 setIsLoading(false);
 }
 };

 const handleCreate = async (e) => {
 e.preventDefault();
 if (!form.schoolName.trim() || !form.adminEmail.trim() || !form.password.trim()) {
 toast.error('School name, admin email, and password are required');
 return;
 }
 setCreating(true);
 try {
 const res = await fetch('/api/schools/create', {
 method:'POST',
 credentials:'include',
 headers: getAdminAuthHeaders({'Content-Type':'application/json'}),
 body: JSON.stringify({
 schoolName: form.schoolName.trim(),
 city: form.city.trim() || undefined,
 board: form.board.trim() || undefined,
 adminEmail: form.adminEmail.trim(),
 password: form.password,
 schoolCode: form.schoolCode.trim() || undefined,
 }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||'Failed to create school');
 toast.success(`School created! Code: ${data.school?.schoolCode}. Share credentials manually.`);
 setForm({ schoolName:'', city:'', board:'', adminEmail:'', password:'', schoolCode:''});
 setShowCreate(false);
 await fetchSchools();
 } catch (err) {
 toast.error(err.message ||'Failed to create school');
 } finally {
 setCreating(false);
 }
 };

 const filteredSchools = schools.filter((s) => {
 const q = searchQuery.toLowerCase();
 return (
 (s.schoolName ||'').toLowerCase().includes(q) ||
 (s.schoolCode ||'').toLowerCase().includes(q) ||
 (s.adminEmail ||'').toLowerCase().includes(q) ||
 (s.city ||'').toLowerCase().includes(q)
 );
 });

 const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() :'');

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 return (
 <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8">
 <button
 className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#9f3562]/30 text-gray-700"
 onClick={() => navigate(-1)}
 >
 <FaArrowLeft /> Back
 </button>

 <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Manage Schools</h1>

 <ToastContainer position="top-right"autoClose={3000} />

 <div className="max-w-4xl mx-auto">
 <div className="flex flex-col sm:flex-row gap-4 mb-6">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input
 type="text"
 placeholder="Search by name, code, email, city..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9f3562]/50"
 />
 </div>
 <button
 onClick={() => setShowCreate(true)}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-[#9f3562] text-white rounded-xl hover:bg-[#b14270] transition-colors"
 >
 <FaPlus /> Create School
 </button>
 </div>

 {showCreate && (
 <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
 <h2 className="text-xl font-semibold mb-4">Create School</h2>
 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
 <input
 type="text"
 value={form.schoolName}
 onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
 className="w-full px-4 py-2 border rounded-lg"
 required
 />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
 <input
 type="text"
 value={form.city}
 onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
 className="w-full px-4 py-2 border rounded-lg"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
 <input
 type="text"
 value={form.board}
 onChange={(e) => setForm((f) => ({ ...f, board: e.target.value }))}
 className="w-full px-4 py-2 border rounded-lg"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
 <input
 type="email"
 value={form.adminEmail}
 onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
 className="w-full px-4 py-2 border rounded-lg"
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
 <input
 type="password"
 value={form.password}
 onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
 className="w-full px-4 py-2 border rounded-lg"
 required
 minLength={6}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 School Code (optional, e.g. AA00001)
 </label>
 <input
 type="text"
 value={form.schoolCode}
 onChange={(e) => setForm((f) => ({ ...f, schoolCode: e.target.value.toUpperCase() }))}
 placeholder="AA00001"
 className="w-full px-4 py-2 border rounded-lg"
 maxLength={7}
 />
 </div>
 <div className="flex gap-3">
 <button
 type="submit"
 disabled={creating}
 className="px-6 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b14270] disabled:opacity-70"
 >
 {creating ?'Creating...':'Create'}
 </button>
 <button
 type="button"
 onClick={() => setShowCreate(false)}
 className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
 >
 Cancel
 </button>
 </div>
 </form>
 </div>
 )}

 {filteredSchools.length === 0 ? (
 <div className="py-12 text-center bg-white rounded-xl border border-gray-200">
 <FaSchool className="mx-auto text-4xl text-gray-400 mb-4"/>
 <p className="text-gray-600">No schools found.</p>
 </div>
 ) : (
 <ul className="space-y-4">
 {filteredSchools.map((school) => (
 <li
 key={school._id}
 className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
 >
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-[#9f3562]/10 text-[#9f3562] flex items-center justify-center font-bold text-xl">
 <FaSchool />
 </div>
 <div>
 <p className="font-semibold text-gray-900">{school.schoolName}</p>
 <p className="text-sm text-gray-600">
 Code: <span className="font-mono font-medium">{school.schoolCode}</span>
 </p>
 <p className="text-sm text-gray-500">{school.adminEmail}</p>
 {(school.city || school.board) && (
 <p className="text-xs text-gray-400">
 {[school.city, school.board].filter(Boolean).join('•')}
 </p>
 )}
 <p className="text-xs text-gray-400 mt-1">
 Created: {formatDate(school.createdAt)}
 </p>
 </div>
 </div>
 <a
 href={`/school-login`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-[#9f3562] hover:underline"
 >
 School Login →
 </a>
 </li>
 ))}
 </ul>
 )}
 </div>
 </main>
 );
};

export default ManageSchools;
