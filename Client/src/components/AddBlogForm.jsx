import { useState, useEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import TableUI from "quill-table-ui";
import "quill-table-ui/dist/index.css";

// Register TableUI module once, outside component
Quill.register('modules/tableUI', TableUI, true);

// Custom Link Blot to handle absolute URLs
const Link = Quill.import('formats/link');

class CustomLink extends Link {
  static create(value) {
    const node = super.create(value);
    value = this.sanitize(value);
    
    // Ensure the link is absolute
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'https://' + value;
    }
    
    node.setAttribute('href', value);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    return node;
  }
  
  static sanitize(url) {
    return super.sanitize(url);
  }
}

// Register custom link format
Quill.register(CustomLink, true);

const AddBlogForm = ({ onClose, onSubmit, editData }) => {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [readingTime, setReadingTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Hashtags for Blogs
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');

  useEffect(() => {
    if (editData) {
      setAuthor(editData.Author || "");
      setTitle(editData.Title || "");
      setContent(editData.content || "");
      setCategory(editData.category || "");
      setReadingTime(editData.readingTime?.toString() || "");
      if (editData.hashtags) setHashtags(editData.hashtags); // NEW
    }
  }, [editData]);


  const handleHashtagKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
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


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!author || !title || !content || !category || !readingTime) {
      toast.error("All fields are required 😭");
      return;
    }

    if (!editData && !thumbnail) {
      toast.error("Thumbnail is required for new blogs");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("Author", author);
      formData.append("Title", title);
      if (thumbnail) formData.append("Thumbnail", thumbnail);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("readingTime", Number(readingTime));

      formData.append("hashtags", JSON.stringify(hashtags)); // NEW: Send hashtags as a JSON string

      await onSubmit(formData);
    } catch (err) {
      toast.error("Failed to submit blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize modules to prevent re-registration
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ["bold", "italic", "underline"],
      [{ align: [] }],
      ["link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
      ["table"],
    ],
    table: true,
    tableUI: true,
  }), []);

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "align",
    "link",
    "list",
    "table",
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Custom Styles for Quill Content */}
      <style>{`
        /* Style links in the editor */
        .ql-editor a {
          color: #993e66 !important;
          text-decoration: underline !important;
        }
        
        .ql-editor a:hover {
          color: #7a2f4f !important;
        }

        /* Ensure lists display properly */
        .ql-editor ol {
          padding-left: 1.5em;
          list-style-type: decimal;
        }
        
        .ql-editor ul {
          padding-left: 1.5em;
          list-style-type: disc;
        }
        
        .ql-editor ol li,
        .ql-editor ul li {
          padding-left: 0.5em;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/75"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white/95 backdrop-blur-xl w-full rounded-2xl shadow-2xl border border-gray-200 z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {editData ? "Edit Blog" : "Add New Blog"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-[#9f3562] transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-4 sm:px-6 py-4 space-y-5 flex-1"
        >
          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Thumbnail {!editData && <span className="text-red-500">*</span>}
              {editData && (
                <span className="text-gray-500 text-xs">
                  (Leave empty to keep current)
                </span>
              )}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              disabled={isSubmitting}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                         file:border-0 file:text-sm file:font-medium disabled:opacity-50
                         file:bg-[rgba(153,62,102,0.1)] file:text-[#993e66]
                         hover:file:bg-[rgba(153,62,102,0.15)]"
            />
            {editData && editData.Thumbnail && !thumbnail && (
              <p className="mt-1 text-xs text-gray-500">
                Current: {editData.Thumbnail.split("/").pop()}
              </p>
            )}
          </div>

          {/* Content (React Quill) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="Write your blog content here..."
              className="bg-white rounded-lg"
            />
          </div>

          {/* Dynamic Hashtags */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Hashtags (Press Space to add)
            </label>
            <div className="w-full px-4 py-2 bg-white/95 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-[#9f3562]/50 min-h-[48px] flex flex-wrap gap-2 items-center">
              {hashtags.map((tag, index) => (
                <span key={index} className="bg-gray-100 text-[#9f3562] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  #{tag}
                  <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-red-500">
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                disabled={isSubmitting}
                className="flex-1 outline-none border-none bg-transparent min-w-[120px] text-sm text-gray-900 placeholder:text-gray-400"
                placeholder={hashtags.length === 0 ? "e.g. #Education" : "Add more..."}
              />
            </div>
          </div>

          {/* Category & Reading Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Reading Time (mins) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 disabled:bg-gray-100"
              />
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                {editData ? "Updating..." : "Adding..."}
              </>
            ) : editData ? (
              "Update Blog"
            ) : (
              "Add Blog"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBlogForm;