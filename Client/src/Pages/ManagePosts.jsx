import { useEffect, useState } from"react";
import { useNavigate } from"react-router-dom";
import { FaArrowLeft, FaSearch, FaTrash, FaUser } from"react-icons/fa";
import { ToastContainer, toast } from"react-toastify";
import"react-toastify/dist/ReactToastify.css";
import { processMentions } from"../utils/processMentions";
import { getAdminAuthHeaders } from"../utils/adminAuth";

const ManagePosts = () => {
 const navigate = useNavigate();
 const [posts, setPosts] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [deletingPostId, setDeletingPostId] = useState(null);
 const [showImageModal, setShowImageModal] = useState(false);
 const [imageModal, setImageModal] = useState(null);
 const [postCount, setPostCount] = useState(0);

 useEffect(() => {
 verifyAuth();
 }, []);

 const verifyAuth = async () => {
 try {
 const res = await fetch("/api/admin/verify", {
 credentials:"include",
 headers: getAdminAuthHeaders()
 });
 if (!res.ok) {
 throw new Error("Not authenticated");
 }
 await fetchPosts();
 } catch (err) {
 console.error("Admin auth failed:", err);
 navigate("/admin");
 }
 };

 const fetchPosts = async () => {
 try {
 setIsLoading(true);
 const res = await fetch("/api/posts/admin", {
 credentials:"include",
 headers: getAdminAuthHeaders()
 });
 if (!res.ok) throw new Error("Failed to fetch posts");
 const data = await res.json();
 if (!data.success) {
 throw new Error(data.message ||"Failed to fetch posts");
 }
 setPosts(data.posts || []);
 } catch (err) {
 console.error(err);
 toast.error(err.message ||"Failed to load posts");
 } finally {
 setIsLoading(false);
 }
 };

 const handleDelete = async (postId) => {
 if (!window.confirm("Are you sure you want to delete this post?")) return;

 setDeletingPostId(postId);
 try {
 const res = await fetch(`/api/posts/admin/${postId}`, {
 method:"DELETE",
 credentials:"include",
 headers: getAdminAuthHeaders()
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message ||"Failed to delete post");
 }
 toast.success("Post deleted successfully");
 setPosts((prev) => prev.filter((p) => p._id !== postId));
 } catch (err) {
 console.error(err);
 toast.error(err.message ||"Failed to delete post");
 } finally {
 setDeletingPostId(null);
 }
 };

 const filteredPosts = posts.filter((post) => {
 const authorName = post.author?.name ||"";
 const authorUsername = post.author?.username ||"";
 const contentText = (post.content ||"").replace(/<[^>]+>/g,"");
 const q = searchQuery.toLowerCase();
 return (
 authorName.toLowerCase().includes(q) ||
 authorUsername.toLowerCase().includes(q) ||
 contentText.toLowerCase().includes(q)
 );
 });

 useEffect(() => {
 setPostCount(filteredPosts.length);
 }, [filteredPosts]);

 const formatDateTime = (iso) => {
 if (!iso) return"";
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
 style={{ animationDelay:"1s"}}
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
 style={{ animationDuration:"8s"}}
 />
 <div
 className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
 style={{ animationDuration:"10s"}}
 />
 <div
 className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"
 style={{ animationDuration:"6s"}}
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
 Manage Posts
 </h1>

 <ToastContainer position="top-right"autoClose={3000} />

 <div className="max-w-6xl mx-auto relative z-10">
 <div className="relative mb-6">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <FaSearch className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="text"
 placeholder="Search by author or content..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
 />
 </div>

 <div className="flex items-center justify-center mb-6">
 <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 flex flex-col items-center w-64 border border-gray-200 hover:border-[#9f3562]/30 transition-all duration-300">
 <h2 className="text-xl font-bold text-gray-800">Total Posts</h2>
 <p className="text-3xl font-extrabold text-[#9f3562] mt-1">
 {postCount}
 </p>
 </div>
 </div>

 {filteredPosts.length === 0 && (
 <div className="flex items-center justify-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <p className="text-gray-700 font-bold text-lg">
 No posts found.
 </p>
 </div>
 )}

 <ul className="space-y-4">
 {filteredPosts.map((post) => (
 <li
 key={post._id}
 className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30"
 >
 <div className="flex items-start justify-between gap-4 mb-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
 {post.author?.image ? (
 <img
 src={post.author.image}
 alt={post.author.name ||"Author"}
 className="w-full h-full object-cover"
 />
 ) : (
 <FaUser className="text-gray-500"/> 
 )}
 </div>
 <div>
 <p
 className="font-semibold text-gray-900 cursor-pointer hover:text-[#9f3562] transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 if (post.author?.username) {
 navigate(`/${post.author.username}`);
 }
 }}
 >
 {post.author?.name ||"Unknown"}
 </p>
 {post.author?.username && ( 
 <p
 className="text-sm text-gray-500 cursor-pointer hover:text-[#9f3562] transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/${post.author.username}`);
 }}
 >
 @{post.author.username}
 </p>
 )}
 {post.author?.role && (
 <p className="text-xs text-gray-500 capitalize">
 {post.author.role}
 </p>
 )}
 </div>
 </div>
 <div className="text-sm text-gray-500 whitespace-nowrap">
 {formatDateTime(post.createdAt)}
 </div>
 </div>

 <div className="text-sm text-gray-800 mb-3">
 <div
 className="prose prose-sm max-w-none"
 dangerouslySetInnerHTML={{
 __html: processMentions(post.content ||""),
 }}
 onClick={(e) => {
 // Handle mention link clicks
 const mentionLink = e.target.closest('a.mention-link');
 if (mentionLink) {
 e.preventDefault();
 e.stopPropagation();
 const username = mentionLink.getAttribute('data-username');
 if (username) {
 navigate(`/${username}`);
 }
 return;
 }
 }}
 />
 </div>

 {post.image && (
 <div className="mt-3 mb-3">
 <img
 src={post.image}
 alt="Post"
 className="max-h-48 w-full object-contain rounded-lg border border-gray-200 cursor-pointer"
 onClick={() => {
 setShowImageModal(true);
 setImageModal(post.image);
 }}
 />
 </div>
 )}

 <div className="flex justify-end">
 <button
 onClick={() => handleDelete(post._id)}
 disabled={deletingPostId === post._id}
 className={`px-4 sm:px-6 py-2 flex items-center gap-2 rounded-xl text-white text-sm sm:text-base transition-all duration-300 hover:scale-105 active:scale-95 ${
 deletingPostId === post._id
 ?"bg-gray-400 cursor-not-allowed"
 :"bg-red-500 hover:bg-red-600"
 }`}
 >
 <FaTrash />
 {deletingPostId === post._id ?"Deleting...":"Delete"}
 </button>
 </div>
 </li>
 ))}
 </ul>
 </div>
 {showImageModal && (
 <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
 <img src={imageModal} alt="Post"className="h-6/10 object-contain rounded-lg border border-gray-200"/>
 <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[#9f3562] text-4xl font-bold transition-colors">×</button>
 </div>
 )}
 </main>
 );
};

export default ManagePosts;

