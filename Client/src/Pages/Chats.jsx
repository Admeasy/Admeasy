import { useState, useEffect } from'react';
import { Link, useNavigate } from'react-router-dom';
import { FaSearch, FaArrowLeft, FaUser, FaCircle } from'react-icons/fa';
import { toast } from'react-toastify';
import { useSocket } from'../context/SocketContext';
import { useUser } from'../context/UserContext';
import SEO from'../components/SEO';

const Chats = () => {
 const [chats, setChats] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [searchQuery, setSearchQuery] = useState('');
 const navigate = useNavigate();
 const { user } = useUser();
 const { isMentorOnline, isUserOnline, socket, isConnected } = useSocket();

 useEffect(() => {
 fetchChats();
 }, []);

 // Listen for real-time chat updates
 useEffect(() => {
 if (!socket || !isConnected) return;
 
 // Listen for new messages to update chat list
 const handleNewMessage = (message) => {
 setChats(prevChats => {
 const chatIndex = prevChats.findIndex(chat => 
 chat.chatId && message.chatId && chat.chatId.toString() === message.chatId.toString()
 );
 
 if (chatIndex !== -1) {
 const updatedChats = [...prevChats];
 const isFromCurrentUser = user && message.senderId && (
 message.senderId.toString() === user._id.toString() || 
 message.senderId.toString() === user.id?.toString()
 );
 const updatedChat = {
 ...updatedChats[chatIndex],
 lastMessage: message.message,
 lastMessageTime: message.createdAt || new Date(),
 unreadCount: isFromCurrentUser 
 ? updatedChats[chatIndex].unreadCount 
 : (updatedChats[chatIndex].unreadCount || 0) + 1
 };
 updatedChats[chatIndex] = updatedChat;
 const [movedChat] = updatedChats.splice(chatIndex, 1);
 return [movedChat, ...updatedChats];
 }
 return prevChats;
 });
 };

 const handleUserToUserMessage = (message) => {
 setChats(prevChats => {
 const chatIndex = prevChats.findIndex(chat => 
 chat.chatId && message.chatId && chat.chatId.toString() === message.chatId.toString()
 );
 
 if (chatIndex !== -1) {
 const updatedChats = [...prevChats];
 const isFromCurrentUser = user && message.senderId && (
 message.senderId.toString() === user._id.toString() || 
 message.senderId.toString() === user.id?.toString()
 );
 const updatedChat = {
 ...updatedChats[chatIndex],
 lastMessage: message.message,
 lastMessageTime: message.createdAt || new Date(),
 unreadCount: isFromCurrentUser 
 ? updatedChats[chatIndex].unreadCount 
 : (updatedChats[chatIndex].unreadCount || 0) + 1
 };
 updatedChats[chatIndex] = updatedChat;
 const [movedChat] = updatedChats.splice(chatIndex, 1);
 return [movedChat, ...updatedChats];
 }
 return prevChats;
 });
 };
 
 socket.on('receive_message', handleNewMessage);
 socket.on('receive_user_to_user_message', handleUserToUserMessage);
 
 return () => {
 socket.off('receive_message', handleNewMessage);
 socket.off('receive_user_to_user_message', handleUserToUserMessage);
 };
 }, [socket, isConnected, user]);

 const fetchChats = async () => {
 try {
 const response = await fetch('/api/chats', {
 credentials:'include'
 });

 if (!response.ok) {
 const errorData = await response.json().catch(() => ({}));
 throw new Error(errorData.message ||'Failed to fetch chats');
 }

 const data = await response.json();
 
 if (data.success && Array.isArray(data.chats)) {
 setChats(data.chats);
 } else {
 setChats([]);
 }
 } catch (err) {
 console.error('Error fetching chats:', err);
 setError(err.message);
 toast.error('Failed to load chats');
 setChats([]);
 } finally {
 setIsLoading(false);
 }
 };

 const formatLastMessageTime = (timestamp) => {
 if (!timestamp) return'';

 const date = new Date(timestamp);
 const now = new Date();
 const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

 if (diffInHours < 24) {
 return date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'});
 } else if (diffInHours < 168) { // 7 days
 return date.toLocaleDateString([], { weekday:'short'});
 } else {
 return date.toLocaleDateString([], { month:'short', day:'numeric'});
 }
 };

 const filteredChats = Array.isArray(chats) ? chats.filter(chat => {
 const searchLower = searchQuery.toLowerCase();
 return (
 chat.otherUserName?.toLowerCase().includes(searchLower) ||
 chat.mentorName?.toLowerCase().includes(searchLower) ||
 chat.lastMessage?.toLowerCase().includes(searchLower)
 );
 }) : [];

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse"/>
 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"style={{ animationDelay:'1s'}} />
 <div className="relative z-10">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 </div>
 );
 }

 return (
 <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-4 sm:p-6 lg:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <SEO
 title="Chats - Connect with Mentors | Admeasy"
 description="Connect with verified mentors and access premium study notes. Your complete guide to college admissions and academic success."
 keywords="chats, mentors, study notes, education, IIT, IIM, DU colleges, engineering colleges, medical colleges, college search"
 url="https://admeasy.in/chats"
 />
 {/* Enhanced Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'8s'}} />
 <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'10s'}} />
 <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'6s'}} />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"/>
 </div>
 
 {/* Header */}
 <div className="max-w-4xl mx-auto mb-6 relative z-10">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl sm:text-3xl font-admeasy-bold text-gray-900">
 My Chats
 </h1>
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]"
 >
 <FaArrowLeft />
 Back
 </button>
 </div>

 {/* Search Bar */}
 <div className="relative mb-6">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <FaSearch className="h-5 w-5 text-gray-400"/>
 </div>
 <input
 type="text"
 placeholder="Search chats..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
 />
 </div>
 </div>

 {/* Chats List */}
 <div className="max-w-4xl mx-auto relative z-10">
 {error && (
 <div className="text-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-red-200 shadow-xl shadow-gray-200/50">
 <p className="text-red-500 text-lg">{error}</p>
 </div>
 )}

 {!error && filteredChats.length === 0 && (
 <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <div className="text-[#9f3562]/40 mb-4">
 <FaUser className="mx-auto text-6xl"/>
 </div>
 <h3 className="text-xl font-semibold text-gray-900 mb-2">
 {searchQuery ?'No chats found':'No chats yet'}
 </h3>
 <p className="text-gray-600">
 {searchQuery
 ?'Try adjusting your search terms'
 :'Start a conversation with a mentor to see your chats here'
 }
 </p>
 </div>
 )}

 <div className="space-y-3">
 {filteredChats.map((chat) => {
 const isUserToMentor = chat.chatType ==='userToMentor';
 const isUserToUser = chat.chatType ==='userToUser';
 const otherUserId = chat.otherUserId || chat.mentorId;
 const otherUserName = chat.otherUserName || chat.mentorName;
 const otherUserImage = chat.otherUserImage || chat.mentorImage;
 const chatUrl =`/chats/${otherUserId}`;
 
 return (
 <Link
 key={chat.chatId || otherUserId}
 to={chatUrl}
 className="block bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 group"
 >
 <div className="p-4 flex items-center gap-4">
 <div className="flex-shrink-0 relative">
 <img
 src={otherUserImage ||"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
 alt={otherUserName}
 className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-[#9f3562]/30 transition-all duration-300"
 onError={(e) => {
 e.target.src ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
 }}
 />
 <div className="absolute -bottom-0 -right-0">
 <FaCircle
 className={`text-sm ${
 (isUserToMentor && isMentorOnline(otherUserId)) || (isUserToUser && isUserOnline(otherUserId))
 ?'text-green-500'
 :'text-gray-400'
 }`}
 />
 </div>
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-[#9f3562] transition-colors">
 {otherUserName || (isUserToMentor ?'Mentor':'User')}
 </h3>
 <span className="text-sm text-gray-500 flex-shrink-0">
 {formatLastMessageTime(chat.lastMessageTime)}
 </span>
 </div>

 <p className="text-gray-600 text-sm line-clamp-2">
 {chat.lastMessage ||'No messages yet'}
 </p>

 {chat.unreadCount > 0 && (
 <div className="flex items-center gap-2 mt-2">
 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 text-[#9f3562] border border-[#9f3562]/20">
 {chat.unreadCount} new message{chat.unreadCount > 1 ?'s':''}
 </span>
 </div>
 )}
 </div>

 <div className="flex-shrink-0 text-gray-400 group-hover:text-[#9f3562] transition-colors">
 <svg className="w-5 h-5"fill="none"stroke="currentColor"viewBox="0 0 24 24">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M9 5l7 7-7 7"/>
 </svg>
 </div>
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 </main>
 );
};

export default Chats;