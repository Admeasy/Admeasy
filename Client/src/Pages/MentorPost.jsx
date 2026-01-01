import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Loader2, Send, X, Globe, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import ReactQuill, { Quill } from "react-quill-new";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import "react-quill-new/dist/quill.snow.css";
import TableUI from "quill-table-ui";
import "quill-table-ui/dist/index.css";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";

// Registration stays the same...
Quill.register('modules/tableUI', TableUI, true);

const MentorPost = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  // ... (fetchPosts and handleImageChange logic remains the same)
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

     Create Post

  ----------------------------------- */

  const handleSubmit = async (e) => {

    e.preventDefault();



    if (!content.trim() || content === '<p><br></p>') {

      toast.error("Post content is required");

      return;

    }



    try {

      setLoading(true);



      const formData = new FormData();

      formData.append("content", content);

      if (image) formData.append("image", image);



      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create post");
      }

      toast.success("Post published successfully 🚀");
      setContent("");
      setImage(null);
      setPreview(null);
      fetchPosts();
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
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Create Post</h2>
          </div>

          <div className="border border-slate-200 rounded-2xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
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
              placeholder="What's on your mind, Mentor?"
            />

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 pt-0 relative"
                >
                  <div className="relative group">
                    <img src={preview} alt="Preview" className="rounded-xl w-full max-h-72 object-cover border border-slate-100" />
                    <button
                      onClick={() => { setImage(null); setPreview(null); }}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-slate-800 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-5">
            <label className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-all">
              <ImagePlus size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Media</span>
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </label>

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
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={(post.author || post.mentor)?.image || "/avatar.png"}
                        alt={(post.author || post.mentor)?.name || "User"}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-none mb-1">{(post.author || post.mentor)?.name || "User"}</h3>
                      {(post.author || post.mentor)?.username && (
                        <p className="text-sm text-slate-500">@{(post.author || post.mentor).username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                    <Calendar size={12} />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="text-[15px] text-slate-700 post-content leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

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