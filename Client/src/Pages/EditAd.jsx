import { useState, useEffect } from'react';
import { useNavigate, useParams, useOutletContext } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { ImagePlus, Loader2, ArrowLeft, Eye, Menu } from'lucide-react';
import { toast } from'react-toastify';
import ReactQuill from'react-quill-new';
import'react-quill-new/dist/quill.snow.css';
import AdvertiserAdCard from'../components/AdvertiserAdCard';
import SEO from'../components/SEO';

const EditAd = () => {
 const navigate = useNavigate();
 const { adId } = useParams();
 const outletContext = useOutletContext() || {};
 const { setShowMobileMenu } = outletContext;
 const [content, setContent] = useState('');
 const [image, setImage] = useState(null);
 const [preview, setPreview] = useState(null);
 const [externalLink, setExternalLink] = useState('');
 const [linkText, setLinkText] = useState('');
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(true);
 const [showPreview, setShowPreview] = useState(false);

 useEffect(() => {
 fetchAd();
 }, [adId]);

 const fetchAd = async () => {
 try {
 setFetching(true);
 const res = await fetch(`/api/advertisers/ads/${adId}`, {
 credentials:'include'
 });

 const data = await res.json();
 if (data.success && data.ad) {
 const ad = data.ad;
 setContent(ad.content ||'');
 setExternalLink(ad.externalLink?.url ||'');
 setLinkText(ad.externalLink?.linkText ||'');
 setPreview(ad.image || null);
 } else {
 toast.error('Failed to load ad');
 navigate('/advertiser/myads');
 }
 } catch (error) {
 console.error('Fetch ad error:', error);
 toast.error('Failed to load ad');
 navigate('/advertiser/myads');
 } finally {
 setFetching(false);
 }
 };

 const handleImageChange = (e) => {
 const file = e.target.files[0];
 if (!file) return;

 if (!file.type.startsWith('image/')) {
 toast.error('Only image files are allowed');
 return;
 }

 setImage(file);
 setPreview(URL.createObjectURL(file));
 };

 const handleSubmit = async () => {
 if (!content.trim() || content ==='<p><br></p>') {
 toast.error('Ad content is required');
 return;
 }

 if (!externalLink.trim()) {
 toast.error('External link is required');
 return;
 }

 try {
 setLoading(true);
 const formData = new FormData();
 formData.append('content', content);
 formData.append('externalLink', externalLink);
 formData.append('linkText', linkText);
 if (image) formData.append('image', image);

 const res = await fetch(`/api/advertisers/ads/${adId}`, {
 method:'PUT',
 body: formData,
 credentials:'include'
 });

 const data = await res.json();

 if (res.ok && data.success) {
 toast.success('Ad updated successfully!');
 navigate('/advertiser/myads');
 } else {
 toast.error(data.message ||'Failed to update ad');
 }
 } catch (error) {
 console.error('Update ad error:', error);
 toast.error('Something went wrong');
 } finally {
 setLoading(false);
 }
 };

 const adPreview = {
 _id: adId,
 content,
 image: preview,
 externalLink: {
 url: externalLink,
 linkText: linkText,
 preview: {}
 },
 advertiser: {
 name:'You',
 username:'advertiser'
 },
 createdAt: new Date().toISOString(),
 likesCount: 0,
 viewsCount: 0,
 clicksCount: 0
 };

 if (fetching) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto">
 <SEO title="Edit Ad | Advertiser Dashboard"description="Edit your advertisement"/>
 <style>{`
 /* Modernized Quill (match CreatePost) */
 .ql-container.ql-snow { border: none !important; font-family: inherit; font-size: 0.875rem; }
 @media (min-width: 640px) {
 .ql-container.ql-snow { font-size: 1rem; }
 }
 .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f1f5f9 !important; padding: 8px !important; }
 @media (min-width: 640px) {
 .ql-toolbar.ql-snow { padding: 12px !important; }
 }
 .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; font-size: 0.875rem; }
 @media (min-width: 640px) {
 .ql-editor.ql-blank::before { font-size: 1rem; }
 }
 .ql-editor { min-height: 200px; padding: 12px !important; }
 @media (min-width: 640px) {
 .ql-editor { min-height: 260px; padding: 16px !important; }
 }
`}</style>
 
 <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
 <button
 onClick={() => navigate('/advertiser/myads')}
 className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-[#9f3562] transition-colors text-sm sm:text-base"
 >
 <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5"/>
 <span>Back to My Ads</span>
 </button>
 <button
 type="button"
 onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
 className="inline-flex xl:hidden items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
 >
 <Menu className="w-4 h-4"/>
 </button>
 </div>

 <AnimatePresence mode="wait">
 {!showPreview ? (
 <motion.div
 key="form"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100"
 >
 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Edit Ad</h1>

 <div className="space-y-4 sm:space-y-6">
 <div>
 <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
 Ad Content *
 </label>
 <div className="border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-pink-300 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300 relative">
 <ReactQuill
 theme="snow"
 value={content}
 onChange={setContent}
 modules={{
 toolbar: [
 [{ header: [1, 2, false] }],
 ['bold','italic','link'],
 [{ list:'ordered'}, { list:'bullet'}]
 ]
 }}
 placeholder="Write your ad content here..."
 />
 </div>
 </div>

 <div>
 <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
 External Link *
 </label>
 <input
 type="url"
 value={externalLink}
 onChange={(e) => setExternalLink(e.target.value)}
 className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] mb-3 sm:mb-4 text-sm sm:text-base"
 placeholder="https://example.com"
 />
 <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Users will be redirected to this link when they click your ad</p>
 
 <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
 Link Text (Optional)
 </label>
 <input
 type="text"
 value={linkText}
 onChange={(e) => setLinkText(e.target.value)}
 className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base"
 placeholder="e.g., Visit Our Website"
 />
 <p className="text-xs sm:text-sm text-gray-500 mt-1">This text will be displayed on the link preview block</p>
 </div>

 <div>
 <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
 Image (Optional)
 </label>
 <label className="group flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100 transition-all w-fit text-xs sm:text-sm">
 <ImagePlus size={16} className="sm:w-[18px] sm:h-[18px] text-[#9f3562]"/>
 <span className="font-medium">Choose Image</span>
 <input type="file"accept="image/*"hidden onChange={handleImageChange} />
 </label>
 {preview && (
 <div className="mt-3 sm:mt-4 relative w-full max-w-md">
 <img src={preview} alt="Preview"className="rounded-lg sm:rounded-xl w-full max-h-48 sm:max-h-72 object-cover border border-gray-200"/>
 <button
 onClick={() => {
 setImage(null);
 setPreview(null);
 }}
 className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600 text-lg sm:text-xl leading-none"
 >
 ×
 </button>
 </div>
 )}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <button
 onClick={() => setShowPreview(true)}
 className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
 >
 <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>
 Preview
 </button>
 <button
 onClick={handleSubmit}
 disabled={loading}
 className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"/>
 <span>Updating...</span>
 </>
 ) : (
'Update Ad'
 )}
 </button>
 </div>
 </div>
 </motion.div>
 ) : (
 <motion.div
 key="preview"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="space-y-4 sm:space-y-6"
 >
 <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100">
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Preview</h2>
 <AdvertiserAdCard ad={adPreview} isPreview />
 </div>
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <button
 onClick={() => setShowPreview(false)}
 className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base"
 >
 Back to Edit
 </button>
 <button
 onClick={handleSubmit}
 disabled={loading}
 className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"/>
 <span>Updating...</span>
 </>
 ) : (
'Finish & Update'
 )}
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default EditAd;
