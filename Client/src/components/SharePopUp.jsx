import React from'react';
import { toast } from'react-toastify';
import { X, MessageCircle, Send, Share2, Facebook, Heart, Mail, Link } from'lucide-react';
import { useNavigate } from'react-router-dom';

export default function SharePopUp({ isOpen, onClose, college, CollegeName }) {
 if (!isOpen) return null;

 const shareUrl = encodeURIComponent(college);
 const title = encodeURIComponent(`Hey 👋
Found this college on Admeasy, where you can talk to seniors from top colleges! 
Why Admeasy? 
- Free mentors from top colleges 
- 100% data privacy
- Verified info & student-friendly guidance

Check out this college here 👉\n ${CollegeName}!`);

 const shareLinks = {
 whatsapp:`https://api.whatsapp.com/send?text=${title}%20${shareUrl}`,
 telegram:`https://t.me/share/url?url=${shareUrl}&text=${title}`,
 reddit:`https://www.reddit.com/submit?url=${shareUrl}&title=${title}`,
 facebook:`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
 discord: shareUrl,
 instagram: shareUrl,
 };

 const navigate = useNavigate();

 const handleCopy = async (platform) => {
 await navigator.clipboard.writeText(`Hey 👋
Found this college on Admeasy, where you can talk to seniors from top colleges! 
Why Admeasy? 
- Free mentors from top colleges 
- 100% data privacy
- Verified info & student-friendly guidance

Check out this college here 👉\n ${CollegeName}! ${encodeURI(college)}`);
 toast.success(`Copied link! Paste it and rock on`);
 };

 // Mobile / Tablet share using Web Share API
 const handleMobileShare = async () => {
 const shareText =`Hey 👋
Found this college on Admeasy, where you can talk to seniors from top colleges! 
Why Admeasy? 
- Free mentors from top colleges 
- 100% data privacy
- Verified info & student-friendly guidance

Check out this college here 👉 ${CollegeName}! ${college}`;

 if (navigator.share) {
 try {
 await navigator.share({
 title:`Check out ${CollegeName} on Admeasy!`,
 text: shareText,
 url: college,
 });
 onClose();
 } catch (err) {
 console.error('Error sharing:', err);
 toast.error('Could not share. Try again!');
 }
 } else {
 // Fallback: copy link
 await navigator.clipboard.writeText(shareText);
 toast.info('Link copied! You can share it manually.');
 onClose();
 }
 };

 const socialIcons = [
 { icon: MessageCircle, label:'WhatsApp', href: shareLinks.whatsapp, bg:'bg-green-500/10', color:'hover:text-green-500'},
 { icon: Send, label:'Telegram', href: shareLinks.telegram, bg:'bg-blue-500/10', color:'hover:text-blue-500'},
 { icon: Share2, label:'Reddit', href: shareLinks.reddit, bg:'bg-orange-500/10', color:'hover:text-orange-500'},
 { icon: Facebook, label:'Facebook', href: shareLinks.facebook, bg:'bg-blue-600/10', color:'hover:text-blue-600'},
 { icon: Heart, label:'Discord', onClick: () => handleCopy('Discord'), bg:'bg-indigo-500/10', color:'hover:text-indigo-500'},
 { icon: Mail, label:'Instagram', onClick: () => handleCopy('Instagram'), bg:'bg-pink-500/10', color:'hover:text-pink-500'},
 { icon: Link, label:'Copy Link', onClick: () => handleCopy('Link'), bg:'bg-gray-500/10', color:'hover:text-gray-700'},
 ];

 // Simple device check: show mobile button for narrow screens
 const isMobile = window.innerWidth <= 768;

 return (
 <div 
 className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
 onClick={onClose}
 >
 <div 
 className="relative bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl w-80 border border-white/20"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold">
 Share {CollegeName}
 </h2>
 <button
 onClick={onClose}
 className="cursor-pointer absolute right-2 top-3 text-gray-400 hover:text-gray-600 transition-colors"
 >
 <X size={24}/>
 </button>
 </div>

 {isMobile ? (
 <button
 onClick={handleMobileShare}
 className="w-full flex items-center justify-center gap-2 p-4 bg-blue-500/10 rounded-xl text-gray-700 hover:bg-blue-500/20 hover:text-blue-600 transition-all"
 >
 <Link size={24} />
 Share / Copy Link
 </button>
 ) : (
 <div className="grid grid-cols-3 gap-4">
 {socialIcons.map((social) => {
 const Icon = social.icon;
 const content = social.href ? (
 <button
 onClick={() => window.open(social.href,'_blank','noopener,noreferrer')}
 className={`${social.bg} p-4 cursor-pointer rounded-xl transition-all hover:scale-110 text-gray-700 ${social.color}`}
 >
 <Icon size={28} />
 </button>
 ) : (
 <button
 onClick={() => {social.onClick(); onClose();}}
 className={`${social.bg} cursor-pointer p-4 rounded-xl transition-all hover:scale-110 text-gray-700 ${social.color}`}
 >
 <Icon size={28} />
 </button>
 );
 return (
 <div key={social.label} className="flex flex-col items-center gap-2">
 {content}
 <span className="text-xs font-medium text-gray-600">{social.label}</span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}
