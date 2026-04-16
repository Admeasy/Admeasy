import React, { useState, useEffect, useRef } from'react';
import { useParams, useNavigate, Link } from'react-router-dom';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';
import { Edit, MapPin, GraduationCap, BookOpen, MessagesSquare } from'lucide-react';
import { toast } from'react-toastify';
import SEO from'../components/SEO';
import PostCard from'../components/PostCard';
const fallbackProfilePic ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function UserProfile() {
 const { username } = useParams();
 const navigate = useNavigate();
 const { user: currentUser, isLoading: contextLoading } = useUser();
 const { mentor } = useMentor();
 const [user, setUser] = useState(null);
 const [profileImageUrl, setProfileImageUrl] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const isMountedRef = useRef(true);
 const [copied, setCopied] = useState(false);
 const [posts, setPosts] = useState([]);
 const [postsLoading, setPostsLoading] = useState(false);

 useEffect(() => {
 if (contextLoading) {
 return;
 }

 isMountedRef.current = true;

 const fetchUserProfile = async () => {
 setLoading(true);
 setError(null);
 setUser(null);
 setProfileImageUrl(null);

 try {
 let userData;
 const isOwnProfileCheck = !username || (currentUser && currentUser.username === username);

 if (isOwnProfileCheck && currentUser) {
 userData = currentUser;
 if (userData.imageUrl) {
 setProfileImageUrl(userData.imageUrl);
 } else if (userData.image) {
 try {
 const imageRes = await fetch('/api/users/me/pic', { credentials:'include'});
 if (imageRes.ok) {
 const imageUrl = await imageRes.json();
 if (imageUrl) {
 setProfileImageUrl(imageUrl);
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 } catch (err) {
 console.error('Error fetching profile image:', err);
 setProfileImageUrl(fallbackProfilePic);
 }
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 } else if (username) {
 const res = await fetch(`/api/users/username/${username}`);
 if (!res.ok) {
 throw new Error('User not found');
 }
 userData = await res.json();

 if (userData.image) {
 setProfileImageUrl(userData.image);
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 } else {
 throw new Error('No user data available');
 }

 if (isMountedRef.current) {
 setUser(userData);
 requestAnimationFrame(() => {
 if (isMountedRef.current) {
 setLoading(false);
 }
 });
 }
 } catch (err) {
 console.error('Error fetching user profile:', err);
 if (isMountedRef.current) {
 setError(err.message ||'Failed to load user profile');
 setLoading(false);
 }
 }
 };

 fetchUserProfile();

 return () => {
 isMountedRef.current = false;
 };
 }, [username, currentUser, contextLoading]);

 // Fetch posts when user is loaded
 useEffect(() => {
 if (!user || !user._id) return;

 const fetchPosts = async () => {
 setPostsLoading(true);
 try {
 const response = await fetch(`/api/posts/user/${user._id}?page=1&limit=10`, {
 credentials:'include',
 });

 if (!response.ok) {
 throw new Error('Failed to fetch posts');
 }

 const data = await response.json();
 if (data.success) {
 setPosts(data.posts);
 }
 } catch (err) {
 console.error('Error fetching posts:', err);
 } finally {
 setPostsLoading(false);
 }
 };

 fetchPosts();
 }, [user]);

 const handleShareProfile = async () => {
 const userUrl =`${window.location.origin}/users/${user.username || user._id}`;
 if (navigator.share) {
 try {
 await navigator.share({ title:`Share ${user.name}'s profile`, text: user.name, url: userUrl });
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch (err) {
 toast.error('Failed to share profile');
 }
 } else {
 await navigator.clipboard.writeText(userUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 if (loading || contextLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-gray-600">Loading profile...</p>
 </div>
 </div>
 );
 }

 if (error || !user) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center max-w-md mx-auto px-4">
 <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
 <p className="text-gray-600 mb-6">{error ||'The user profile you are looking for does not exist.'}</p>
 <Link
 to="/"
 className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
 >
 Go Home
 </Link>
 </div>
 </div>
 );
 }

 const userName = user.name || user.username ||'User';
 const userTitle =`${userName} | User @ Admeasy`;
 const userDescription = user.institute
 ?`${userName}${user.course ?`- ${user.course}`:''} from ${user.institute}. Connect with students on Admeasy.`
 :`Connect with ${userName}${user.course ?`- ${user.course}`:''}. Get real insights and guidance from verified mentors on Admeasy.`;

 const userKeywords = [
 userName,
 user.username,
'user',
'student',
'admeasy',
 user.institute,
 user.course
 ].filter(Boolean).join(',');

 const userImage = profileImageUrl ||'https://admeasy.in/LOGO.webp';
 const userUrl =`https://admeasy.in/users/${user.username || user._id}`;

 const isOwnProfile = currentUser && (currentUser._id === user._id || currentUser.username === user.username);

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
 <SEO
 title={userTitle}
 description={userDescription}
 keywords={userKeywords}
 image={userImage}
 url={userUrl} />
 
 {/* Main Container with max width */}
 <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
 {/* Profile Card - Instagram Style */}
 <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
 {/* Cover Background */}
 <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200"></div>

 
 {/* Profile Content */}
 <div className="px-4 sm:px-6 pb-6">
 {/* Profile Image - Overlapping cover */}
 <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-4">
 <div className="relative">
 <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
 <img
 src={profileImageUrl || fallbackProfilePic}
 alt={user.name || user.username ||'Profile'}
 className="w-full h-full object-cover"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 </div>
 {/* Online Status Indicator */}
 <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-3 border-white"></div>
 </div>
 
 {/* Action Buttons */}
 {isOwnProfile && (
 <div className="flex gap-2 mt-2">
 <Link
 to="/me/edit"
 className="px-4 sm:px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm text-gray-800 transition-colors flex items-center gap-2"
 >
 <Edit size={16} />
 <span className="hidden sm:inline">Edit</span>
 </Link>

 {/* Share button */}
 <button
 onClick={handleShareProfile}
 className="
 inline-flex items-center gap-2
 rounded-xl border border-slate-200
 bg-white px-4 py-2
 text-sm font-medium text-slate-700
 shadow-sm
 transition-all
 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600
 active:scale-95
"
 >
 {/* Icon */}
 <svg
 className="h-4 w-4"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m6.632 2.684C15.114 13.062 15 12.518 15 12s.114-1.062.316-1.342M12 3v9m0 0l-3-3m3 3l3-3m-9 9a2 2 0 002 2h8a2 2 0 002-2"
 />
 </svg>

 {copied ?"Shared🎉":"Share"}
 </button>
 </div>
 )}
 </div>

 {/* Profile Info */}
 <div className="space-y-3">
 {/* Name and Username */}
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name || user.username}</h1>
 {user.name && user.username && (
 <p className="text-sm sm:text-base text-gray-500">@{user.username}</p>
 )}
 </div>

 {/* Education Info */}
 <div className="space-y-2">
 {user.course && (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <GraduationCap size={18} className="text-blue-500 flex-shrink-0"/>
 <span>{user.course}</span>
 </div>
 )}
 {user.institute && (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <MapPin size={18} className="text-red-500 flex-shrink-0"/>
 <span>{user.institute}</span>
 </div>
 )}
 </div>

 {/* Action Button for Non-Owners (if mentor viewing) */}
 {!isOwnProfile && mentor && (
 <button
 onClick={() => navigate(`/chats/${mentor._id}`)}
 className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-md"
 >
 <MessagesSquare size={20} />
 Message
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Exams Preparing For Section */}
 {user.examsPreparingFor && user.examsPreparingFor.length > 0 && (
 <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
 <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
 <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
 <BookOpen className="text-white"size={24} />
 </div>
 <div>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900">Exams Preparing For</h2>
 <p className="text-xs sm:text-sm text-gray-500">{user.examsPreparingFor.length} exam{user.examsPreparingFor.length !== 1 ?'s':''}</p>
 </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
 {user.examsPreparingFor.map((exam, index) => (
 <div
 key={index}
 className="group relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border-2 border-transparent hover:border-purple-300 transition-all duration-300 cursor-default hover:shadow-lg"
 >
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preparing</span>
 </div>
 <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
 {exam}
 </h3>
 </div>
 <BookOpen className="text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity"size={24} />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Posts Section */}
 <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
 <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
 <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
 <MessagesSquare className="text-white"size={24} />
 </div>
 <div>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900">Posts</h2>
 <p className="text-xs sm:text-sm text-gray-500">
 {postsLoading ?'Loading...':`${posts.length} post${posts.length !== 1 ?'s':''}`}
 </p>
 </div>
 </div>

 {postsLoading ? (
 <div className="flex justify-center items-center py-12">
 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : posts.length > 0 ? (
 <div className="space-y-4">
 {posts.map((post) => (
 <PostCard key={post._id} post={post} />
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
 <p className="text-sm text-gray-500">
 {isOwnProfile ?'Start sharing your thoughts and experiences!':'This user hasn\'t posted anything yet.'}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

