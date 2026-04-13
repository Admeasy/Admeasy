import React, { useState, useEffect, useRef } from'react';
import { useParams, useNavigate, Link, useLocation } from'react-router-dom';
import { useMentor } from'../context/MentorContext';
import { useUser } from'../context/UserContext';
import { Edit, MapPin, GraduationCap, Award, MessagesSquare, BookOpen, Trophy, CreditCard, UserPlus, UserCheck, MoreVertical, LogOut, Repeat, FileText, Calendar, ArrowLeft } from'lucide-react';
import { motion, AnimatePresence } from'framer-motion';
import { toast } from'react-toastify';
import SEO from'../components/SEO';
import PostCard from'../components/PostCard';
import NotesCard from'../components/NotesCard';
import FollowersFollowingModal from'../components/FollowersFollowingModal';
import AdvertiserProfile from'./AdvertiserProfile';
import { useProfileCompletion } from'../hooks/useProfileCompletion';
import ProfileCompletionCircle from'../components/ProfileCompletionCircle';

const fallbackProfilePic ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function Profile() {
 const { username } = useParams();
 const navigate = useNavigate();
 const location = useLocation();

 useEffect(() => {
 window.scrollTo(0, 0);
 }, [location]);

 const { mentor: currentMentor, isLoading: mentorLoading } = useMentor();
 const { user: currentUser, isLoading: userLoading, logoutCurrentAccount, setUser } = useUser();


 // Redirect to /me if viewing own profile via /:username route to prevent double history entries
 // Only redirect if we have username param and we're not already on /me
 useEffect(() => {
 // Wait for user/mentor data to load before checking
 if (mentorLoading || userLoading) return;

 if (username && location.pathname !=='/me') {
 const isOwnProfile =
 (currentMentor && currentMentor.username === username) ||
 (currentUser && currentUser.username === username);

 if (isOwnProfile) {
 navigate('/me', { replace: true });
 }
 }
 }, [username, currentMentor, currentUser, location.pathname, navigate, mentorLoading, userLoading]);
 const [profile, setProfile] = useState(null);
 const [profileType, setProfileType] = useState(null); //'mentor','user', or'advertiser'
 const [profileImageUrl, setProfileImageUrl] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const isMountedRef = useRef(true);
 const [copied, setCopied] = useState(false);
 const [posts, setPosts] = useState([]);
 const [allPosts, setAllPosts] = useState([]); // Store all posts
 const [showAllPosts, setShowAllPosts] = useState(false); // Track if showing all posts
 const [totalPostsCount, setTotalPostsCount] = useState(0); // Total number of posts
 const [postsLoading, setPostsLoading] = useState(false);
 const [postsPage, setPostsPage] = useState(1);
 const [hasMorePosts, setHasMorePosts] = useState(true);

 // New State for Tabs and Reposts
 const [activeTab, setActiveTab] = useState('posts');
 const [reposts, setReposts] = useState([]);
 const [repostsLoading, setRepostsLoading] = useState(false);
 const [notes, setNotes] = useState([]);
 const [notesLoading, setNotesLoading] = useState(false);
 const [isFollowing, setIsFollowing] = useState(false);
 const [isFollowingLoading, setIsFollowingLoading] = useState(false);
 const [followersCount, setFollowersCount] = useState(0);
 const [followingCount, setFollowingCount] = useState(0);
 const [followersCountLoading, setFollowersCountLoading] = useState(true);
 const [followingCountLoading, setFollowingCountLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [modalType, setModalType] = useState('followers'); //'followers'or'following'

 const [showMenu, setShowMenu] = useState(false);
 const menuRef = useRef(null);
 const { setMentor } = useMentor();
 const postsSectionRef = useRef(null);
 const completion = useProfileCompletion();

 const handlePostUpdate = (updatedPost) => {
 setPosts(prev => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
 setAllPosts(prev => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
 setReposts(prev => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
 };

 const handleScrollToPosts = () => {
 postsSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start'});
 };

 const handleLogout = async () => {
 setShowMenu(false);
 const isMentor = !!currentMentor;
 if (isMentor) {
 try {
 const res = await fetch('/api/mentors/logout', { method:'POST', credentials:'include'});
 if (res.ok) {
 if (setMentor) setMentor(null);
 localStorage.removeItem('admeasy:mentor');
 toast.success('Logged out successfully');
 window.location.href ='/';
 } else {
 toast.error('Failed to logout');
 }
 } catch (err) {
 console.error('Logout failed:', err);
 toast.error('Failed to logout');
 }
 return;
 }
 try {
 await logoutCurrentAccount();
 toast.success('Logged out successfully');
 } catch (err) {
 console.error('Logout failed:', err);
 toast.error('Failed to logout');
 }
 };

 // Close menu when clicking outside
 useEffect(() => {
 const handleClickOutside = (event) => {
 if (menuRef.current && !menuRef.current.contains(event.target)) {
 setShowMenu(false);
 }
 };

 if (showMenu) {
 document.addEventListener('mousedown', handleClickOutside);
 }

 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }, [showMenu]);

 useEffect(() => {
 if (mentorLoading || userLoading) {
 return;
 }

 isMountedRef.current = true;

 const fetchProfile = async () => {
 setLoading(true);
 setError(null);
 setProfile(null);
 setProfileImageUrl(null);

 try {
 let profileData;
 let profileTypeData;
 const isOwnProfileCheck = !username ||
 (currentMentor && currentMentor.username === username) ||
 (currentUser && currentUser.username === username);

 // If viewing own profile, use context data
 if (isOwnProfileCheck && currentMentor) {
 profileData = currentMentor;
 profileTypeData ='mentor';
 if (profileData.imageUrl) {
 setProfileImageUrl(profileData.imageUrl);
 } else if (profileData.image) {
 try {
 const imageRes = await fetch('/api/mentors/me/pic', { credentials:'include'});
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
 } else if (isOwnProfileCheck && currentUser) {
 profileData = currentUser;
 profileTypeData ='user';
 if (profileData.imageUrl) {
 setProfileImageUrl(profileData.imageUrl);
 } else if (profileData.image) {
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
 // Fetch profile using unified route
 const res = await fetch(`/api/profile/${username}`);
 if (!res.ok) {
 throw new Error('Profile not found');
 }
 const data = await res.json();
 profileData = data.profile;
 profileTypeData = data.type;

 if (profileTypeData ==='mentor') {
 if (profileData.image) {
 try {
 const imageRes = await fetch(`/api/mentors/${profileData._id}/pic`);
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
 } else if (profileTypeData ==='advertiser') {
 // Advertiser profile
 if (profileData.image) {
 setProfileImageUrl(profileData.image);
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 } else {
 // User profile
 if (profileData.image) {
 setProfileImageUrl(profileData.image);
 } else {
 setProfileImageUrl(fallbackProfilePic);
 }
 }
 } else {
 throw new Error('No profile data available');
 }

 if (isMountedRef.current) {
 setProfile(profileData);
 setProfileType(profileTypeData);
 requestAnimationFrame(() => {
 if (isMountedRef.current) {
 setLoading(false);
 }
 });
 }
 } catch (err) {
 console.error('Error fetching profile:', err);
 if (isMountedRef.current) {
 setError(err.message ||'Failed to load profile');
 setLoading(false);
 }
 }
 };

 fetchProfile();

 return () => {
 isMountedRef.current = false;
 };
 }, [username, currentMentor, currentUser, mentorLoading, userLoading]);

 // Fetch posts when profile is loaded
 useEffect(() => {
 if (!profile || !profile._id) return;

 const fetchPosts = async (limit = 10) => {
 if (profileType ==='advertiser') {
 // Advertisers don't have posts, they have ads
 setPostsLoading(false);
 return;
 }

 setPostsLoading(true);
 try {
 const endpoint = profileType ==='mentor'
 ?`/api/posts/mentor/${profile._id}`
 :`/api/posts/user/${profile._id}`;

 const response = await fetch(`${endpoint}?page=1&limit=${limit}`, {
 credentials:'include',
 });

 if (!response.ok) {
 throw new Error('Failed to fetch posts');
 }

 const data = await response.json();
 if (data.success) {
 if (limit === 10) {
 // Initial fetch - store first 10 posts
 setAllPosts(data.posts); // Store initial posts
 setTotalPostsCount(data.pagination.total || data.posts.length);
 setHasMorePosts(data.pagination.total > 10);
 } else {
 // Fetching all posts
 setAllPosts(data.posts);
 setShowAllPosts(true);
 }
 }
 } catch (err) {
 console.error('Error fetching posts:', err);
 } finally {
 setPostsLoading(false);
 }
 };

 // Reset state when profile changes
 setShowAllPosts(false);
 setAllPosts([]);
 setTotalPostsCount(0);
 fetchPosts(10);
 }, [profile, profileType]);

 // Function to load all posts
 const handleShowAllPosts = async () => {
 if (!profile || !profile._id || showAllPosts) return;

 setPostsLoading(true);
 try {
 const endpoint = profileType ==='mentor'
 ?`/api/posts/mentor/${profile._id}`
 :`/api/posts/user/${profile._id}`;

 // Fetch a large number to get all posts
 const response = await fetch(`${endpoint}?page=1&limit=1000`, {
 credentials:'include',
 });

 if (!response.ok) {
 throw new Error('Failed to fetch all posts');
 }

 const data = await response.json();
 if (data.success) {
 setAllPosts(data.posts);
 setShowAllPosts(true);
 // Update total count if we got more accurate data
 if (data.pagination?.total) {
 setTotalPostsCount(data.pagination.total);
 }
 }
 } catch (err) {
 console.error('Error fetching all posts:', err);
 toast.error('Failed to load all posts');
 } finally {
 setPostsLoading(false);
 }
 };

 // Fetch reposts when tab changes
 useEffect(() => {
 if (activeTab ==='reposts'&& reposts.length === 0 && profile?.reposts?.length > 0) {
 const fetchReposts = async () => {
 setRepostsLoading(true);
 try {
 const promises = profile.reposts.map(async (id) => {
 try {
 const res = await fetch(`/api/posts/${id}`);
 if (!res.ok) return null;
 const data = await res.json();
 return data.success ? data.post : null;
 } catch (e) {
 console.error(`Error fetching repost ${id}:`, e);
 return null;
 }
 });

 const results = await Promise.all(promises);
 // Filter out nulls and duplicates (just in case)
 const validPosts = results.filter(p => p !== null);
 const uniquePosts = Array.from(new Map(validPosts.map(p => [p._id, p])).values());

 setReposts(uniquePosts);
 } catch (err) {
 console.error('Error fetching reposts:', err);
 } finally {
 setRepostsLoading(false);
 }
 };

 fetchReposts();
 }
 }, [activeTab, profile]);

 // Fetch notes when Notes tab is active
 useEffect(() => {
 if (activeTab ==='notes'&& notes.length === 0 && profile?._id) {
 const fetchNotes = async () => {
 setNotesLoading(true);
 try {
 // Backend URL me uploader query pass kar rahe hain
 const res = await fetch(`/api/notes?uploader=${profile._id}`);
 const data = await res.json();
 if (data.success) {
 setNotes(data.data);
 }
 } catch (err) {
 console.error('Error fetching notes:', err);
 } finally {
 setNotesLoading(false);
 }
 };

 fetchNotes();
 }
 }, [activeTab, profile, notes.length]);

 // Fetch followers and following counts
 useEffect(() => {
 if (!profile || !profile._id) return;

 const fetchCounts = async () => {
 setFollowersCountLoading(true);
 setFollowingCountLoading(true);
 try {
 const followersRes = await fetch(`/api/users/${profile._id}/followers`, {
 credentials:'include',
 });
 const followingRes = await fetch(`/api/users/${profile._id}/following`, {
 credentials:'include',
 });

 if (followersRes.ok) {
 const followersData = await followersRes.json();
 if (followersData.success) {
 setFollowersCount(followersData.count || 0);
 }
 }
 setFollowersCountLoading(false);

 if (followingRes.ok) {
 const followingData = await followingRes.json();
 if (followingData.success) {
 setFollowingCount(followingData.count || 0);
 }
 }
 setFollowingCountLoading(false);
 } catch (err) {
 console.error('Error fetching counts:', err);
 setFollowersCountLoading(false);
 setFollowingCountLoading(false);
 }
 };

 fetchCounts();
 }, [profile]);

 const handleShareProfile = async () => {
 const profileUrl =`${window.location.origin}/profile/${profile.username}`;
 if (navigator.share) {
 try {
 await navigator.share({
 title:`Share ${profile.name || profile.username}'s profile`,
 text: profile.tagline || profile.name,
 url: profileUrl
 });
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch (err) {
 toast.error('Failed to share profile');
 }
 } else {
 await navigator.clipboard.writeText(profileUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const handleFollow = async () => {
 if (!currentUser && !currentMentor) {
 toast.info('Log in to follow users and mentors');
 // navigate('/login');
 return;
 }
 if (isFollowingLoading || !profile || !profile._id) return;

 // OPTIMISTIC UPDATE: Update UI immediately
 const previousFollowing = isFollowing;
 setIsFollowing(!isFollowing);

 // Make API call in background
 setIsFollowingLoading(true);
 fetch(`/api/users/${profile._id}/follow`, {
 method:'POST',
 credentials:'include',
 })
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 setIsFollowing(data.isFollowing);
 // Broadcast follow status change globally
 window.dispatchEvent(new CustomEvent('followStatusChanged', {
 detail: {
 targetId: profile._id.toString(),
 isFollowing: data.isFollowing
 }
 }));
 } else {
 // Revert on error
 setIsFollowing(previousFollowing);
 }
 })
 .catch(error => {
 console.error('Error following:', error);
 // Revert on error
 setIsFollowing(previousFollowing);
 })
 .finally(() => {
 setIsFollowingLoading(false);
 });
 };

 // Calculate isMentor and isOwnProfile before useEffect that uses them
 const isMentor = profileType ==='mentor';
 const isOwnProfile = profile && profileType ? (
 (isMentor && currentMentor && (currentMentor._id === profile._id || currentMentor.username === profile.username)) ||
 (!isMentor && currentUser && (currentUser._id === profile._id || currentUser.username === profile.username))
 ) : false;

 // Fetch follow status when profile loads
 useEffect(() => {
 if ((currentUser || currentMentor) && profile && profile._id && !isOwnProfile) {
 fetch(`/api/users/${profile._id}/follow-status`, {
 credentials:'include',
 })
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 setIsFollowing(data.isFollowing);
 }
 })
 .catch(err => console.error('Error fetching follow status:', err));
 }
 }, [currentUser, currentMentor, profile, isOwnProfile]);

 // Listen for global follow status changes
 useEffect(() => {
 if (!profile || !profile._id || isOwnProfile) return;

 const handleFollowStatusChange = (event) => {
 const { targetId, isFollowing: newFollowingStatus } = event.detail;
 if (targetId === profile._id.toString()) {
 setIsFollowing(newFollowingStatus);
 }
 };

 window.addEventListener('followStatusChanged', handleFollowStatusChange);
 return () => {
 window.removeEventListener('followStatusChanged', handleFollowStatusChange);
 };
 }, [profile, isOwnProfile]);

 if (loading || mentorLoading || userLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-gray-600">Loading profile...</p>
 </div>
 </div>
 );
 }

 if (error || !profile) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center max-w-md mx-auto px-4">
 <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
 <p className="text-gray-600 mb-6">{error ||'The profile you are looking for does not exist.'}</p>
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

 // Prepare SEO data
 const profileName = profile.name || profile.username || (isMentor ?'Mentor':'User');
 const profileTitle =`${profileName}${isMentor ?'| Mentor @ Admeasy':''}`;

 let profileDescription ='';
 let profileKeywords = [profileName, profile.username, isMentor ?'mentor':'user','admeasy'];

 if (isMentor) {
 const exams = profile.competitiveExamsCleared || [];
 const examList = Array.isArray(exams)
 ? exams.map(exam => exam.name ||'').filter(Boolean)
 : [];

 const courseData = profile.course && (typeof profile.course ==='object'&& profile.course !== null
 ? profile.course
 : (profile.course ? (() => {
 try {
 return JSON.parse(profile.course);
 } catch {
 return null;
 }
 })() : null));
 const collegeData = profile.college && (typeof profile.college ==='object'&& profile.college !== null
 ? profile.college
 : (profile.college ? (() => {
 try {
 return JSON.parse(profile.college);
 } catch {
 return null;
 }
 })() : null));

 profileDescription = profile.tagline
 ?`${profile.tagline}${collegeData ?`- Mentor at ${collegeData.name}`:''}${courseData ?`specializing in ${courseData.name || courseData.title}`:''}. Connect with verified mentors on Admeasy.`
 :`Connect with ${profileName}${collegeData ?`from ${collegeData.name}`:''}${courseData ?`- ${courseData.name || courseData.title} mentor`:''}. Get real insights and guidance from verified mentors on Admeasy.`;

 profileKeywords.push(collegeData?.name, courseData?.name || courseData?.title, ...examList);
 } else {
 profileDescription = profile.institute
 ?`${profileName}${profile.course ?`- ${profile.course}`:''} from ${profile.institute}. Connect with students on Admeasy.`
 :`Connect with ${profileName}${profile.course ?`- ${profile.course}`:''}. Get real insights and guidance from verified mentors on Admeasy.`;

 profileKeywords.push(profile.institute, profile.course);
 }

 // If it's an advertiser profile, render AdvertiserProfile component
 if (profileType ==='advertiser'&& profile) {
 return <AdvertiserProfile />;
 }

 if (!profile) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 const profileImage = profileImageUrl ||'https://admeasy.in/LOGO.webp';
 const profileUrl =`https://admeasy.in/profile/${profile.username || profile._id}`;

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
 <SEO
 title={profileTitle}
 description={profileDescription}
 keywords={profileKeywords.filter(Boolean).join(',')}
 image={profileImage}
 url={profileUrl} />

 {/* Main Container with max width */}
 <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
 {/* Back Button */}
 <div className="mb-4 sm:mb-6">
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow transition-all w-fit font-medium text-sm"
 >
 <ArrowLeft className="w-4 h-4"/>
 Back
 </button>
 </div>

 {/* Profile Card - Instagram Style */}
 <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 relative">
 {/* Cover Background */}
 <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200"></div>

 {/* Mentor Account Tag - Top Right */}
 {isMentor && (
 <div className="absolute top-4 right-4 z-10">
 <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
 Mentor Account
 </span>
 </div>
 )}

 {/* Profile Content */}
 <div className="px-4 sm:px-6 pb-6">
 {/* Profile Image - Overlapping cover */}
 <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-4">
 <div className="relative">
 <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-white flex items-center justify-center">
 <ProfileCompletionCircle
 percentage={completion}
 size={window.innerWidth < 640 ? 88 : 120}
 strokeWidth={4}
 >
 <div className="relative">
 <img
 src={profileImageUrl || fallbackProfilePic}
 alt={profile.name || profile.username ||'Profile'}
 className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 {/* Percentage Dot - Profile Header */}
 <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-md transform translate-x-1.5 translate-y-1.5">
 <div className="bg-[#9f3562] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
 {completion}%
 </div>
 </div>
 </div>
 </ProfileCompletionCircle>
 </div>
 </div>

 {/* Action Buttons */}
 {isOwnProfile && (
 <div className="flex gap-2 mt-2 items-center">
 <Link
 to="/me/edit"
 className="px-4 sm:px-6 py-2 bg-white border border-slate-200 hover:bg-gray-200 shadow-sm rounded-xl font-semibold text-sm text-gray-800 transition-colors flex items-center gap-2"
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

 {/* 3-dots menu with logout */}
 <div className="relative"ref={menuRef}>
 <button
 onClick={() => setShowMenu(!showMenu)}
 className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
 aria-label="More options"
 >
 <MoreVertical size={20} />
 </button>

 {showMenu && (
 <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">

 <button
 onClick={handleLogout}
 className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
 >
 <LogOut size={18} />
 <span className="font-medium">Logout</span>
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Profile Info */}
 <div className="space-y-3">
 {/* Name and Username */}
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name || profile.username}</h1>
 {profile.name && profile.username && (
 <p className="text-sm sm:text-base text-gray-500">@{profile.username}</p>
 )}
 </div>

 {/* Stats Row */}
 <div className="flex gap-6 sm:gap-8 py-3 border-y border-gray-200">
 <button
 onClick={handleScrollToPosts}
 className="text-center cursor-pointer hover:opacity-70 transition-opacity"
 >
 <div className="text-lg sm:text-xl font-bold text-gray-900">{totalPostsCount || allPosts.length || posts.length}</div>
 <div className="text-xs sm:text-sm text-gray-500">Posts</div>
 </button>
 <button
 onClick={() => {
 setModalType('followers');
 setShowModal(true);
 }}
 className="text-center cursor-pointer hover:opacity-70 transition-opacity"
 >
 <div className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center min-h-[28px]">
 {followersCountLoading ? (
 <div className="w-5 h-5 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
 ) : (
 followersCount
 )}
 </div>
 <div className="text-xs sm:text-sm text-gray-500">Followers</div>
 </button>
 <button
 onClick={() => {
 setModalType('following');
 setShowModal(true);
 }}
 className="text-center cursor-pointer hover:opacity-70 transition-opacity"
 >
 <div className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center min-h-[28px]">
 {followingCountLoading ? (
 <div className="w-5 h-5 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
 ) : (
 followingCount
 )}
 </div>
 <div className="text-xs sm:text-sm text-gray-500">Following</div>
 </button>
 </div>

 {/* Bio/Tagline for Mentors */}
 {isMentor && profile.tagline && (
 <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{profile.tagline}</p>
 )}

 {/* Education Info */}
 <div className="space-y-2">
 {isMentor ? (
 <>
 {profile.course && (() => {
 const courseData = typeof profile.course ==='object'&& profile.course !== null
 ? profile.course
 : (profile.course ? (() => {
 try {
 return JSON.parse(profile.course);
 } catch {
 return null;
 }
 })() : null);

 if (courseData) {
 const collegeData = profile.college && (typeof profile.college ==='object'&& profile.college !== null
 ? profile.college
 : (profile.college ? (() => {
 try {
 return JSON.parse(profile.college);
 } catch {
 return null;
 }
 })() : null));

 return (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <GraduationCap size={18} className="text-blue-500 flex-shrink-0"/>
 {collegeData ? (
 <Link to={`/colleges/${collegeData.id}/courses/${courseData.id}`} className="hover:underline">
 {courseData.name || courseData.title}
 </Link>
 ) : (
 <span>{courseData.name || courseData.title}</span>
 )}
 </div>
 );
 }
 return null;
 })()}
 {profile.college && (() => {
 const collegeData = typeof profile.college ==='object'&& profile.college !== null
 ? profile.college
 : (profile.college ? (() => {
 try {
 return JSON.parse(profile.college);
 } catch {
 return null;
 }
 })() : null);

 if (collegeData) {
 return (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <MapPin size={18} className="text-red-500 flex-shrink-0"/>
 <Link to={'/colleges/'+ collegeData.id} className="hover:underline">
 {collegeData.name}
 </Link>
 </div>
 );
 }
 return null;
 })()}
 </>
 ) : (
 <>
 {profile.course && (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <GraduationCap size={18} className="text-blue-500 flex-shrink-0"/>
 <span>{profile.course}</span>
 </div>
 )}
 {profile.institute && (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <MapPin size={18} className="text-red-500 flex-shrink-0"/>
 <span>{profile.institute}</span>
 </div>
 )}
 </>
 )}

 {/* Age Display for Mentors */}
 {isMentor && profile.dateOfBirth && (() => {
 const dob = new Date(profile.dateOfBirth);
 const today = new Date();
 let age = today.getFullYear() - dob.getFullYear();
 const m = today.getMonth() - dob.getMonth();
 if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
 age--;
 }

 if (age > 0) {
 return (
 <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
 <Calendar size={18} className="text-green-600 flex-shrink-0"/>
 <span>{age} years old</span>
 </div>
 );
 }
 return null;
 })()}
 </div>

 {/* Action Button for Non-Owners */}
 {!isOwnProfile && (
 <div className="space-y-3">
 {/* Follow and Message buttons side by side */}
 <div className="grid grid-cols-2 gap-3">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={handleFollow}
 disabled={isFollowingLoading}
 className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all disabled:opacity-50 shadow-md ${isFollowing
 ?'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
 :'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent'
 }`}
 >
 {isFollowingLoading ? (
 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
 ) : isFollowing ? (
 <>
 <UserCheck className="w-4 h-4 sm:w-5 sm:h-5"/>
 <span>Following</span>
 </>
 ) : (
 <>
 <UserPlus className="w-4 h-4 sm:w-5 sm:h-5"/>
 <span>Follow</span>
 </>
 )}
 </motion.button>
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => {
 if (!profile || !profile._id) {
 toast.error('Profile not loaded');
 return;
 }

 // User viewing any profile → /chats/:id
 if (currentUser) {
 navigate(`/chats/${profile._id}`);
 }
 // Mentor viewing any profile → /mentor/chats/:id
 else if (currentMentor) {
 navigate(`/mentor/chats/${profile._id}`);
 }
 // Not logged in
 else {
 toast.info('Please login to send messages');
 navigate('/login');
 }
 }}
 className="w-full py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm sm:text-base transition-all hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent flex items-center justify-center gap-2 shadow-md"
 >
 <MessagesSquare size={20} />
 Message
 </motion.button>
 </div>
 {/* Subscribe button full-width below */}
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => {
 if (!currentUser && !currentMentor) {
 toast.info('Please login to subscribe', {
 position:'top-center',
 });
 navigate('/login');
 return;
 }
 // Navigate to subscription plans page with mentor ID
 if (isMentor && profile._id) {
 navigate(`/subscription-plans?mentorId=${profile._id}`);
 } else {
 toast.error('Mentor information not available');
 }
 }}
 className="w-full py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm sm:text-base transition-all hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent flex items-center justify-center gap-2 shadow-md cursor-pointer"
 >
 <CreditCard size={20} />
 Subscribe
 </motion.button>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Exams Section for Mentors */}
 {isMentor && profile.competitiveExamsCleared && Array.isArray(profile.competitiveExamsCleared) && profile.competitiveExamsCleared.length > 0 && (
 <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
 <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
 <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
 <Trophy className="text-white"size={24} />
 </div>
 <div>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900">Competitive Exams</h2>
 <p className="text-xs sm:text-sm text-gray-500">{profile.competitiveExamsCleared.length} exam{profile.competitiveExamsCleared.length !== 1 ?'s':''} cleared</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
 {profile.competitiveExamsCleared.map((exam, index) => (
 <div
 key={index}
 className="group relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border-2 border-transparent hover:border-purple-300 transition-all duration-300 cursor-default hover:shadow-lg"
 >
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cleared</span>
 </div>
 <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
 {exam.name || exam}
 </h3>
 </div>
 <Award className="text-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity"size={24} />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Exams Preparing For Section for Users */}
 {!isMentor && profile.examsPreparingFor && Array.isArray(profile.examsPreparingFor) && profile.examsPreparingFor.length > 0 && (
 <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
 <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
 <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
 <BookOpen className="text-white"size={24} />
 </div>
 <div>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900">Exams Preparing For</h2>
 <p className="text-xs sm:text-sm text-gray-500">{profile.examsPreparingFor.length} exam{profile.examsPreparingFor.length !== 1 ?'s':''}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
 {profile.examsPreparingFor.map((exam, index) => (
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

 {/* Empty State for Exams (Mentors) */}
 {isMentor && (!profile.competitiveExamsCleared || !Array.isArray(profile.competitiveExamsCleared) || profile.competitiveExamsCleared.length === 0) && isOwnProfile && (
 <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Trophy className="text-gray-400"size={32} />
 </div>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams added yet</h3>
 <p className="text-sm text-gray-500 mb-4">Add your cleared competitive exams to showcase your achievements</p>
 <Link
 to="/me/edit"
 className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
 >
 <Edit size={16} />
 Update Profile
 </Link>
 </div>
 )}

 {/* Tabs Section */}
 <div ref={postsSectionRef} className="bg-white rounded-2xl shadow-lg mt-6 overflow-hidden">
 {/* Tabs Header */}
 <div className="flex border-b border-gray-200">
 <button
 onClick={() => setActiveTab('posts')}
 className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-medium transition-all relative ${activeTab ==='posts'
 ?'text-[#9f3562] bg-[#9f3562]/10'
 :'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <MessagesSquare size={20} className={activeTab ==='posts'?'text-[#9f3562]':'text-gray-400'} />
 Posts
 {(totalPostsCount || allPosts.length || posts.length) > 0 && (
 <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab ==='posts'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>
 {totalPostsCount || allPosts.length || posts.length}
 </span>
 )}
 {activeTab ==='posts'&& (
 <motion.div
 layoutId="activeTabIndicator"
 className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9f3562]"
 />
 )}
 </button>

 {/* NOTES TAB BUTTON */}
 <button
 onClick={() => setActiveTab('notes')}
 className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-medium transition-all relative ${activeTab ==='notes'
 ?'text-[#9f3562] bg-[#9f3562]/10'
 :'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <FileText size={20} className={activeTab ==='notes'?'text-[#9f3562]':'text-gray-400'} />
 Notes
 {notes.length > 0 && (
 <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab ==='notes'?'bg-[#9f3562]/20 text-[#9f3562]':'bg-gray-100 text-gray-600'}`}>
 {notes.length}
 </span>
 )}
 {activeTab ==='notes'&& (
 <motion.div
 layoutId="activeTabIndicator"
 className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9f3562]"
 />
 )}
 </button>

 <button
 onClick={() => setActiveTab('reposts')}
 className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-medium transition-all relative ${activeTab ==='reposts'
 ?'text-[#9f3562] bg-[#9f3562]/10'
 :'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <Repeat size={20} className={activeTab ==='reposts'?'text-[#9f3562]':'text-gray-400'} />
 Reposts
 {profile.reposts && profile.reposts.length > 0 && (
 <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab ==='reposts'?'bg-[#9f3562]/20 text-[#9f3562]':'bg-gray-100 text-gray-600'}`}>
 {profile.reposts.length}
 </span>
 )}
 {activeTab ==='reposts'&& (
 <motion.div
 layoutId="activeTabIndicator"
 className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9f3562]"
 />
 )}
 </button>
 </div>

 {/* Tab Content */}
 <div className="p-4 sm:p-6">
 <AnimatePresence mode="wait">
 {activeTab ==='posts'? (
 <motion.div
 key="posts"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {postsLoading ? (
 <div className="flex justify-center items-center py-12">
 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : allPosts.length > 0 ? (
 <div className="space-y-4">
 {(showAllPosts ? allPosts : allPosts.slice(0, 10)).map((post) => (
 <PostCard key={post._id} post={post} onPostUpdate={handlePostUpdate} />
 ))}
 {!showAllPosts && totalPostsCount > 10 && (
 <div className="flex justify-center pt-4">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={handleShowAllPosts}
 disabled={postsLoading}
 className="px-6 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm sm:text-base transition-all hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {postsLoading ?'Loading...':`Show All Posts (${totalPostsCount} total)`}
 </motion.button>
 </div>
 )}
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
 </motion.div>
 ) : activeTab ==='reposts'? (
 <motion.div
 key="reposts"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {repostsLoading ? (
 <div className="flex justify-center items-center py-12">
 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : reposts.length > 0 ? (
 <div className="space-y-4">
 {reposts.map((post) => (
 <PostCard key={post._id} post={post} onPostUpdate={handlePostUpdate} />
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No reposts yet</h3>
 <p className="text-sm text-gray-500">
 {isOwnProfile ?'Reposts will appear here.':'This user hasn\'t reposted anything yet.'}
 </p>
 </div>
 )}
 </motion.div>
 ) : activeTab ==='notes'? (
 <motion.div
 key="notes"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {notesLoading ? (
 <div className="flex justify-center items-center py-12">
 <div className="w-8 h-8 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : notes.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {notes.map((note) => (
 <NotesCard key={note._id} note={note} compact={true} />
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h3>
 <p className="text-sm text-gray-500">
 {isOwnProfile ?'Start sharing your knowledge by uploading notes!':'This user hasn\'t uploaded any notes yet.'}
 </p>
 {isOwnProfile && (
 <Link to="/add-note"className="mt-4 inline-block px-6 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors">
 Upload Notes
 </Link>
 )}
 </div>
 )}
 </motion.div>
 ) : null}
 </AnimatePresence>
 </div>
 </div>
 </div>

 {/* Followers/Following Modal */}
 {showModal && (modalType ==='followers'|| modalType ==='following') && (
 <FollowersFollowingModal
 isOpen={showModal}
 onClose={() => setShowModal(false)}
 targetId={profile._id}
 type={modalType}
 profileType={profileType}
 />
 )}
 </div>
 );
}

