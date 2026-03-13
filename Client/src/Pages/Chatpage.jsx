import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaPaperPlane,
  FaUser,
  FaCheck,
  FaCheckDouble,
  FaCircle,
  FaPaperclip,
} from "react-icons/fa";
import { Image, File } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import { ArrowLeft } from "lucide-react";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";
import SEO from "../components/SEO";

const SharedPostCard = ({ post }) => {
  const navigate = useNavigate();

  if (!post) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-400 italic">
        Post no longer available
      </div>
    );
  }

  const getPlainText = (html = "", maxLength = 100) => {
    const plain = html.replace(/<[^>]*>/g, "").trim();
    return plain.length > maxLength
      ? plain.substring(0, maxLength) + "..."
      : plain;
  };

  const author = post.author || post.mentor;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/posts/${post._id}`);
      }}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden cursor-pointer hover:border-[#9f3562]/30 hover:shadow-md transition-all duration-200 max-w-xs"
    >
      {post.image && (
        <img
          src={post.image}
          alt="Shared post"
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={
              author?.image ||
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
            }
            alt={author?.name || "User"}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs font-semibold text-gray-700 truncate">
            {author?.name || "User"}
          </span>
        </div>
        {post.content && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {getPlainText(post.content)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Heart className="w-3 h-3" />
            {post.likesCount || 0}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircle className="w-3 h-3" />
            {post.commentsCount || 0}
          </span>
          <span className="text-xs text-[#9f3562] ml-auto font-medium flex items-center gap-1">
            View post <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

const Chatpage = () => {
  const { id } = useParams(); // Changed from mentorId to id
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    socket,
    isConnected,
    joinChat,
    sendMessage: socketSendMessage,
    isMentorOnline,
    isUserOnline,
  } = useSocket();
  const [otherPerson, setOtherPerson] = useState(null);
  const [chatType, setChatType] = useState(null); // 'userToMentor' or 'userToUser'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const initializationDone = useRef(false);
  const menuCloseTimeoutRef = useRef(null);

  const fallbackProfilePic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        if (menuCloseTimeoutRef.current) {
          clearTimeout(menuCloseTimeoutRef.current);
          menuCloseTimeoutRef.current = null;
        }
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAttachmentMenu]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (menuCloseTimeoutRef.current) {
        clearTimeout(menuCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only users can access user chats
    if (!user) {
      navigate("/login");
      return;
    }

    if (id) {
      // Reset initialization flag when id changes
      if (initializationDone.current !== id) {
        initializationDone.current = id;
        initializeChat();
      }
    }
  }, [id, user, navigate]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionError(false);
      setChatType(null); // Reset chat type
      setChatId(null); // Reset chat ID

      console.log("Initializing chat with ID:", id);

      // Try user-to-mentor chat first
      let chatResponse = await fetch(`/api/chats/${id}`, {
        method: "POST",
        credentials: "include",
      });

      console.log("User-to-mentor chat response status:", chatResponse.status);

      let chatData;

      if (chatResponse.ok) {
        chatData = await chatResponse.json();
        console.log("User-to-mentor chat data:", chatData);
        if (chatData.success && chatData.chat) {
          // User-to-mentor chat
          setChatType("userToMentor");
          setChatId(chatData.chat.chatId);
          setOtherPerson({
            _id: chatData.chat.mentorId,
            name: chatData.chat.mentorName,
            username: chatData.chat.mentorUsername,
            image: chatData.chat.mentorImage,
          });
          await fetchMessages(chatData.chat.chatId, "userToMentor");

          // Join socket room after setting chatType
          if (isConnected && socket) {
            joinChat(chatData.chat.chatId);
          } else {
            setTimeout(() => {
              if (isConnected && socket && chatData.chat.chatId) {
                joinChat(chatData.chat.chatId);
              }
            }, 100);
            if (socket) {
              socket.once("authenticated", () => {
                if (chatData.chat.chatId) joinChat(chatData.chat.chatId);
              });
            }
          }
          setIsLoading(false);
          return;
        } else {
          console.warn(
            "User-to-mentor chat response was OK but success is false or chat is missing:",
            chatData,
          );
        }
      } else {
        // Log the error for debugging
        const errorData = await chatResponse.json().catch(() => ({}));
        console.error(
          "User-to-mentor chat failed:",
          chatResponse.status,
          errorData,
        );
      }

      // If user-to-mentor failed (404 or other error), try user-to-user chat
      console.log("Trying user-to-user chat...");
      chatResponse = await fetch(`/api/user-chats/${id}`, {
        method: "POST",
        credentials: "include",
      });

      console.log("User-to-user chat response status:", chatResponse.status);

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        console.error(
          "User-to-user chat failed:",
          chatResponse.status,
          errorData,
        );
        throw new Error(errorData.message || "Failed to access chat");
      }

      chatData = await chatResponse.json();
      console.log("User-to-user chat data:", chatData);

      if (!chatData.success || !chatData.chat) {
        console.error("Invalid user-to-user chat response:", chatData);
        throw new Error("Invalid chat response");
      }

      // User-to-user chat
      setChatType("userToUser");
      setChatId(chatData.chat.chatId);
      setOtherPerson({
        _id: chatData.chat.otherUserId,
        name: chatData.chat.otherUserName,
        username: chatData.chat.otherUserUsername,
        image: chatData.chat.otherUserImage,
      });
      await fetchMessages(chatData.chat.chatId, "userToUser");

      // Join socket room after setting chatType
      if (isConnected && socket) {
        socket.emit("join_user_to_user_chat", chatData.chat.chatId);
      } else {
        setTimeout(() => {
          if (isConnected && socket && chatData.chat.chatId) {
            socket.emit("join_user_to_user_chat", chatData.chat.chatId);
          }
        }, 100);
        if (socket) {
          socket.once("authenticated", () => {
            if (chatData.chat.chatId)
              socket.emit("join_user_to_user_chat", chatData.chat.chatId);
          });
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing chat:", error);
      setError("Failed to load chat");
      setIsLoading(false);
      toast.error("Failed to initialize chat");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat room when socket becomes connected
  useEffect(() => {
    // Only join if we have all required data
    if (isConnected && socket && chatId && chatType) {
      if (chatType === "userToMentor") {
        joinChat(chatId);
      } else if (chatType === "userToUser") {
        socket.emit("join_user_to_user_chat", chatId);
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
          senderName:
            message.senderName ||
            (message.senderId === user?._id || message.senderId === user?.id
              ? user?.name
              : "Unknown"),
          senderImage:
            message.senderImage ||
            (message.senderId === user?._id || message.senderId === user?.id
              ? user?.image
              : null),
          senderRole:
            message.senderRole ||
            (message.senderId === user?._id || message.senderId === user?.id
              ? "user"
              : "mentor"),
          message: message.message || message.text || "",
          createdAt: message.createdAt || message.timestamp || new Date(),
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (m) =>
              m._id &&
              normalizedMessage._id &&
              m._id.toString() === normalizedMessage._id.toString(),
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

    const handleUserToUserMessage = (message) => {
      if (message.chatId && message.chatId.toString() === chatId.toString()) {
        // Normalize message data - ensure sender info is present
        const normalizedMessage = {
          ...message,
          senderName:
            message.senderName ||
            (message.senderId === user?._id || message.senderId === user?.id
              ? user?.name
              : "Unknown"),
          senderImage:
            message.senderImage ||
            (message.senderId === user?._id || message.senderId === user?.id
              ? user?.image
              : null),
          senderRole: message.senderRole || "user",
          message: message.message || message.text || "",
          createdAt: message.createdAt || message.timestamp || new Date(),
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (m) =>
              m._id &&
              normalizedMessage._id &&
              m._id.toString() === normalizedMessage._id.toString(),
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
      console.error("Message error:", error);
      toast.error(error.message || "Failed to send message");
      setIsSending(false);
    };

    const handleMessageSent = (message) => {
      if (message.chatId && message.chatId.toString() === chatId.toString()) {
        // Normalize message data - ensure sender info is present
        const normalizedMessage = {
          ...message,
          senderName: message.senderName || user?.name || "You",
          senderImage: message.senderImage || user?.image || null,
          senderRole: message.senderRole || "user",
          message: message.message || message.text || "",
          createdAt: message.createdAt || message.timestamp || new Date(),
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (m) =>
              m._id &&
              normalizedMessage._id &&
              m._id.toString() === normalizedMessage._id.toString(),
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

    if (chatType === "userToMentor") {
      socket.on("receive_message", handleReceiveMessage);
      socket.on("message_sent", handleMessageSent);
    } else {
      socket.on("receive_user_to_user_message", handleUserToUserMessage);
      socket.on("user_to_user_message_sent", handleMessageSent);
    }
    socket.on("message_error", handleMessageError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("receive_user_to_user_message", handleUserToUserMessage);
      socket.off("message_error", handleMessageError);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_to_user_message_sent", handleMessageSent);
    };
  }, [socket, chatId, chatType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (chatIdParam, type) => {
    try {
      let response;
      if (type === "userToMentor") {
        response = await fetch(`/api/chats/${id}/messages`, {
          credentials: "include",
        });
      } else {
        response = await fetch(`/api/user-chats/${id}/messages`, {
          credentials: "include",
        });
      }

      if (!response.ok) {
        if (response.status === 404) {
          setMessages([]);
          setError(null);
        } else {
          throw new Error("Failed to fetch messages");
        }
      } else {
        const data = await response.json();

        // Normalize messages - ensure all have required sender fields
        const normalizedMessages = (data.messages || []).map((msg) => {
          const normalized = {
            ...msg,
            senderName: msg.senderName || "Unknown",
            senderImage: msg.senderImage || null,
            senderRole:
              msg.senderRole ||
              (msg.senderId === user?._id || msg.senderId === user?.id
                ? "user"
                : "mentor"),
            message: msg.message || msg.text || "",
            createdAt: msg.createdAt || msg.timestamp || new Date(),
          };

          return normalized;
        });

        setMessages(normalizedMessages);
        setChatId(data.chatId);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (!err.message.includes("404")) {
        setError(err.message);
        toast.error("Failed to load messages");
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || isSending || !chatType) return;

    if (!isConnected || !socket) {
      toast.error("Not connected to server. Please wait...");
      return;
    }

    const messageToSend = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    if (chatType === "userToMentor") {
      socketSendMessage({
        chatId,
        senderId: user._id,
        message: messageToSend,
        senderRole: "user",
      });
    } else {
      socket.emit("send_user_to_user_message", {
        chatId,
        message: messageToSend,
      });
    }

    setTimeout(() => {
      setIsSending(false);
    }, 5000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getMessageStatus = (message) => {
    if (message.status === "read")
      return <FaCheckDouble className="text-pink-200 text-xs" />;
    if (message.status === "delivered")
      return <FaCheck className="text-pink-200/70 text-xs" />;
    return <FaCheck className="text-pink-200/50 text-xs" />;
  };

  if (isLoading && !otherPerson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562] mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex flex-col transition-all duration-300 relative selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      <SEO
        title={`${otherPerson?.name || "Chat"} | Admeasy`}
        description={`Chat with ${otherPerson?.name || "User"} on Admeasy`}
        keywords={`${otherPerson?.name || "Chat"}, chat, messages, communication`}
        url={`https://admeasy.in/chats/${id}`}
      />
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 z-50 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-xl p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 hover:text-[#9f3562] cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Link
                  to={`/${otherPerson?.username}`}
                  className="cursor-pointer relative block"
                >
                  <img
                    src={otherPerson?.image || fallbackProfilePic}
                    alt={otherPerson?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover transition-all"
                    onError={(e) => {
                      e.target.src = fallbackProfilePic;
                    }}
                  />
                </Link>
                {id && (
                  <div className="absolute -bottom-0 -right-0">
                    <FaCircle
                      className={`text-xs z-15 ${
                        (chatType === "userToMentor" && isMentorOnline(id)) ||
                        (chatType === "userToUser" && isUserOnline(id))
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {otherPerson?.name || "User"}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {otherPerson?.username || "User"}
                  </p>
                  {id && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        (chatType === "userToMentor" && isMentorOnline(id)) ||
                        (chatType === "userToUser" && isUserOnline(id))
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(chatType === "userToMentor" && isMentorOnline(id)) ||
                      (chatType === "userToUser" && isUserOnline(id))
                        ? "Online"
                        : "Offline"}
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
              <FaUser className="mx-auto text-6xl text-[#9f3562]/30 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600">
                Send your first message to begin chatting with{" "}
                {otherPerson?.name || "this user"}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => {
              // Normalize sender data - use backend fields with fallbacks
              const senderId = message.senderId;
              const senderName = message.senderName || "Unknown";
              const senderImage = message.senderImage || fallbackProfilePic;
              const senderRole =
                message.senderRole ||
                (message.senderId === user?._id || message.senderId === user?.id
                  ? "user"
                  : "mentor");

              // Determine if message is from current user
              const isUser =
                senderId === user?._id ||
                senderId === user?.id ||
                senderRole === "user";

              // Check if previous message is from same sender
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isPreviousMessageFromSameSender =
                prevMessage &&
                (prevMessage.senderId?.toString() === senderId?.toString() ||
                  (prevMessage.senderId &&
                    senderId &&
                    prevMessage.senderId.toString() === senderId.toString()));

              return (
                <div
                  key={message._id || `msg-${index}`}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Sender Avatar - always reserve space for alignment */}
                  <div className="flex-shrink-0 w-10">
                    {!isPreviousMessageFromSameSender && !isUser && (
                      <img
                        src={senderImage || fallbackProfilePic}
                        alt={senderName || "User"}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                        onError={(e) => {
                          e.target.src = fallbackProfilePic;
                        }}
                      />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      isUser
                        ? "bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-br-md"
                        : "bg-white/95 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-200"
                    } ${isPreviousMessageFromSameSender ? "mt-1" : "mt-4"}`}
                  >
                    {/* Sender Name - only show if not from same sender as previous message */}
                    {!isPreviousMessageFromSameSender && !isUser && (
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        {senderName}
                      </p>
                    )}
                    {/* <p className="text-sm leading-relaxed">{message.message || message.text || ''}</p> */}
                    {message.messageType === "post" ? (
                      <SharedPostCard post={message.post} />
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {message.message || message.text || ""}
                      </p>
                    )}
                    {message.messageType === "post" && message.message && (
                      <p className="text-sm leading-relaxed mt-2">
                        {message.message}
                      </p>
                    )}
                    {/* // Timestamp and status - only show if not from same sender
                    as previous message */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-xs ${isUser ? "text-pink-100" : "text-gray-500"}`}
                    >
                      <span>
                        {formatTime(message.createdAt || message.timestamp)}
                      </span>
                      {isUser && getMessageStatus(message)}
                    </div>
                  </div>

                  {/* Sender Avatar for user messages - always reserve space for alignment */}
                  <div className="flex-shrink-0 w-10">
                    {!isPreviousMessageFromSameSender && isUser && (
                      <img
                        src={
                          user?.image || user?.imageUrl || fallbackProfilePic
                        }
                        alt={user?.name || "You"}
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
      <div className="backdrop-blur-xl max-[400px]:p-1.5 p-4 fixed bottom-0 left-0 right-0 z-10 shadow-lg bg-white/95">
        <div className="max-w-4xl mx-auto">
          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-3 text-center">
              <span className="text-sm text-orange-600 bg-orange-100/80 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-200">
                Connecting to chat...
              </span>
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 relative"
          >
            {/* Attachment Icon - Left Side */}
            <div
              className="relative"
              ref={attachmentMenuRef}
              onMouseEnter={() => {
                // Clear any pending close timeout
                if (menuCloseTimeoutRef.current) {
                  clearTimeout(menuCloseTimeoutRef.current);
                  menuCloseTimeoutRef.current = null;
                }
                // Only show on hover for desktop (screens wider than 768px)
                if (window.innerWidth > 768) {
                  setShowAttachmentMenu(true);
                }
              }}
              onMouseLeave={() => {
                // Only hide on hover leave for desktop with a small delay
                if (window.innerWidth > 768) {
                  menuCloseTimeoutRef.current = setTimeout(() => {
                    setShowAttachmentMenu(false);
                  }, 100); // Small delay to allow mouse to move to menu
                }
              }}
            >
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-[#9f3562] flex-shrink-0"
                disabled={isSending || !isConnected}
              >
                <FaPaperclip className="w-5 h-5" />
              </button>

              {/* Attachment Menu Popup - Compact */}
              {showAttachmentMenu && (
                <div
                  className="absolute bottom-full left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 min-w-[140px] z-50"
                  style={{ marginBottom: "0.5rem" }}
                  onMouseEnter={() => {
                    // Clear any pending close timeout when entering menu
                    if (menuCloseTimeoutRef.current) {
                      clearTimeout(menuCloseTimeoutRef.current);
                      menuCloseTimeoutRef.current = null;
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      toast.info("Coming soon!", {
                        position: "bottom-center",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                      });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900">
                      Photo
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      toast.info("Coming soon!", {
                        position: "bottom-center",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                      });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <File className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900">
                      Document
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Input Field - Full Width with Padding Equal to Icon Width */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${otherPerson?.name || "user"}...`}
              className="flex-1 w-full py-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100 text-gray-900 placeholder:text-gray-500 shadow-sm text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
              style={{
                paddingLeft: "2.5rem", // Equal to icon width (40px = 2.5rem)
                paddingRight: "2.5rem", // Equal to icon width (40px = 2.5rem)
              }}
              disabled={isSending || !isConnected}
            />

            {/* Send Icon - Right Side */}
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !isConnected}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 ${
                newMessage.trim() && !isSending && isConnected
                  ? "bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Chatpage;
