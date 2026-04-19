import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ImagePlus, Loader2, Send, X, Globe, Calendar, AtSign, User, GraduationCap } from "lucide-react";
import { toast } from "react-toastify";
import ReactQuill, { Quill } from "react-quill-new";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import "react-quill-new/dist/quill.snow.css";
import TableUI from "quill-table-ui";
import "quill-table-ui/dist/index.css";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import { processMentions } from "../utils/processMentions";

// Registration stays the same...
Quill.register('modules/tableUI', TableUI, true);

const MentorPost = () => {
  const navigate = useNavigate();
  const pathname = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { mentor } = useMentor();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  // NEW: Hashtag State
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');

  // NEW: Headline, Category, Space
  const [headline, setHeadline] = useState('');
  const [category, setCategory] = useState('study'); //'study'|'masti'
  const [spaceId, setSpaceId] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(false);

  // Check if coming from"Ask a Doubt"CTA
  const isAskDoubt = searchParams.get('askDoubt') === 'true';

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Auto-focus editor when coming from"Ask a Doubt"CTA
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
          console.error('Error focusing editor:', error);
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

  // Fetch spaces from API
  useEffect(() => {
    const fetchSpaces = async () => {
      setSpacesLoading(true);
      try {
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.spaces)) {
          setSpaces(data.spaces);
        } else if (Array.isArray(data)) {
          setSpaces(data);
        }
      } catch (err) {
        console.error('Failed to fetch spaces:', err);
      } finally {
        setSpacesLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  // Fetch mention suggestions
  const fetchMentionSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setMentionSuggestions([]);
      return;
    }

    try {
      setMentionSearching(true);
      const response = await fetch(`/api/posts/mentions/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
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
          const editorElement = quill.root.closest('.ql-container') || quill.root;
          const editorRect = editorElement.getBoundingClientRect();

          setMentionPosition({
            top: editorRect.top + bounds.top + bounds.height + 5,
            left: editorRect.left + bounds.left,
          });
        } catch (e) {
          const editorElement = quill.root.closest('.ql-container') || quill.root;
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
      const mentionText = `@${mention.username || mention.name || 'user'}`;
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
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
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
  }, [showMentionPopup, mentionSuggestions, selectedMentionIndex, insertMention]);

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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentionPopup]);

  /* ----------------------------------
  Handle Image Change
  ----------------------------------- */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images");
      return;
    }

    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      const isOversized = file.size > 2 * 1024 * 1024;
      if (isOversized) {
        toast.error("Image size is too big");
      }

      newImages.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        oversized: isOversized
      });
    });

    setImages(prev => [...prev, ...newImages]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke the URL to avoid memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  /* ----------------------------------
  NEW: Hashtag Logic
  ----------------------------------- */
  const handleHashtagKeyDown = (e) => {
    if (e.key === '' || e.key === 'Enter') {
      e.preventDefault();
      const newTag = hashtagInput.trim().replace(/^#/, '');
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  /* ----------------------------------
  Create Post
  ----------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!headline.trim()) {
      toast.error("Headline is required");
      return;
    }

    if (!content.trim() || content === '<p><br></p>') {
      toast.error("Post content is required");
      return;
    }



    if (images.some(file => file.size > 2 * 1024 * 1024)) {
      toast.error("Please remove images that are too big");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("content", content);
      formData.append("headline", headline.trim());
      formData.append("category", category);
      if (spaceId) formData.append("spaceId", spaceId);
      images.forEach(img => formData.append("images", img));

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
        sessionStorage.setItem('admeasy:askDoubt:lastPost', Date.now().toString());
        sessionStorage.removeItem('admeasy:askDoubt:dismissed');
      } catch (err) {
        console.error('Error tracking post creation:', err);
      }

      toast.success("Post published successfully 🚀");
      setContent("");
      setHeadline("");
      setCategory("study");
      setSpaceId("");
      setImages([]);
      setPreviews([]);
      setHashtags([]); // Reset hashtags on success
      fetchPosts();

      if (isAskDoubt) {
        navigate('/posts/create', { replace: true });
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
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-pink-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {isAskDoubt ? "Ask Your Doubt" : "Create Post"}
            </h2>
          </div>

          <div className="border border-slate-200 rounded-2xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300 relative">
            {/* ─── Headline ──────────────────────────────────── */}
            <div className="px-4 pt-4 pb-2 border-b border-slate-100">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline (required) — e.g.'JEE 2025 strategy that actually works'"
                className="w-full text-base font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal bg-transparent focus:outline-none"
                maxLength={150}
              />
              <div className="text-[10px] text-gray-300 text-right mt-0.5">{headline.length}/150</div>
            </div>

            {/* ─── Category Toggle ────────────────────────────── */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
              <span className="text-xs text-gray-500 font-semibold shrink-0">Post to:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-gray-100 gap-0.5">
                {[
                  { key: 'study', label: '📚 Study', desc: 'Knowledge & tips' },
                  { key: 'masti', label: '😎 Masti', desc: 'Fun & campus life' },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    title={desc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${category === key
                      ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Space Selector ──────────────────────────────── */}
            <div className="px-4 py-2 border-b border-slate-100">
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer appearance-none"
                disabled={spacesLoading}
              >
                <option value="">
                  {spacesLoading ? 'Loading spaces...' : '🌐 Select a Space'}
                </option>
                {spaces.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={useMemo(() => ({
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "link"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["table"],
                ],
                table: true,
                tableUI: true,
              }), [])}
              placeholder={isAskDoubt
                ? "What's your doubt? Ask a question and get help from mentors..."
                : (mentor ? "What's on your mind, Mentor?" : "What's on your mind?")}
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
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedMentionIndex
                            ? "bg-gradient-to-r from-[#9f3562]/10 to-pink-50/50 border-l-2 border-[#9f3562]"
                            : "hover:bg-slate-50"
                            }`}
                        >
                          <img
                            src={mention.image || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
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
                      No users found for"@{mentionQuery}"
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {previews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 pt-0 relative"
                >
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                    {previews.map((preview, index) => (
                      <div key={index} className={`relative group shrink-0 w-[200px] snap-center rounded-xl transition-all ${preview.oversized ? 'ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}>
                        <img
                          src={preview.url}
                          alt="Preview"
                          className={`rounded-xl w-full h-40 object-cover border ${preview.oversized ? 'border-red-500' : 'border-slate-100'}`}
                        />
                        {preview.oversized && (
                          <div className="absolute inset-0 bg-red-500/10 rounded-xl pointer-events-none flex items-center justify-center">
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">TOO LARGE</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); removeImage(index); }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-slate-800 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Hashtag Input for Post */}
          <div className="mt-4 mb-2 p-3 border border-slate-200 rounded-xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all flex flex-wrap gap-2 items-center bg-slate-50">
            {hashtags.map((tag, index) => (
              <span key={index} className="bg-[#9f3562]/10 text-[#9f3562] px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-red-500 transition-colors">
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
              placeholder={hashtags.length === 0 ? "Add Hashtags to reach more people..." : "Add more tags..."}
            />
          </div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-4">
              <label className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-all">
                <ImagePlus size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Media</span>
                <input type="file" accept="image/*" hidden multiple onChange={handleImageChange} />
              </label>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                (Size must be less than 2MB)
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="relative cursor-pointer group overflow-hidden bg-slate-900 text-white px-8 py-2.5 rounded-xl font-medium transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-70"
            >
              <div className="flex items-center gap-2 relative z-10">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                <span>{loading ? "Publishing..." : "Publish Post"}</span>
              </div>
            </button>
          </div>
        </div>
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
                        src={(post.author || post.mentor)?.image || "/avatar.png"}
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
                          const username = (post.author || post.mentor)?.username;
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
                            navigate(`/${(post.author || post.mentor).username}`);
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
                <div
                  className="text-[15px] text-slate-700 post-content leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: processMentions(post.content) }}
                  onClick={(e) => {
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

                    const link = e.target.closest('a');
                    if (link && link.href) {
                      e.preventDefault();
                      e.stopPropagation();
                      let cleanUrl = link.href;
                      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, '');
                      cleanUrl = cleanUrl.replace(/<[^>]*>/g, '');
                      cleanUrl = cleanUrl.replace(/[<>]/g, '');
                      cleanUrl = cleanUrl.trim();
                      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                />

                {/* Hashtags Display (Optional here, but useful) */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-[#9f3562] text-sm font-medium hover:underline cursor-pointer">
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
                      cleanUrl = cleanUrl.replace(/%3C\/[^>]*%3E$/i, '');
                      cleanUrl = cleanUrl.replace(/<[^>]*>/g, '');
                      cleanUrl = cleanUrl.replace(/[<>]/g, '');
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
                      <p className="text-xs text-slate-500 line-clamp-1">{post.externalLink.url}</p>
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