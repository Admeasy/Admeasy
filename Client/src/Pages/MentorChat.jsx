import { useState, useEffect, useRef } from'react';
import { useParams, useNavigate, Link } from'react-router-dom';
import { FaPaperPlane, FaUser, FaCheck, FaCheckDouble, FaCircle } from'react-icons/fa';
import { toast } from'react-toastify';
import { useMentor } from'../context/MentorContext';
import { useSocket } from'../context/SocketContext';
import { ArrowLeft } from'lucide-react';

const MentorChat = () => {
 const { id } = useParams(); // Changed from userId to id
 const navigate = useNavigate();
 const { mentor } = useMentor();
 const { socket, isConnected, joinChat, sendMessage: socketSendMessage, isUserOnline, isMentorOnline } = useSocket();
 const [otherPerson, setOtherPerson] = useState(null);
 const [chatType, setChatType] = useState(null); //'mentorToUser'or'mentorToMentor'
 const [messages, setMessages] = useState([]);
 const [newMessage, setNewMessage] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isSending, setIsSending] = useState(false);
 const [error, setError] = useState(null);
 const [chatId, setChatId] = useState(null);
 const [connectionError, setConnectionError] = useState(false);
 const messagesEndRef = useRef(null);
 const initializationDone = useRef(false);

 const fallbackProfilePic ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

 useEffect(() => {
 if (!mentor) {
 navigate('/mentors/login');
 return;
 }

 if (id && !initializationDone.current) {
 initializationDone.current = true;
 initializeChat();
 }
 }, [id, mentor, navigate]);

 const initializeChat = async () => {
 try {
 setIsLoading(true);
 setError(null);
 setConnectionError(false);

 // Try mentor-to-user chat first - check if chat exists by trying to get messages
 // Mentors can only access existing chats (users create them)
 let messagesResponse = await fetch(`/api/mentor/chats/${id}/messages`, {
 credentials:'include'
 });
 
 if (messagesResponse.ok) {
 // Mentor-to-user chat exists
 const messagesData = await messagesResponse.json();
 setChatType('mentorToUser');
 setChatId(messagesData.chatId);
 setMessages(messagesData.messages || []);
 
 // Try multiple sources to get user data, with fallbacks
 let userInfo = null;
 
 // Method 1: Try chat list (most reliable for mentors)
 try {
 const chatsRes = await fetch('/api/mentor/chats', { credentials:'include'});
 if (chatsRes.ok) {
 const chatsData = await chatsRes.json();
 if (chatsData.success && Array.isArray(chatsData.chats)) {
 const chat = chatsData.chats.find(c => c.userId === id || c.userId?.toString() === id);
 if (chat && chat.userName) {
 userInfo = {
 _id: chat.userId || id,
 name: chat.userName,
 username: null, // Will try to get from user endpoint
 image: chat.userImage || null
 };
 }
 }
 }
 } catch (err) {
 console.error('Error fetching from chat list:', err);
 }
 
 // Method 2: If chat list didn't work, try user endpoint
 if (!userInfo || !userInfo.name || userInfo.name ==='Student') {
 try {
 const userRes = await fetch(`/api/users/${id}`, { credentials:'include'});
 if (userRes.ok) {
 const userData = await userRes.json();
 // Note: This endpoint returns user object directly, not wrapped in { user: ... }
 const user = userData.user || userData; // Handle both formats
 if (user && user.name && user.name !=='Student') {
 userInfo = {
 _id: user._id || user.id || id,
 name: user.name,
 username: user.username || null,
 image: user.image || null
 };
 }
 }
 } catch (err) {
 console.error('Error fetching from user endpoint:', err);
 }
 }
 
 // Method 3: Extract from messages (last resort - messages have sender info)
 if (!userInfo || !userInfo.name || userInfo.name ==='Student') {
 const userMessages = (messagesData.messages || []).filter(msg => 
 msg.senderRole ==='user'&& msg.senderId && msg.senderId.toString() === id.toString()
 );
 if (userMessages.length > 0) {
 const firstUserMessage = userMessages[0];
 if (firstUserMessage.senderName && firstUserMessage.senderName !=='Unknown') {
 userInfo = {
 _id: firstUserMessage.senderId || id,
 name: firstUserMessage.senderName,
 username: null,
 image: firstUserMessage.senderImage || null
 };
 }
 }
 }
 
 // Method 4: If still no info, try to get username from user endpoint
 if (userInfo && userInfo.name && userInfo.name !=='Student'&& !userInfo.username) {
 try {
 const userRes = await fetch(`/api/users/${id}`, { credentials:'include'});
 if (userRes.ok) {
 const userData = await userRes.json();
 const user = userData.user || userData;
 if (user && user.username) {
 userInfo.username = user.username;
 }
 }
 } catch (err) {
 console.error('Error fetching username:', err);
 }
 }
 
 // Set the user info (with final fallback)
 setOtherPerson(userInfo || {
 _id: id,
 name:'Student',
 username: null,
 image: null
 });
 
 
 if (isConnected && socket && messagesData.chatId) {
 joinChat(messagesData.chatId);
 } else {
 setTimeout(() => {
 if (isConnected && socket && messagesData.chatId) {
 joinChat(messagesData.chatId);
 }
 }, 100);
 if (socket) {
 socket.once('authenticated', () => {
 if (messagesData.chatId) joinChat(messagesData.chatId);
 });
 }
 }
 setIsLoading(false);
 return;
 } else if (messagesResponse.status !== 404) {
 // If it's not a 404, it's a real error (403, 500, etc.) - don't try mentor-to-mentor
 const errorData = await messagesResponse.json().catch(() => ({}));
 if (messagesResponse.status === 403) {
 setError('Access denied. You don\'t have permission to access this chat.');
 } else {
 throw new Error(errorData.message ||'Failed to access chat');
 }
 setIsLoading(false);
 return;
 }
 // If 404, continue to try mentor-to-mentor chat

 // If mentor-to-user chat doesn't exist (404), try mentor-to-mentor chat
 // Try mentor-to-mentor chat
 let chatResponse = await fetch(`/api/mentor/mentor-chats/${id}`, {
 method:'POST',
 credentials:'include'
 });

 if (!chatResponse.ok) {
 const errorData = await chatResponse.json().catch(() => ({}));
 // Handle different error cases
 if (chatResponse.status === 404) {
 setError('Chat not found. The user or mentor you\'re trying to chat with may not exist or you don\'t have access to this conversation.');
 } else if (chatResponse.status === 403) {
 setError('Access denied. You don\'t have permission to access this chat.');
 } else {
 throw new Error(errorData.message ||'Failed to access chat');
 }
 setIsLoading(false);
 return;
 }

 const chatData = await chatResponse.json();

 if (!chatData.success || !chatData.chat) {
 throw new Error('Invalid chat response');
 }

 // Mentor-to-mentor chat
 setChatType('mentorToMentor');
 setChatId(chatData.chat.chatId);
 setOtherPerson({
 _id: chatData.chat.otherMentorId,
 name: chatData.chat.otherMentorName,
 username: chatData.chat.otherMentorUsername,
 image: chatData.chat.otherMentorImage
 });
 await fetchMessages(chatData.chat.chatId,'mentorToMentor');

 if (isConnected && socket) {
 socket.emit('join_mentor_to_mentor_chat', chatData.chat.chatId);
 } else {
 setTimeout(() => {
 if (isConnected && socket && chatData.chat.chatId) {
 socket.emit('join_mentor_to_mentor_chat', chatData.chat.chatId);
 }
 }, 100);
 if (socket) {
 socket.once('authenticated', () => {
 if (chatData.chat.chatId) socket.emit('join_mentor_to_mentor_chat', chatData.chat.chatId);
 });
 }
 }

 setIsLoading(false);
 } catch (error) {
 console.error('Error initializing chat:', error);
 setError(error.message ||'Failed to load chat');
 setIsLoading(false);
 toast.error(error.message ||'Failed to initialize chat');
 }
 };

 useEffect(() => {
 scrollToBottom();
 }, [messages]);

 // Retry fetching user data if it's still"Student"after messages are loaded
 useEffect(() => {
 if (chatType ==='mentorToUser'&& messages.length > 0 && (!otherPerson || otherPerson.name ==='Student')) {
 // Try to extract user info from messages
 const userMessages = messages.filter(msg => 
 msg.senderRole ==='user'&& msg.senderId && msg.senderId.toString() === id.toString()
 );
 if (userMessages.length > 0) {
 const firstUserMessage = userMessages[0];
 if (firstUserMessage.senderName && firstUserMessage.senderName !=='Unknown'&& firstUserMessage.senderName !=='Student') {
 setOtherPerson(prev => ({
 ...prev,
 _id: prev?._id || firstUserMessage.senderId || id,
 name: firstUserMessage.senderName,
 image: firstUserMessage.senderImage || prev?.image || null
 }));
 }
 }
 
 // Also try fetching from user endpoint one more time
 if (!otherPerson || otherPerson.name ==='Student') {
 fetch(`/api/users/${id}`, { credentials:'include'})
 .then(res => {
 if (res.ok) {
 return res.json();
 }
 return null;
 })
 .then(userData => {
 if (userData) {
 const user = userData.user || userData; // Handle both formats
 if (user && user.name && user.name !=='Student') {
 setOtherPerson({
 _id: user._id || user.id || id,
 name: user.name,
 username: user.username || null,
 image: user.image || null
 });
 }
 }
 })
 .catch(err => {
 console.error('Error retrying user fetch:', err);
 });
 }
 }
 }, [messages, chatType, id, otherPerson]);

 // Join chat room when socket becomes connected
 useEffect(() => {
 if (isConnected && socket && chatId && chatType) {
 if (chatType ==='mentorToUser') {
 joinChat(chatId);
 } else {
 socket.emit('join_mentor_to_mentor_chat', chatId);
 }
 }
 }, [isConnected, socket, chatId, chatType, joinChat]);

 // Socket.io listeners for real-time messages
 useEffect(() => {
 if (!socket || !chatId || !chatType) return;

 const handleReceiveMessage = (message) => {
 if (message.chatId && message.chatId.toString() === chatId.toString()) {
 // Normalize message data - ensure sender info is present
 const normalizedMessage = {
 ...message,
 senderName: message.senderName || (message.senderId === mentor?._id || message.senderId === mentor?.id ? mentor?.name :'Unknown'),
 senderImage: message.senderImage || (message.senderId === mentor?._id || message.senderId === mentor?.id ? mentor?.image : null),
 senderRole: message.senderRole || (message.senderId === mentor?._id || message.senderId === mentor?.id ?'mentor':'user'),
 message: message.message || message.text ||'',
 createdAt: message.createdAt || message.timestamp || new Date()
 };
 
 
 setMessages(prevMessages => {
 const exists = prevMessages.some(m =>
 m._id && normalizedMessage._id && m._id.toString() === normalizedMessage._id.toString()
 );
 if (!exists) {
 return [...prevMessages, normalizedMessage];
 }
 return prevMessages;
 });
 setIsSending(false);
 setTimeout(() => scrollToBottom(), 100);
 }
 };

 const handleMentorToMentorMessage = (message) => {
 if (message.chatId && message.chatId.toString() === chatId.toString()) {
 // Normalize message data - ensure sender info is present
 const normalizedMessage = {
 ...message,
 senderName: message.senderName || (message.senderId === mentor?._id || message.senderId === mentor?.id ? mentor?.name :'Unknown'),
 senderImage: message.senderImage || (message.senderId === mentor?._id || message.senderId === mentor?.id ? mentor?.image : null),
 senderRole: message.senderRole ||'mentor',
 message: message.message || message.text ||'',
 createdAt: message.createdAt || message.timestamp || new Date()
 };
 
 
 setMessages(prevMessages => {
 const exists = prevMessages.some(m =>
 m._id && normalizedMessage._id && m._id.toString() === normalizedMessage._id.toString()
 );
 if (!exists) {
 return [...prevMessages, normalizedMessage];
 }
 return prevMessages;
 });
 setIsSending(false);
 setTimeout(() => scrollToBottom(), 100);
 }
 };

 const handleMessageError = (error) => {
 toast.error(error.message ||'Failed to send message');
 setIsSending(false);
 };

 const handleMessageSent = (message) => {
 if (message.chatId && message.chatId.toString() === chatId.toString()) {
 // Normalize message data - ensure sender info is present
 const normalizedMessage = {
 ...message,
 senderName: message.senderName || mentor?.name ||'You',
 senderImage: message.senderImage || mentor?.image || null,
 senderRole: message.senderRole ||'mentor',
 message: message.message || message.text ||'',
 createdAt: message.createdAt || message.timestamp || new Date()
 };
 
 setMessages(prevMessages => {
 const exists = prevMessages.some(m =>
 m._id && normalizedMessage._id && m._id.toString() === normalizedMessage._id.toString()
 );
 if (!exists) {
 return [...prevMessages, normalizedMessage];
 }
 return prevMessages;
 });
 }
 setIsSending(false);
 setTimeout(() => scrollToBottom(), 100);
 };

 if (chatType ==='mentorToUser') {
 socket.on('receive_message', handleReceiveMessage);
 socket.on('message_sent', handleMessageSent);
 } else {
 socket.on('receive_mentor_to_mentor_message', handleMentorToMentorMessage);
 socket.on('mentor_to_mentor_message_sent', handleMessageSent);
 }
 socket.on('message_error', handleMessageError);

 return () => {
 socket.off('receive_message', handleReceiveMessage);
 socket.off('receive_mentor_to_mentor_message', handleMentorToMentorMessage);
 socket.off('message_error', handleMessageError);
 socket.off('message_sent', handleMessageSent);
 socket.off('mentor_to_mentor_message_sent', handleMessageSent);
 };
 }, [socket, chatId, chatType]);

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior:'smooth'});
 };

 const fetchMessages = async (chatIdParam, type) => {
 try {
 let response;
 if (type ==='mentorToUser') {
 response = await fetch(`/api/mentor/chats/${id}/messages`, {
 credentials:'include'
 });
 } else {
 response = await fetch(`/api/mentor/mentor-chats/${id}/messages`, {
 credentials:'include'
 });
 }

 if (!response.ok) {
 if (response.status === 404) {
 setMessages([]);
 setError(null);
 } else {
 throw new Error('Failed to fetch messages');
 }
 } else {
 const data = await response.json();
 
 // Normalize messages - ensure all have required sender fields
 const normalizedMessages = (data.messages || []).map((msg) => {
 const normalized = {
 ...msg,
 senderName: msg.senderName ||'Unknown',
 senderImage: msg.senderImage || null,
 senderRole: msg.senderRole || (msg.senderId === mentor?._id || msg.senderId === mentor?.id ?'mentor':'user'),
 message: msg.message || msg.text ||'',
 createdAt: msg.createdAt || msg.timestamp || new Date()
 };
 
 return normalized;
 });
 
 setMessages(normalizedMessages);
 setChatId(data.chatId);
 }
 } catch (err) {
 console.error('Error fetching messages:', err);
 if (!err.message.includes('404')) {
 setError(err.message);
 toast.error('Failed to load messages');
 }
 }
 };

 // Determine when the input should be disabled
 const isInputDisabled =
 isSending || !isConnected || (chatType ==='mentorToUser'&& messages.length === 0);

 const sendMessage = async (e) => {
 e.preventDefault();

 if (!newMessage.trim() || !chatId || isSending || !chatType) return;

 if (!isConnected || !socket) {
 toast.error('Not connected to server. Please wait...');
 return;
 }

 const messageToSend = newMessage.trim();
 setNewMessage('');
 setIsSending(true);

 if (chatType ==='mentorToUser') {
 // Check if this is a reply to an existing conversation
 if (messages.length === 0) {
 toast.error('You can only reply to existing conversations');
 setIsSending(false);
 return;
 }
 socketSendMessage({
 chatId,
 senderId: mentor._id,
 message: messageToSend,
 senderRole:'mentor'
 });
 } else {
 socket.emit('send_mentor_to_mentor_message', {
 chatId,
 message: messageToSend
 });
 }

 setTimeout(() => {
 setIsSending(false);
 }, 5000);
 };

 const formatTime = (timestamp) => {
 if (!timestamp) return'';

 const date = new Date(timestamp);
 const now = new Date();
 const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

 if (diffInHours < 24) {
 return date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'});
 } else {
 return date.toLocaleDateString([], {
 month:'short',
 day:'numeric',
 hour:'2-digit',
 minute:'2-digit'
 });
 }
 };

 const getMessageStatus = (message) => {
 if (message.status ==='read') return <FaCheckDouble className="text-pink-200 text-xs"/>;
 if (message.status ==='delivered') return <FaCheck className="text-pink-200/70 text-xs"/>;
 return <FaCheck className="text-pink-200/50 text-xs"/>;
 };

 if (isLoading && !otherPerson) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse"/>
 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"style={{ animationDelay:'1s'}} />
 <div className="text-center relative z-10">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562] mx-auto mb-4"></div>
 <p className="text-gray-700 font-medium">Loading chat...</p>
 </div>
 </div>
 );
 }

 return (
 <main
 className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex flex-col transition-all duration-300 relative selection:bg-[#9f3562]/20 selection:text-[#9f3562]"
 >
 
 {/* Enhanced Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'8s'}} />
 <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'10s'}} />
 <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'6s'}} />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"/>
 </div>
 
 {/* Header */}
 <div className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 z-50 sticky top-0">
 <div className="max-w-4xl mx-auto px-4 py-3">
 <div className="flex items-center gap-4">
 <button
 onClick={() => navigate('/mentor/chats')}
 className="text-xl p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#9f3562] cursor-pointer relative z-10"
 >
 <ArrowLeft className="w-5 h-5"/>
 </button>

 <div className="flex items-center gap-3">
 <div className="relative">
 {otherPerson?.username ? (
 <Link
 to={`/${otherPerson.username}`}
 className="cursor-pointer relative block"
 >
 <img
 src={otherPerson?.image || fallbackProfilePic}
 alt={otherPerson?.name || (chatType ==='mentorToUser'?'Student':'Mentor')}
 className="w-10 h-10 rounded-full object-cover transition-all"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 </Link>
 ) : (
 <div className="cursor-pointer relative block">
 <img
 src={otherPerson?.image || fallbackProfilePic}
 alt={otherPerson?.name || (chatType ==='mentorToUser'?'Student':'Mentor')}
 className="w-10 h-10 rounded-full object-cover transition-all"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 </div>
 )}
 {id && (
 <div className="absolute -bottom-0 -right-0">
 <FaCircle
 className={`text-xs z-15 ${
 (chatType ==='mentorToUser'&& isUserOnline(id)) || 
 (chatType ==='mentorToMentor'&& isMentorOnline(id))
 ?'text-green-500'
 :'text-gray-400'
 }`}
 />
 </div>
 )}
 </div>
 <div>
 <h2 className="font-semibold text-gray-900">
 {otherPerson?.name || (chatType ==='mentorToUser'?'Student':'Mentor')}
 </h2>
 <div className="flex items-center gap-2">
 {otherPerson?.username && (
 <p className="text-sm text-gray-500">
 @{otherPerson.username}
 </p>
 )}
 {!otherPerson?.username && chatType ==='mentorToUser'&& (
 <p className="text-sm text-gray-500">
 Student
 </p>
 )}
 {!otherPerson?.username && chatType ==='mentorToMentor'&& (
 <p className="text-sm text-gray-500">
 Mentor
 </p>
 )}
 {id && (
 <span className={`text-xs px-2 py-1 rounded-full ${
 (chatType ==='mentorToUser'&& isUserOnline(id)) || 
 (chatType ==='mentorToMentor'&& isMentorOnline(id))
 ?'bg-green-100 text-green-700'
 :'bg-gray-100 text-gray-600'
 }`}>
 {(chatType ==='mentorToUser'&& isUserOnline(id)) || 
 (chatType ==='mentorToMentor'&& isMentorOnline(id))
 ?'Online'
 :'Offline'}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Messages Container */}
 <div className="flex-1 px-4 py-4 pt-32 pb-24 relative z-10">
 <div className="max-w-4xl mx-auto">
 {error && (
 <div className="text-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-red-200 shadow-xl shadow-gray-200/50">
 <p className="text-red-500 mb-4">{error}</p>
 <button
 onClick={() => initializeChat()}
 className="px-6 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300"
 >
 Try Again
 </button>
 </div>
 )}

 {connectionError && (
 <div className="mb-4 p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl text-yellow-800 text-sm shadow-sm">
 Connection unstable. Messages may be delayed.
 </div>
 )}

 {!error && messages.length === 0 && (
 <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
 <FaUser className="mx-auto text-6xl text-[#9f3562]/30 mb-4"/>
 <h3 className="text-xl font-semibold text-gray-900 mb-2">
 No conversation yet
 </h3>
 <p className="text-gray-600">
 {chatType ==='mentorToUser'
 ?'This student hasn\'t started a conversation with you yet. You can only reply to messages they send you.'
 :'Send your first message to begin chatting with this mentor'}
 </p>
 </div>
 )}

 <div className="space-y-4">
 {messages.map((message, index) => {
 // Normalize sender data - use backend fields with fallbacks
 const senderId = message.senderId;
 const senderName = message.senderName ||'Unknown';
 const senderImage = message.senderImage || fallbackProfilePic;
 const senderRole = message.senderRole || (message.senderId === mentor?._id || message.senderId === mentor?.id ?'mentor':'user');
 
 // Determine if message is from current mentor
 const isMentor = senderId === mentor?._id || senderId === mentor?.id || senderRole ==='mentor';
 
 // Check if previous message is from same sender
 const prevMessage = index > 0 ? messages[index - 1] : null;
 const isPreviousMessageFromSameSender = prevMessage && 
 (prevMessage.senderId?.toString() === senderId?.toString() || 
 (prevMessage.senderId && senderId && prevMessage.senderId.toString() === senderId.toString()));


 return (
 <div
 key={message._id ||`msg-${index}`}
 className={`flex items-end gap-2 ${isMentor ?'justify-end':'justify-start'}`}
 >
 {/* Sender Avatar - always reserve space for alignment */}
 <div className="flex-shrink-0 w-10">
 {!isPreviousMessageFromSameSender && !isMentor && (
 <img
 src={senderImage || fallbackProfilePic}
 alt={senderName ||'User'}
 className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 )}
 </div>
 
 {/* Message Bubble */}
 <div
 className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isMentor
 ?'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-br-md'
 :'bg-white/95 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200'
 } ${isPreviousMessageFromSameSender ?'mt-1':'mt-4'}`}
 >
 {/* Sender Name - only show if not from same sender as previous message */}
 {!isPreviousMessageFromSameSender && !isMentor && (
 <p className="text-xs font-semibold text-gray-700 mb-1">{senderName}</p>
 )}
 
 <p className="text-sm leading-relaxed">{message.message || message.text ||''}</p>
 <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isMentor ?'text-pink-100':'text-gray-500'}`}>
 <span>{formatTime(message.createdAt || message.timestamp)}</span>
 {isMentor && getMessageStatus(message)}
 </div>
 </div>
 
 {/* Sender Avatar for mentor messages - always reserve space for alignment */}
 <div className="flex-shrink-0 w-10">
 {!isPreviousMessageFromSameSender && isMentor && (
 <img
 src={mentor?.image || mentor?.imageUrl || fallbackProfilePic}
 alt={mentor?.name ||'You'}
 className="w-8 h-8 rounded-full object-cover ring-2 ring-[#9f3562]/30"
 onError={(e) => {
 e.target.src = fallbackProfilePic;
 }}
 />
 )}
 </div>
 </div>
 );
 })}
 </div>
 <div ref={messagesEndRef} />
 </div>
 </div>

 {/* Message Input */}
 <div className="backdrop-blur-xl max-[400px]:p-1.5 p-4 fixed bottom-0 left-0 right-0 z-10 shadow-lg">
 <div className="max-w-4xl mx-auto">
 {/* Connection Status */}
 {!isConnected && (
 <div className="mb-3 text-center">
 <span className="text-sm text-orange-600 bg-orange-100/80 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-200">
 Connecting to chat...
 </span>
 </div>
 )}

 <form onSubmit={sendMessage} className="flex gap-3">
 <input
 type="text"
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 placeholder={`Message ${otherPerson?.name || (chatType ==='mentorToUser'?'student':'mentor')}...`}
 className="flex-1 max-[400px]:pl-2.25 px-4 max-[400px]:py-0.5 py-3 max-[400px]:text-sm bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100 text-gray-900 placeholder:text-gray-500 shadow-sm"
 disabled={isInputDisabled}
 />
 <button
 type="submit"
 disabled={!newMessage.trim() || isInputDisabled}
 className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 shadow-sm ${newMessage.trim() && !isInputDisabled
 ?'bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white hover:scale-105 active:scale-95'
 :'bg-gray-300 text-gray-500 cursor-not-allowed'
 }`}
 >
 <FaPaperPlane className="text-sm"/>
 <span className="max-[400px]:hidden">
 {isSending
 ?'Sending...'
 : !isConnected
 ?'Offline'
 : chatType ==='mentorToUser'
 ?'Reply'
 :'Send'}
 </span>
 </button>
 </form>
 </div>
 </div>
 </main>
 );
};

export default MentorChat;