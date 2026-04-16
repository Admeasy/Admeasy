import { useState, useEffect, useMemo, useRef, useCallback } from"react";
import { ImagePlus, Loader2, Send, X, AtSign, User, GraduationCap } from"lucide-react";
import { toast } from"react-toastify";
import ReactQuill, { Quill } from"react-quill-new";
import { motion, AnimatePresence } from"framer-motion";
import"react-quill-new/dist/quill.snow.css";
import TableUI from"quill-table-ui";
import"quill-table-ui/dist/index.css";

import { hasVisiblePostText } from "../utils/postContent";

Quill.register('modules/tableUI', TableUI, true);

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
 const [content, setContent] = useState("");
 const [image, setImage] = useState(null);
 const [preview, setPreview] = useState(null);
 const [loading, setLoading] = useState(false);
 
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

 useEffect(() => {
 if (isOpen && post) {
 setContent(post.content ||"");
 setImage(null);
 setPreview(post.image || null);
 setShowMentionPopup(false);
 setMentionQuery("");
 }
 }, [isOpen, post]);

 // Fetch mention suggestions
 const fetchMentionSuggestions = useCallback(async (query) => {
 if (!query.trim()) {
 setMentionSuggestions([]);
 return;
 }

 try {
 setMentionSearching(true);
 const response = await fetch(`/api/posts/mentions/search?q=${encodeURIComponent(query)}`, {
 credentials:"include",
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
 
 // Use setTimeout to ensure Quill has updated
 setTimeout(() => {
 if (!quillRef.current) return;
 const quill = quillRef.current.getEditor();
 const selection = quill.getSelection(true);
 
 if (!selection) {
 setShowMentionPopup(false);
 return;
 }

 // Get text before cursor
 const text = quill.getText(0, selection.index);
 const match = text.match(/@([a-zA-Z0-9_]*)$/);
 
 if (match) {
 const query = match[1];
 setMentionQuery(query);
 setShowMentionPopup(true);
 
 // Calculate popup position
 try {
 const bounds = quill.getBounds(selection.index);
 const editorElement = quill.root.closest('.ql-container') || quill.root;
 const editorRect = editorElement.getBoundingClientRect();
 
 setMentionPosition({
 top: editorRect.top + bounds.top + bounds.height + 5,
 left: editorRect.left + bounds.left,
 });
 } catch (e) {
 // Fallback position
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

 // Get text before cursor
 const text = quill.getText(0, selection.index);
 const match = text.match(/@([a-zA-Z0-9_]*)$/);
 
 if (match) {
 const startIndex = selection.index - match[0].length;
 
 // Delete the @query text
 quill.deleteText(startIndex, match[0].length);
 
 // Insert mention
 const mentionText =`@${mention.username || mention.name ||'user'}`;
 quill.insertText(startIndex, mentionText);
 
 // Move cursor after mention
 quill.setSelection(startIndex + mentionText.length);
 
 // Update content state
 setContent(quill.root.innerHTML);
 }
 
 setShowMentionPopup(false);
 setMentionQuery("");
 }, []);

 // Handle keyboard navigation in mention popup
 useEffect(() => {
 const handleKeyDown = (e) => {
 if (!showMentionPopup || mentionSuggestions.length === 0) return;

 if (e.key ==="ArrowDown") {
 e.preventDefault();
 setSelectedMentionIndex((prev) => 
 prev < mentionSuggestions.length - 1 ? prev + 1 : 0
 );
 } else if (e.key ==="ArrowUp") {
 e.preventDefault();
 setSelectedMentionIndex((prev) => 
 prev > 0 ? prev - 1 : mentionSuggestions.length - 1
 );
 } else if (e.key ==="Enter"|| e.key ==="Tab") {
 e.preventDefault();
 if (mentionSuggestions[selectedMentionIndex]) {
 insertMention(mentionSuggestions[selectedMentionIndex]);
 }
 } else if (e.key ==="Escape") {
 setShowMentionPopup(false);
 setMentionQuery("");
 }
 };

 if (showMentionPopup) {
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }
 }, [showMentionPopup, mentionSuggestions, selectedMentionIndex, insertMention]);

 // Close mention popup when clicking outside
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

 // Memoize modules to prevent re-registration - must be called before any early returns
 const modules = useMemo(() => ({
 toolbar: [
 [{ header: [1, 2, false] }],
 ["bold","italic","link"],
 [{ list:"ordered"}, { list:"bullet"}],
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

    const willHaveImage = Boolean(image || preview);
    if (!hasVisiblePostText(content) && !willHaveImage) {
      toast.error("Add some text or keep an image on your post");
      return;
    }
 if (!content.trim() || content ==='<p><br></p>') {
 toast.error("Post content is required");
 return;
 }

 try {
 setLoading(true);

 const formData = new FormData();
 formData.append("content", content);
 if (image) formData.append("image", image);

 const res = await fetch(`/api/posts/${post._id}`, {
 method:"PUT",
 body: formData,
 credentials:"include",
 });

 const data = await res.json();

 if (!res.ok || !data.success) {
 throw new Error(data.message ||"Failed to update post");
 }

 toast.success("Post updated successfully 🚀");
 if (onPostUpdated) {
 onPostUpdated(data.post);
 }
 onClose();
 } catch (err) {
 console.error(err);
 toast.error(err.message ||"Something went wrong");
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
 <div className="border border-slate-200 rounded-2xl focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300 relative">
 <ReactQuill
 ref={quillRef}
 theme="snow"
 value={content}
 onChange={handleContentChange}
 modules={modules}
 placeholder="What's on your mind?"
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
 top:`${mentionPosition.top}px`,
 left:`${mentionPosition.left}px`,
 }}
 >
 {mentionSearching ? (
 <div className="p-4 flex items-center justify-center gap-2 text-slate-500">
 <Loader2 className="w-4 h-4 animate-spin"/>
 <span className="text-sm">Searching...</span>
 </div>
 ) : mentionSuggestions.length > 0 ? (
 <div className="py-1">
 {mentionSuggestions.map((mention, index) => (
 <motion.button
 key={`${mention.type}-${mention._id}`}
 whileHover={{ backgroundColor:"#f8fafc"}}
 onClick={() => insertMention(mention)}
 className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
 index === selectedMentionIndex
 ?"bg-gradient-to-r from-[#9f3562]/10 to-pink-50/50 border-l-2 border-[#9f3562]"
 :"hover:bg-slate-50"
 }`}
 >
 <img
 src={mention.image ||"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
 alt={mention.name}
 className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
 />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-slate-900 text-sm truncate">
 {mention.name ||"User"}
 </span>
 {mention.type ==="mentor"&& (
 <GraduationCap className="w-3.5 h-3.5 text-[#9f3562] flex-shrink-0"/>
 )}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <AtSign className="w-3 h-3 text-slate-400"/>
 <span className="text-xs text-slate-500 truncate">
 {mention.username ||"no-username"}
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
 <Loader2 className="animate-spin"size={18} />
 ) : (
 <Send size={18} />
 )}
 <span>{loading ?"Updating...":"Update Post"}</span>
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
