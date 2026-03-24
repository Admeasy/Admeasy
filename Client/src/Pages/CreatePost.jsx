import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ImagePlus,
  Loader2,
  Send,
  X,
  Globe,
  Calendar,
  AtSign,
  User,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";
import ReactQuill, { Quill } from "react-quill-new";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import "react-quill-new/dist/quill.snow.css";
import TableUI from "quill-table-ui";
import "quill-table-ui/dist/index.css";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import { processMentions } from "../utils/processMentions";
import CreateNoteTab from "../components/CreateNoteTab";
import CreatePollTab from "../components/CreatePollTab";
import PollCard from "../components/PollCard";

// Registration stays the same...
Quill.register("modules/tableUI", TableUI, true);

const MentorPost = () => {
  const navigate = useNavigate();
  const pathname = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { mentor } = useMentor();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  // NEW: Hashtag State
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");

  // Check if coming from "Ask a Doubt" CTA
  const isAskDoubt = searchParams.get("askDoubt") === "true";

  // Mention feature state
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionSearching, setMentionSearching] = useState(false);
  const quillRef = useRef(null);
  const mentionTimeoutRef = useRef(null);
  const mentionPopupRef = useRef(null);
  const hasAutoFocusedRef = useRef(false);
  const [activeTab, setActiveTab] = useState("post");
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "link"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["table"],
      ],
      table: true,
      tableUI: true,
    }),
    [],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Auto-focus editor when coming from "Ask a Doubt" CTA
  useEffect(() => {
    if (isAskDoubt && quillRef.current && !hasAutoFocusedRef.current) {
      const timer = setTimeout(() => {
        try {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            quill.focus();
            // Move cursor to the beginning
            quill.setSelection(0, 0);
            hasAutoFocusedRef.current = true;
          }
        } catch (error) {
          console.error("Error focusing editor:", error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isAskDoubt]);

  /* ----------------------------------
     Fetch Mentor Posts
  ----------------------------------- */
  const fetchPosts = async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/posts", {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch posts");
      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !mentor) {
      toast.info("Please log in to create posts");
      navigate("/login");
    }
  }, [user, mentor, navigate]);

  // Fetch mention suggestions
  const fetchMentionSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setMentionSuggestions([]);
      return;
    }

    try {
      setMentionSearching(true);
      const response = await fetch(
        `/api/posts/mentions/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();

      if (data.success) {
        setMentionSuggestions(data.results || []);
        setSelectedMentionIndex(0);
      }
    } catch (error) {
      console.error("Error fetching mentions:", error);
      setMentionSuggestions([]);
    } finally {
      setMentionSearching(false);
    }
  }, []);

  // Debounced mention search
  useEffect(() => {
    if (mentionTimeoutRef.current) {
      clearTimeout(mentionTimeoutRef.current);
    }

    if (mentionQuery) {
      mentionTimeoutRef.current = setTimeout(() => {
        fetchMentionSuggestions(mentionQuery);
      }, 300);
    } else {
      setMentionSuggestions([]);
    }

    return () => {
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current);
      }
    };
  }, [mentionQuery, fetchMentionSuggestions]);

  // Handle mention detection in content
  const handleContentChange = (value) => {
    setContent(value);

    setTimeout(() => {
      if (!quillRef.current) return;
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection(true);

      if (!selection) {
        setShowMentionPopup(false);
        return;
      }

      const text = quill.getText(0, selection.index);
      const match = text.match(/@([a-zA-Z0-9_]*)$/);

      if (match) {
        const query = match[1];
        setMentionQuery(query);
        setShowMentionPopup(true);

        try {
          const bounds = quill.getBounds(selection.index);
          const editorElement =
            quill.root.closest(".ql-container") || quill.root;
          const editorRect = editorElement.getBoundingClientRect();

          setMentionPosition({
            top: editorRect.top + bounds.top + bounds.height + 5,
            left: editorRect.left + bounds.left,
          });
        } catch (e) {
          const editorElement =
            quill.root.closest(".ql-container") || quill.root;
          const editorRect = editorElement.getBoundingClientRect();
          setMentionPosition({
            top: editorRect.bottom + 5,
            left: editorRect.left,
          });
        }
      } else {
        setShowMentionPopup(false);
        setMentionQuery("");
      }
    }, 0);
  };

  // Insert mention into content
  const insertMention = useCallback((mention) => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection(true);

    if (!selection) return;

    const text = quill.getText(0, selection.index);
    const match = text.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      const startIndex = selection.index - match[0].length;
      quill.deleteText(startIndex, match[0].length);
      const mentionText = `@${mention.username || mention.name || "user"} `;
      quill.insertText(startIndex, mentionText);
      quill.setSelection(startIndex + mentionText.length);
      setContent(quill.root.innerHTML);
    }

    setShowMentionPopup(false);
    setMentionQuery("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showMentionPopup || mentionSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (mentionSuggestions[selectedMentionIndex]) {
          insertMention(mentionSuggestions[selectedMentionIndex]);
        }
      } else if (e.key === "Escape") {
        setShowMentionPopup(false);
        setMentionQuery("");
      }
    };

    if (showMentionPopup) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    showMentionPopup,
    mentionSuggestions,
    selectedMentionIndex,
    insertMention,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mentionPopupRef.current &&
        !mentionPopupRef.current.contains(e.target) &&
        !e.target.closest(".ql-editor")
      ) {
        setShowMentionPopup(false);
        setMentionQuery("");
      }
    };

    if (showMentionPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentionPopup]);

  /* ----------------------------------
     Handle Image Change
  ----------------------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ----------------------------------
     NEW: Hashtag Logic
  ----------------------------------- */
  const handleHashtagKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newTag = hashtagInput.trim().replace(/^#/, "");
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  /* ----------------------------------
     Create Post
  ----------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Post content is required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("content", content);
      if (image) formData.append("image", image);

      // Add hashtags to form data
      if (hashtags.length > 0) {
        formData.append("hashtags", JSON.stringify(hashtags));
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create post");
      }

      try {
        sessionStorage.setItem(
          "admeasy:askDoubt:lastPost",
          Date.now().toString(),
        );
        sessionStorage.removeItem("admeasy:askDoubt:dismissed");
      } catch (err) {
        console.error("Error tracking post creation:", err);
      }

      toast.success("Post published successfully 🚀");
      setContent("");
      setImage(null);
      setPreview(null);
      setHashtags([]); // Reset hashtags on success
      fetchPosts();

      if (isAskDoubt) {
        navigate("/posts/create", { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 bg-[#f8fafc] min-h-screen">
      <style>{`
        /* Modernized Quill */
        .ql-container.ql-snow { border: none !important; font-family: inherit; font-size: 1rem; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; }
        .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; }
        .ql-editor { min-height: 150px; padding: 16px !important; }
        
        /* Rich Text Content Styling */
        .post-content h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .post-content p { margin-bottom: 0.75rem; line-height: 1.6; }
        .post-content ul { list-style: disc; margin-left: 1.5rem; }
        .post-content table { border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
      `}</style>

      {/* --- CREATE POST CARD --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-10"
      >
        <div className="p-6">
          {/* <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-pink-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {isAskDoubt ? "Ask Your Doubt" : "Create Post"}
            </h2>
          </div> */}
          {/**======CREATE TABS===== */}
          {!isAskDoubt && (
            <>
              <div className="flex items-centre gap-3 mb-6 overflow-x-auto pb-1">
                {[
                  { label: "Post", value: "post", icon: "📝" },
                  { label: "Poll", value: "poll", icon: "📊" },
                  { label: "Q&A", value: "qa", icon: "❓" },
                  { label: "Notes", value: "notes", icon: "📒" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer border ${
                      activeTab === tab.value
                        ? "bg-[#9f3562] text-white border-transparent shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-200 border-gray-200"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Tab content heading */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-1 bg-pink-500 rounded-full" />
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {isAskDoubt
                    ? "Ask Your Doubt"
                    : activeTab === "post"
                    ? "Create Post"
                    : activeTab === "poll"
                    ? "Create Poll"
                    : activeTab === "qa"
                    ? "Create Q&A"
                    : "Upload Notes"}
                </h2>
              </div>
            </>
          )}
          {activeTab === "post" && (
            <>
              <div className="border border-slate-200 rounded-2xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300 relative">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder={
                    isAskDoubt
                      ? "What's your doubt? Ask a question and get help from mentors..."
                      : mentor
                      ? "What's on your mind, Mentor?"
                      : "What's on your mind?"
                  }
                />

                {/* Mention Popup */}
                <AnimatePresence>
                  {showMentionPopup && (
                    <motion.div
                      ref={mentionPopupRef}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed z-[100] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[280px] max-w-[320px] max-h-[300px] overflow-y-auto"
                      style={{
                        top: `${mentionPosition.top}px`,
                        left: `${mentionPosition.left}px`,
                      }}
                    >
                      {mentionSearching ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Searching...</span>
                        </div>
                      ) : mentionSuggestions.length > 0 ? (
                        <div className="py-1">
                          {mentionSuggestions.map((mention, index) => (
                            <motion.button
                              key={`${mention.type}-${mention._id}`}
                              whileHover={{ backgroundColor: "#f8fafc" }}
                              onClick={() => insertMention(mention)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                index === selectedMentionIndex
                                  ? "bg-gradient-to-r from-[#9f3562]/10 to-pink-50/50 border-l-2 border-[#9f3562]"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <img
                                src={
                                  mention.image ||
                                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                }
                                alt={mention.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 text-sm truncate">
                                    {mention.name || "User"}
                                  </span>
                                  {mention.type === "mentor" && (
                                    <GraduationCap className="w-3.5 h-3.5 text-[#9f3562] flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <AtSign className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs text-slate-500 truncate">
                                    {mention.username || "no-username"}
                                  </span>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      ) : mentionQuery ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No users found for "@{mentionQuery}"
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {preview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 pt-0 relative"
                    >
                      <div className="relative group">
                        <img
                          src={preview}
                          alt="Preview"
                          className="rounded-xl w-full max-h-72 object-cover border border-slate-100"
                        />
                        <button
                          onClick={() => {
                            setImage(null);
                            setPreview(null);
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-slate-800 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Hashtag Input for Post */}
              <div className="mt-4 mb-2 p-3 border border-slate-200 rounded-xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all flex flex-wrap gap-2 items-center bg-slate-50">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-[#9f3562]/10 text-[#9f3562] px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  className="flex-1 outline-none border-none bg-transparent min-w-[150px] text-sm text-slate-700 placeholder:text-slate-400"
                  placeholder={
                    hashtags.length === 0
                      ? "Add Hashtags to reach more people..."
                      : "Add more tags..."
                  }
                />
              </div>

              <div className="flex items-center justify-between mt-5">
                <label className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-all">
                  <ImagePlus
                    size={18}
                    className="text-pink-500 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm font-medium">Media</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative cursor-pointer group overflow-hidden bg-slate-900 text-white px-8 py-2.5 rounded-xl font-medium transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-70"
                >
                  <div className="flex items-center gap-2 relative z-10">
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    <span>{loading ? "Publishing..." : "Publish Post"}</span>
                  </div>
                </button>
              </div>
            </>
          )}{" "}
          {/* closes activeTab === "post" */}
          {/* Poll placeholder */}
          {activeTab === "poll" && <CreatePollTab />}
          {/* Q&A placeholder */}
          {activeTab === "qa" && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">❓</p>
              <p className="font-semibold text-gray-600">
                Q&A creation coming soon!
              </p>
            </div>
          )}
          {/* Notes placeholder */}
          {activeTab === "notes" && <CreateNoteTab />}
        </div>{" "}
        {/* closes p-6 */}
      </motion.div>

      {/* --- POSTS FEED --- */}
      <div className="space-y-8">
        {fetching ? (
          [1, 2, 3].map((i) => <PostSkeleton key={i} />)
        ) : (
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/posts/${post._id}`)}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div
                    className="flex items-center gap-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      const username = (post.author || post.mentor)?.username;
                      if (username) {
                        navigate(`/${username}`);
                      }
                    }}
                  >
                    <div className="relative cursor-pointer">
                      <img
                        src={
                          (post.author || post.mentor)?.image || "/avatar.png"
                        }
                        alt={(post.author || post.mentor)?.name || "User"}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-slate-900 leading-none mb-1 cursor-pointer hover:text-[#9f3562] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const username = (post.author || post.mentor)
                            ?.username;
                          if (username) {
                            navigate(`/${username}`);
                          }
                        }}
                      >
                        {(post.author || post.mentor)?.name || "User"}
                      </h3>
                      {(post.author || post.mentor)?.username && (
                        <p
                          className="text-sm text-slate-500 cursor-pointer hover:text-[#9f3562] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/${(post.author || post.mentor).username}`,
                            );
                          }}
                        >
                          @{(post.author || post.mentor).username}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar size={12} />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Content */}
                {post.type === "poll" ? (
                  <PollCard
                    post={post}
                    onVote={(updatePost) =>
                      setPosts((prev) =>
                        prev.map((p) =>
                          p._id === updatePost._id ? updatePost : p,
                        ),
                      )
                    }
                  />
                ) : (
                  <div
                    className="text-[15px] text-slate-700 post-content leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: post.content ? processMentions(post.content) : "",
                    }}
                    onClick={(e) => {
                      const mentionLink = e.target.closest("a.mention-link");
                      if (mentionLink) {
                        e.preventDefault();
                        e.stopPropagation();
                        const username =
                          mentionLink.getAttribute("data-username");
                        if (username) {
                          navigate(`/${username}`);
                        }
                        return;
                      }

                      const link = e.target.closest("a");
                      if (link && link.href) {
                        e.preventDefault();
                        e.stopPropagation();
                        let cleanUrl = link.href;
                        cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, "");
                        cleanUrl = cleanUrl.replace(/<[^>]*>/g, "");
                        cleanUrl = cleanUrl.replace(/[<>]/g, "");
                        cleanUrl = cleanUrl.trim();
                        window.open(cleanUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  />
                )}

                {/* Hashtags Display (Optional here, but useful) */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[#9f3562] text-sm font-medium hover:underline cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {post.image && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Footer/Link */}
                {post.externalLink?.preview && post.externalLink?.url && (
                  <a
                    href={post.externalLink.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      let cleanUrl = post.externalLink.url;
                      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, "");
                      cleanUrl = cleanUrl.replace(/<[^>]*>/g, "");
                      cleanUrl = cleanUrl.replace(/[<>]/g, "");
                      cleanUrl = cleanUrl.trim();
                      e.currentTarget.href = cleanUrl;
                    }}
                    className="group mt-5 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-pink-200 hover:bg-white transition-all"
                  >
                    <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-pink-500">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                        {post.externalLink.preview.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {post.externalLink.url}
                      </p>
                    </div>
                  </a>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// Simple Skeleton Component
const PostSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse">
    <div className="flex gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="w-32 h-4 bg-slate-200 rounded" />
        <div className="w-24 h-3 bg-slate-100 rounded" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="w-full h-4 bg-slate-100 rounded" />
      <div className="w-5/6 h-4 bg-slate-100 rounded" />
    </div>
  </div>
);

export default MentorPost;
