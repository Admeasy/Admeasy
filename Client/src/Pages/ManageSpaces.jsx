import { useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import { FaArrowLeft, FaSearch, FaTrash, FaUsers, FaComments } from'react-icons/fa';
import { ToastContainer, toast } from'react-toastify';
import'react-toastify/dist/ReactToastify.css';
import { getAdminAuthHeaders } from'../utils/adminAuth';

const ManageSpaces = () => {
 const navigate = useNavigate();
 const [spaces, setSpaces] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [deletingSpaceId, setDeletingSpaceId] = useState(null);

 useEffect(() => {
 verifyAuthAndFetch();
 }, []);

 const verifyAuthAndFetch = async () => {
 try {
 const res = await fetch('/api/admin/verify', {
 credentials:'include',
 headers: getAdminAuthHeaders()
 });
 if (!res.ok) {
 throw new Error('Not authenticated');
 }
 await fetchSpaces();
 } catch (err) {
 console.error('Admin auth failed:', err);
 navigate('/admin');
 }
 };

 const fetchSpaces = async () => {
 try {
 setIsLoading(true);
 const res = await fetch('/api/spaces/admin', {
 credentials:'include',
 headers: getAdminAuthHeaders()
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message ||'Failed to fetch spaces');
 }
 setSpaces(data.spaces || []);
 } catch (err) {
 console.error('Error fetching spaces (admin):', err);
 toast.error(err.message ||'Failed to load spaces');
 } finally {
 setIsLoading(false);
 }
 };

 const handleDelete = async (spaceId) => {
 if (!window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
 return;
 }
 setDeletingSpaceId(spaceId);
 try {
 const res = await fetch(`/api/spaces/admin/${spaceId}`, {
 method:'DELETE',
 credentials:'include',
 headers: getAdminAuthHeaders()
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message ||'Failed to delete space');
 }
 toast.success('Space deleted successfully');
 setSpaces((prev) => prev.filter((s) => s._id !== spaceId));
 } catch (err) {
 console.error('Error deleting space (admin):', err);
 toast.error(err.message ||'Failed to delete space');
 } finally {
 setDeletingSpaceId(null);
 }
 };

 const filteredSpaces = spaces.filter((space) => {
 const q = searchQuery.toLowerCase();
 return (
 (space.name ||'').toLowerCase().includes(q) ||
 (space.description ||'').toLowerCase().includes(q) ||
 (space.creator?.name ||'').toLowerCase().includes(q) ||
 (space.creator?.username ||'').toLowerCase().includes(q)
 );
 });

 const formatDateTime = (iso) => {
 if (!iso) return'';
 try {
 return new Date(iso).toLocaleString();
 } catch {
 return iso;
 }
 };

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse"/>
 <div
 className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"
 style={{ animationDelay:'1s'}}
 />
 <div className="relative z-10">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 </div>
 );
 }

 return (
 <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 {/* Enhanced Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div
 className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"
 style={{ animationDuration:'8s'}}
 />
 <div
 className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
 style={{ animationDuration:'10s'}}
 />
 <div
 className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"
 style={{ animationDuration:'6s'}}
 />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"/>
 </div>

 <button
 className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]"
 onClick={() => navigate(-1)}
 >
 <FaArrowLeft />
 Back
 </button>

 <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
 Manage Spaces
 </h1>

 <ToastContainer position="top-right"autoClose={3000} />

 <div className="max-w-6xl mx-auto relative z-10">
 <div className="relative mb-6">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <FaSearch className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="text"
 placeholder="Search by space name, description, or creator..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
 />
 </div>

 {filteredSpaces.length === 0 && (
 <div className="flex items-center justify-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <p className="text-gray-700 font-bold text-lg">No spaces found.</p>
 </div>
 )}

 <ul className="space-y-4">
 {filteredSpaces.map((space) => (
 <li
 key={space._id}
 className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
 >
 <div className="flex items-start gap-4 flex-1">
 {space.logo ? (
 <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
 <img
 src={space.logo}
 alt={space.name}
 className="w-full h-full object-cover"
 />
 </div>
 ) : (
 <div className="w-14 h-14 rounded-xl bg-[#9f3562]/10 text-[#9f3562] flex items-center justify-center font-bold text-xl flex-shrink-0">
 {(space.name ||'S').charAt(0).toUpperCase()}
 </div>
 )}
 <div className="space-y-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <p className="text-lg font-semibold text-gray-900 truncate">
 {space.name}
 </p>
 <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
 <FaUsers className="mr-1"/>
 {space.membersCount || 0} members
 </span>
 <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
 <FaComments className="mr-1"/>
 {space.messagesCount || 0} messages
 </span>
 </div>
 {space.creator && (
 <p className="text-xs text-gray-500">
 Created by{''}
 <span className="font-medium text-gray-700">
 {space.creator.name || space.creator.username ||'Unknown'}
 </span>
 </p>
 )}
 <p className="text-sm text-gray-600 line-clamp-2">
 {space.description ||'No description provided.'}
 </p>
 <p className="text-xs text-gray-400">
 Created at: {formatDateTime(space.createdAt)}
 </p>
 </div>
 </div>

 <div className="flex sm:flex-col gap-2 sm:items-end">
 <a href={`/spaces/${space._id}`} target="_blank"rel="noopener noreferrer"
 className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:text-[#9f3562] hover:border-[#9f3562]/40 bg-white/80 hover:bg-white transition-all duration-300 hover:scale-105 active:scale-95"
 >
 View Space
 </a>
 <button
 onClick={() => handleDelete(space._id)}
 disabled={deletingSpaceId === space._id}
 className={`px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
 deletingSpaceId === space._id
 ?'bg-gray-400 cursor-not-allowed'
 :'bg-red-500 hover:bg-red-600'
 }`}
 >
 <FaTrash />
 {deletingSpaceId === space._id ?'Deleting...':'Delete'}
 </button>
 </div>
 </li>
 ))}
 </ul>
 </div>
 </main>
 );
};

export default ManageSpaces;

