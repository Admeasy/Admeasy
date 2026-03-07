import { useState, useEffect, useRef } from "react";
import { X, Search, Send, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
// import { useUser } from '../context/UserContext';
import { useMentor } from "../context/MentorContext";
// import { motion, AnimatePresence } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars

const SharePostModal = ({ post, isOpen, onClose }) => {
  // const { user } = useUser();
  const { mentor } = useMentor();

  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [optionalMessage, setOptionalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const searchRef = useRef(null);

  const fallbackProfilePic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // Fetch chats when modal opens
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        if (mentor) {
          // Mentor: fetch mentor chats (user-to-mentor) and mentor-to-mentor
          const [mentorChatsRes, m2mChatsRes] = await Promise.all([
            fetch("/api/mentor/chats", { credentials: "include" }),
            fetch("/api/mentor/mentor-chats", { credentials: "include" }),
          ]);

          const mentorChatsData = mentorChatsRes.ok
            ? await mentorChatsRes.json()
            : { chats: [] };
          const m2mChatsData = m2mChatsRes.ok
            ? await m2mChatsRes.json()
            : { chats: [] };

          const allChats = [
            ...(mentorChatsData.chats || []).map((c) => ({
              ...c,
              chatType: "userToMentor",
              displayName: c.userName || c.otherUserName || "User",
              displayImage: c.userImage || c.otherUserImage,
              otherPersonId: c.userId || c.otherUserId,
            })),
            ...(m2mChatsData.chats || []).map((c) => ({
              ...c,
              chatType: "mentorToMentor",
              displayName: c.otherMentorName || "Mentor",
              displayImage: c.otherMentorImage,
              otherPersonId: c.otherMentorId,
            })),
          ];
          setChats(allChats);
        } else {
          // User: fetch user-to-mentor chats and user-to-user chats
          const [userChatsRes, u2uChatsRes] = await Promise.all([
            fetch("/api/chats", { credentials: "include" }),
            fetch("/api/user-chats", { credentials: "include" }),
          ]);

          const userChatsData = userChatsRes.ok
            ? await userChatsRes.json()
            : { chats: [] };
          const u2uChatsData = u2uChatsRes.ok
            ? await u2uChatsRes.json()
            : { chats: [] };

          const allChats = [
            ...(userChatsData.chats || []).map((c) => ({
              ...c,
              displayName: c.mentorName || c.otherUserName || "User",
              displayImage: c.mentorImage || c.otherUserImage,
              otherPersonId: c.mentorId || c.otherUserId,
            })),
            ...(u2uChatsData.chats || []).map((c) => ({
              ...c,
              chatType: "userToUser",
              displayName: c.otherUserName || "User",
              displayImage: c.otherUserImage,
              otherPersonId: c.otherUserId,
            })),
          ];
          setChats(allChats);
        }
      } catch (err) {
        console.error("Error fetching chats for share modal:", err);
        toast.error("Failed to load chats");
      } finally {
        setIsLoadingChats(false);
      }
    };

    if (!isOpen) {
      // Reset state when modal closes
      setSelectedChat(null);
      setOptionalMessage("");
      setSearchQuery("");
      setSent(false);
      return;
    }
    fetchChats();
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  const filteredChats = chats.filter((chat) =>
    chat.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSend = async () => {
    if (!selectedChat || isSending) return;

    setIsSending(true);
    try {
      const body = {
        messageType: "post",
        postId: post._id,
        message: optionalMessage.trim() || null,
      };

      let endpoint = "";
      const otherId = selectedChat.otherPersonId;
      const chatType = selectedChat.chatType;

      if (chatType === "userToMentor") {
        // User sending to mentor OR mentor replying to user
        endpoint = mentor
          ? `/api/mentor/chats/${otherId}/messages`
          : `/api/chats/${otherId}/messages`;
      } else if (chatType === "userToUser") {
        endpoint = `/api/user-chats/${otherId}/messages`;
      } else if (chatType === "mentorToMentor") {
        endpoint = `/api/mentor/mentor-chats/${otherId}/messages`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.message || "Failed to share post");
      }
    } catch (err) {
      console.error("Error sharing post:", err);
      toast.error(err.message || "Failed to share post");
    } finally {
      setIsSending(false);
    }
  };

  // Truncate HTML content to plain text
  const getPlainText = (html = "", maxLength = 80) => {
    const plain = html.replace(/<[^>]*>/g, "").trim();
    return plain.length > maxLength
      ? plain.substring(0, maxLength) + "..."
      : plain;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-300/50 w-full max-w-md pointer-events-auto border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Share Post</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Post Preview */}
              <div className="mx-4 mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 overflow-hidden">
                <div className="flex gap-3 p-3">
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#9f3562] mb-1">
                      {post.author?.name || post.mentor?.name || "Post"}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {getPlainText(post.content)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Message Input */}
              <div className="px-4 mt-3">
                <input
                  type="text"
                  value={optionalMessage}
                  onChange={(e) => setOptionalMessage(e.target.value)}
                  placeholder="Add a message... (optional)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/40 focus:border-[#9f3562]/50 transition-all"
                />
              </div>

              {/* Search Chats */}
              <div className="px-4 mt-3 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/40 focus:border-[#9f3562]/50 transition-all"
                />
              </div>

              {/* Chat List */}
              <div className="px-4 mt-3 mb-4 max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
                {isLoadingChats ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    {searchQuery ? "No chats found" : "No chats available"}
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
                        onClick={() =>
                          setSelectedChat(isSelected ? null : chat)
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                          isSelected
                            ? "bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 border border-[#9f3562]/30"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <img
                          src={chat.displayImage || fallbackProfilePic}
                          alt={chat.displayName}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
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
                          <CheckCircle2 className="w-5 h-5 text-[#9f3562] flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Send Button */}
              <div className="px-4 pb-4">
                <motion.button
                  whileHover={{ scale: selectedChat && !isSending ? 1.02 : 1 }}
                  whileTap={{ scale: selectedChat && !isSending ? 0.98 : 1 }}
                  onClick={handleSend}
                  disabled={!selectedChat || isSending || sent}
                  className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    selectedChat && !isSending && !sent
                      ? "bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-lg shadow-[#9f3562]/25 hover:shadow-[#9f3562]/40"
                      : sent
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Sent!
                    </>
                  ) : isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {selectedChat
                        ? `Send to ${selectedChat.displayName}`
                        : "Select a chat to send"}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SharePostModal;
