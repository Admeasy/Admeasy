import { motion, AnimatePresence } from'framer-motion';
import { AlertTriangle, X } from'lucide-react';

const ConfirmModal = ({
 isOpen,
 onClose,
 onConfirm,
 title ='Confirm Action',
 message ='Are you sure you want to proceed?',
 confirmText ='Confirm',
 cancelText ='Cancel',
 confirmColor ='danger', //'danger'|'primary'|'success'
 isLoading = false,
}) => {
 if (!isOpen) return null;

 const getConfirmButtonStyle = () => {
 switch (confirmColor) {
 case'danger':
 return'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white';
 case'success':
 return'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
 case'primary':
 default:
 return'bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:from-[#b14270] hover:to-[#9f3562] text-white';
 }
 };

 const handleBackdropClick = (e) => {
 if (e.target === e.currentTarget && !isLoading) {
 onClose();
 }
 };

 const handleConfirm = () => {
 if (!isLoading) {
 onConfirm();
 }
 };

 const handleCancel = () => {
 if (!isLoading) {
 onClose();
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4"
 onClick={handleBackdropClick}
 >
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
 />

 {/* Modal */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ duration: 0.2, ease:'easeOut'}}
 className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/20 border border-gray-100 max-w-md w-full overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Gradient accent */}
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9f3562] via-pink-500 to-[#b14270]"/>

 {/* Content */}
 <div className="p-6 sm:p-8">
 {/* Icon */}
 <div className="flex items-center justify-center mb-4">
 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
 <AlertTriangle className="w-8 h-8 text-red-500"/>
 </div>
 </div>

 {/* Title */}
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
 {title}
 </h3>

 {/* Message */}
 <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed mb-6">
 {message}
 </p>

 {/* Buttons */}
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
 <motion.button
 whileHover={{ scale: isLoading ? 1 : 1.02 }}
 whileTap={{ scale: isLoading ? 1 : 0.98 }}
 onClick={handleCancel}
 disabled={isLoading}
 className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
 >
 {cancelText}
 </motion.button>
 <motion.button
 whileHover={{ scale: isLoading ? 1 : 1.02 }}
 whileTap={{ scale: isLoading ? 1 : 0.98 }}
 onClick={handleConfirm}
 disabled={isLoading}
 className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${getConfirmButtonStyle()}`}
 >
 {isLoading ? (
 <div className="flex items-center justify-center gap-2">
 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
 <span>Processing...</span>
 </div>
 ) : (
 confirmText
 )}
 </motion.button>
 </div>
 </div>

 {/* Close button (optional) */}
 {!isLoading && (
 <button
 onClick={handleCancel}
 className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
 aria-label="Close"
 >
 <X className="w-5 h-5"/>
 </button>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
};

export default ConfirmModal;


