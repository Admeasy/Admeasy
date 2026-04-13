import React, { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { X, LogIn, Sparkles } from'lucide-react';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';

const LoginEncouragementModal = () => {
 const [isVisible, setIsVisible] = useState(false);
 const { user } = useUser();
 const { mentor } = useMentor();
 const navigate = useNavigate();

 useEffect(() => {
 // Check if user is already logged in
 if (user || mentor) return;

 // Check if already dismissed in this session
 const isDismissed = sessionStorage.getItem('loginEncouragementDismissed');
 if (isDismissed) return;

 // Timer for 60 seconds
 const timer = setTimeout(() => {
 // Double check auth state before showing
 if (!user && !mentor) {
 setIsVisible(true);
 }
 }, 30000);

 return () => clearTimeout(timer);
 }, [user, mentor]);

 const handleClose = () => {
 setIsVisible(false);
 sessionStorage.setItem('loginEncouragementDismissed','true');
 };

 const handleLogin = () => {
 handleClose();
 navigate('/login');
 };

 return (
 <AnimatePresence>
 {isVisible && (
 <React.Fragment>
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={handleClose}
 className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
 />

 {/* Modal Container */}
 <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type:"spring", duration: 0.5, bounce: 0.3 }}
 className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden border border-white/20 ring-1 ring-black/5"
 >
 {/* Decorative Header Background */}
 <div className="h-32 bg-gradient-to-br from-[#9f3562] to-[#6e2444] relative overflow-hidden flex items-center justify-center">
 <div className="absolute inset-0 opacity-20">
 <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
 <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
 </div>

 <motion.div
 initial={{ scale: 0.5, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.2, duration: 0.5 }}
 className="bg-white/10 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/20"
 >
 <Sparkles className="w-10 h-10 text-white"/>
 </motion.div>

 {/* Close Button */}
 <button
 onClick={handleClose}
 className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-md"
 aria-label="Close modal"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>

 {/* Content */}
 <div className="p-6 sm:p-8 text-center">
 <h3 className="text-2xl font-bold text-gray-900 mb-2">
 Unlock the Full Experience
 </h3>
 <p className="text-gray-600 mb-8 leading-relaxed">
 Join our community to connect with mentors, track your progress, and access exclusive content designed just for you!.
 </p>

 <div className="flex flex-col gap-3">
 <button
 onClick={handleLogin}
 className="w-full py-3.5 px-6 bg-[#9f3562] hover:bg-[#852c52] text-white font-semibold rounded-xl shadow-lg shadow-[#9f3562]/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
 >
 <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
 Log In to Continue
 </button>

 <button
 onClick={handleClose}
 className="w-full py-3 px-6 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm"
 >
 Maybe later
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 </React.Fragment>
 )}
 </AnimatePresence>
 );
};

export default LoginEncouragementModal;
