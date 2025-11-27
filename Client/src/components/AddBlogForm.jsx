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

  useEffect(() => {
    if (editData) {
      setAuthor(editData.Author || "");
      setTitle(editData.Title || "");
      setContent(editData.content || "");
      setCategory(editData.category || "");
      setReadingTime(editData.readingTime?.toString() || "");
    }
  }, [editData]);

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
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        
        .ql-editor a:hover {
          color: #1d4ed8 !important;
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
        className="absolute inset-0 backdrop-blur-md bg-black/30"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white w-full rounded-2xl shadow-2xl border border-gray-200 z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {editData ? "Edit Blog" : "Add New Blog"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
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
                         file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 
                         hover:file:bg-blue-100 disabled:opacity-50"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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