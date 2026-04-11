import { useState, useEffect, useRef } from"react";
import { createPortal } from"react-dom";
import { X, Search, Send, CheckCircle2 } from"lucide-react";
import { toast } from"react-toastify";
import { useMentor } from"../context/MentorContext";
import { motion, AnimatePresence } from"framer-motion";

const SharePostModal = ({ isOpen, onClose, postId, postData }) => {
 const { mentor } = useMentor();
 const [chats, setChats] = useState([]);
 const [isLoadingChats, setIsLoadingChats] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedChat, setSelectedChat] = useState(null);
 const [optionalMessage, setOptionalMessage] = useState("");
 const [isSending, setIsSending] = useState(false);
 const [sent, setSent] = useState(false);
 const [isMobile, setIsMobile] = useState(false);

 const searchRef = useRef(null);
 const modalRef = useRef(null);

 const activePostId = postData?._id || postId;
 const fallbackProfilePic =
"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

 useEffect(() => {
 const handleResize = () => setIsMobile(window.innerWidth < 640);
 handleResize(); // check right away
 window.addEventListener("resize", handleResize);
 return () => window.removeEventListener("resize", handleResize);
 }, []);

 // Focus trap & Prevent background scroll
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow ="hidden";

 const handleKeyDown = (e) => {
 if (e.key ==="Escape") {
 onClose();
 }
 };

 document.addEventListener("keydown", handleKeyDown);

 return () => {
 document.body.style.overflow ="";
 document.removeEventListener("keydown", handleKeyDown);
 };
 }
 }, [isOpen, onClose]);

 // Fetch chats when modal opens
 useEffect(() => {
 const fetchChats = async () => {
 setIsLoadingChats(true);
 try {
 if (mentor) {
 const [mentorChatsRes, m2mChatsRes] = await Promise.all([
 fetch("/api/mentor/chats", { credentials:"include"}),
 fetch("/api/mentor/mentor-chats", { credentials:"include"}),
 ]);

 const mentorChatsData = mentorChatsRes.ok ? await mentorChatsRes.json() : { chats: [] };
 const m2mChatsData = m2mChatsRes.ok ? await m2mChatsRes.json() : { chats: [] };

 const allChats = [
 ...(mentorChatsData.chats || []).map((c) => ({
 ...c,
 chatType:"userToMentor",
 displayName: c.userName || c.otherUserName ||"User",
 displayImage: c.userImage || c.otherUserImage,
 otherPersonId: c.userId || c.otherUserId,
 })),
 ...(m2mChatsData.chats || []).map((c) => ({
 ...c,
 chatType:"mentorToMentor",
 displayName: c.otherMentorName ||"Mentor",
 displayImage: c.otherMentorImage,
 otherPersonId: c.otherMentorId,
 })),
 ];
 setChats(allChats);
 } else {
 const [userChatsRes, u2uChatsRes] = await Promise.all([
 fetch("/api/chats", { credentials:"include"}),
 fetch("/api/user-chats", { credentials:"include"}),
 ]);

 const userChatsData = userChatsRes.ok ? await userChatsRes.json() : { chats: [] };
 const u2uChatsData = u2uChatsRes.ok ? await u2uChatsRes.json() : { chats: [] };

 const allChats = [
 ...(userChatsData.chats || []).map((c) => ({
 ...c,
 chatType:"userToMentor",
 displayName: c.mentorName || c.otherUserName ||"User",
 displayImage: c.mentorImage || c.otherUserImage,
 otherPersonId: c.mentorId || c.otherUserId,
 })),
 ...(u2uChatsData.chats || []).map((c) => ({
 ...c,
 chatType:"userToUser",
 displayName: c.otherUserName ||"User",
 displayImage: c.otherUserImage,
 otherPersonId: c.otherUserId,
 })),
 ];
 setChats(allChats);
 }
 } catch (err) {
 console.error("Error fetching chats for share:", err);
 toast.error("Failed to load chats");
 } finally {
 setIsLoadingChats(false);
 }
 };

 if (isOpen) {
 fetchChats();
 setTimeout(() => searchRef.current?.focus(), 200);
 } else {
 setSelectedChat(null);
 setOptionalMessage("");
 setSearchQuery("");
 setSent(false);
 }
 }, [isOpen, mentor]);

 const filteredChats = chats.filter((chat) =>
 chat.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const handleSend = async (e) => {
 e.stopPropagation();
 if (!selectedChat || isSending || !activePostId) return;

 setIsSending(true);
 try {
 const body = {
 messageType:"post",
 postId: activePostId,
 message: optionalMessage.trim() || null,
 };

 let endpoint ="";
 const otherId = selectedChat.otherPersonId;
 const chatType = selectedChat.chatType;

 if (chatType ==="userToMentor") {
 endpoint = mentor ?`/api/mentor/chats/${otherId}/messages`:`/api/chats/${otherId}/messages`;
 } else if (chatType ==="userToUser") {
 endpoint =`/api/user-chats/${otherId}/messages`;
 } else if (chatType ==="mentorToMentor") {
 endpoint =`/api/mentor/mentor-chats/${otherId}/messages`;
 }

 const res = await fetch(endpoint, {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 credentials:"include",
 body: JSON.stringify(body),
 });

 const data = await res.json();
 if (data.success) {
 setSent(true);
 setTimeout(() => onClose(), 1500);
 } else {
 throw new Error(data.message ||"Failed to share post");
 }
 } catch (err) {
 console.error("Error sharing post:", err);
 toast.error(err.message ||"Failed to share post");
 } finally {
 setIsSending(false);
 }
 };

 const getPlainText = (html ="", maxLength = 80) => {
 if (!html) return"";
 const plain = html.replace(/<[^>]*>/g,"").trim();
 return plain.length > maxLength ? plain.substring(0, maxLength) +"...": plain;
 };

 if (typeof document ==="undefined") return null;

 return createPortal(
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center">
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 onClick={(e) => {
 e.stopPropagation();
 onClose();
 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
 />

 {/* Modal Container */}
 <motion.div
 ref={modalRef}
 initial={isMobile ? { y:"100%"} : { opacity: 0, scale: 0.95 }}
 animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
 exit={isMobile ? { y:"100%"} : { opacity: 0, scale: 0.95 }}
 transition={{ type:"spring", damping: 25, stiffness: 300 }}
 className="w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-100 flex flex-col shadow-2xl pointer-events-auto z-10"
 onClick={(e) => e.stopPropagation()}
 role="dialog"
 aria-modal="true"
 >
 {/* Header */}
 <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
 <h2 className="text-lg font-bold text-gray-900">Share Post</h2>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onClose();
 }}
 className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 -mr-2"
 aria-label="Close modal"
 >
 <X className="w-5 h-5"/>
 </button>
 </div>

 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
 {/* Post Preview */}
 {postData && (
 <div className="rounded-2xl border border-gray-100 bg-gray-50/80 overflow-hidden mb-4">
 <div className="flex gap-3 p-3">
 {postData.image && (
 <img
 src={postData.image}
 alt="Post"
 className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200"
 />
 )}
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-[#9f3562] mb-1 truncate">
 {postData.author?.name || postData.mentor?.name ||"Post"}
 </p>
 <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
 {getPlainText(postData.content)}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Optional Message Input */}
 <div className="mb-4">
 <input
 type="text"
 value={optionalMessage}
 onChange={(e) => setOptionalMessage(e.target.value)}
 placeholder="Add a message... (optional)"
 onClick={(e) => e.stopPropagation()}
 className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/40 focus:border-[#9f3562]/50 transition-all"
 />
 </div>

 {/* Search Chats */}
 <div className="relative mb-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
 <input
 ref={searchRef}
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search chats..."
 onClick={(e) => e.stopPropagation()}
 className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/40 focus:border-[#9f3562]/50 transition-all"
 />
 </div>

 {/* Chat List */}
 <div className="space-y-1.5 flex-1 min-h-[150px]">
 {isLoadingChats ? (
 <div className="flex justify-center py-6">
 <div className="w-6 h-6 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin"/>
 </div>
 ) : filteredChats.length === 0 ? (
 <div className="text-center py-6 text-gray-400 text-sm">
 {searchQuery ?"No chats found":"No chats available"}
 </div>
 ) : (
 filteredChats.map((chat) => {
 const isSelected =
 selectedChat?.chatId === chat.chatId ||
 selectedChat?.otherPersonId === chat.otherPersonId;

 return (
 <motion.button
 key={chat.chatId || chat.otherPersonId}
 whileTap={{ scale: 0.98 }}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedChat(isSelected ? null : chat);
 }}
 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${isSelected
 ?"bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 border border-[#9f3562]/30"
 :"hover:bg-gray-50 border border-transparent"
 }`}
 >
 <img
 src={chat.displayImage || fallbackProfilePic}
 alt={chat.displayName}
 className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-900 truncate">
 {chat.displayName}
 </p>
 {chat.lastMessage && (
 <p className="text-xs text-gray-400 truncate">
 {chat.lastMessage}
 </p>
 )}
 </div>
 {isSelected && (
 <CheckCircle2 className="w-5 h-5 text-[#9f3562] flex-shrink-0"/>
 )}
 </motion.button>
 );
 })
 )}
 </div>
 </div>

 {/* Footer / Send Button */}
 <div className="p-4 border-t border-gray-100 bg-white sm:rounded-b-3xl flex-shrink-0">
 <motion.button
 whileHover={{ scale: selectedChat && !isSending ? 1.02 : 1 }}
 whileTap={{ scale: selectedChat && !isSending ? 0.98 : 1 }}
 onClick={handleSend}
 disabled={!selectedChat || isSending || sent}
 className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${selectedChat && !isSending && !sent
 ?"bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-lg shadow-[#9f3562]/25 hover:shadow-[#9f3562]/40"
 : sent
 ?"bg-green-500 text-white shadow-lg shadow-green-500/25"
 :"bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
 }`}
 >
 {sent ? (
 <>
 <CheckCircle2 className="w-5 h-5"/>
 Sent Successfully
 </>
 ) : isSending ? (
 <>
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
 Sending...
 </>
 ) : (
 <>
 <Send className="w-5 h-5"/>
 {selectedChat ?`Send to ${selectedChat.displayName}`:"Select a recipient"}
 </>
 )}
 </motion.button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>,
 document.body
 );
};

export default SharePostModal;
