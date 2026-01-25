import { useState, useEffect, useMemo } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import ReactQuill, { Quill } from "react-quill-new";
import { motion, AnimatePresence } from "framer-motion";
import "react-quill-new/dist/quill.snow.css";
import TableUI from "quill-table-ui";
import "quill-table-ui/dist/index.css";

Quill.register('modules/tableUI', TableUI, true);

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setContent(post.content || "");
      setImage(null);
      setPreview(post.image || null);
    }
  }, [isOpen, post]);

  // Memoize modules to prevent re-registration - must be called before any early returns
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["table"],
    ],
    table: true,
    tableUI: true,
  }), []);

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

      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update post");
      }

      toast.success("Post updated successfully 🚀");
      if (onPostUpdated) {
        onPostUpdated(data.post);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <style>{`
                .ql-container.ql-snow { border: none !important; font-family: inherit; font-size: 1rem; }
                .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; }
                .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; }
                .ql-editor { min-height: 150px; padding: 16px !important; }
                .post-content h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
                .post-content p { margin-bottom: 0.75rem; line-height: 1.6; }
                .post-content ul { list-style: disc; margin-left: 1.5rem; }
                .post-content table { border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
              `}</style>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-slate-800">Edit Post</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit}>
                  <div className="border border-slate-200 rounded-2xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      placeholder="What's on your mind?"
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
                            <img
                              src={preview}
                              alt="Preview"
                              className="rounded-xl w-full max-h-72 object-cover border border-slate-100"
                            />
                            <button
                              type="button"
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

                  <div className="flex items-center justify-between mt-5">
                    <label className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-all">
                      <ImagePlus
                        size={18}
                        className="text-pink-500 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-sm font-medium">Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                      />
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative cursor-pointer group overflow-hidden bg-slate-900 text-white px-8 py-2.5 rounded-xl font-medium transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-70"
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Send size={18} />
                          )}
                          <span>{loading ? "Updating..." : "Update Post"}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPostModal;
