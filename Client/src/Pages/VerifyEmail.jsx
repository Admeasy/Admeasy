import React, { useEffect, useState, useRef } from'react'; // Added useRef
import { useParams, useNavigate } from'react-router-dom';
import { motion } from'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Home, ArrowRight } from'lucide-react';
import { useUser } from'../context/UserContext';
import { toast } from'react-toastify';
import { enableNotifications } from'../Firebase/enableNotifications';


const VerifyEmail = () => {
 const { token } = useParams();
 const navigate = useNavigate();
 const { user, fetchUser, loading } = useUser();
 const [status, setStatus] = useState('verifying'); //'verifying','success','error'
 const [message, setMessage] = useState('');
 const [isNewUser, setIsNewUser] = useState(false); // Track if user is new for UI updates
 const verificationAttempted = useRef(false); // Prevent double firing in Strict Mode

 // If user is already logged in and verified, we can skip and show success
 useEffect(() => {
 if (!loading && user && user.isVerified && status ==='verifying') {
 // Only redirect if we haven't already attempted verification (or if verification succeeded)
 if (!verificationAttempted.current) {
 setStatus('success');
 setMessage('Your email is already verified!');

 // Check if user needs onboarding
 const redirectPath = user.hasCompletedOnboarding ?'/':`/onboarding/${user._id}`;
 const toastMessage = user.hasCompletedOnboarding
 ? null
 :"Please let us know more about you";

 setTimeout(() => {
 if (toastMessage) toast.info(toastMessage);
 navigate(redirectPath, { replace: true });
 }, 2500);
 }
 }
 }, [user, loading, status, navigate]);

 // Disable browser back button
 useEffect(() => {
 const disableBackButton = () => {
 window.history.pushState(null,'', window.location.href);
 };

 // Push initial state
 window.history.pushState(null,'', window.location.href);

 // Listen for popstate (back button)
 window.addEventListener('popstate', disableBackButton);

 return () => {
 window.removeEventListener('popstate', disableBackButton);
 };
 }, []);

 useEffect(() => {
 const verifyToken = async () => {
 if (!token) return;

 // Prevent double execution
 if (verificationAttempted.current) return;
 verificationAttempted.current = true;

 try {
 const res = await fetch(`/api/users/verify-email/${token}`);
 const data = await res.json();

 if (res.ok) {
 setStatus('success');
 setMessage(data.message ||'Email verified successfully!');
 toast.success("Welcome! Your email has been verified.");

 // Re-fetch user context because backend auto-logs in
 const verifiedUser = await fetchUser();
 if (verifiedUser) {
 enableNotifications(verifiedUser._id,"user", true);
 }

 // Check onboarding status from response
 const requiresOnboarding = data.requiresOnboarding ||
 !data.user?.hasCompletedOnboarding ||
 (data.onboardingStatus && !data.onboardingStatus.isComplete);

 // Redirect after 2.5 seconds
 setTimeout(() => {
 const userId = data.user?._id || verifiedUser?._id || localStorage.getItem('temp_signup_id');
 setIsNewUser(requiresOnboarding);

 if (requiresOnboarding && userId) {
 // User needs onboarding - MANDATORY redirect
 toast.info("Please complete your profile to continue");
 navigate(`/onboarding/${userId}`, { replace: true });
 // Clean up flags
 localStorage.removeItem('new_signup_verification');
 localStorage.removeItem('temp_signup_id');
 } else {
 // Onboarding complete - redirect to home
 navigate('/', { replace: true });
 }
 }, 2500);
 } else {
 // Check if it's already verified but token is gone (handled by error message usually)
 setStatus('error');
 setMessage(data.message ||'Verification failed. The link may be invalid or expired.');
 }
 } catch (error) {
 console.error("Verification error:", error);
 setStatus('error');
 setMessage('An error occurred during verification. Please try again later.');
 }
 };

 // Only run if not already handled by"already verified"check
 if (status ==='verifying'&& !user?.isVerified) {
 verifyToken();
 }
 }, [token, navigate, fetchUser, user, status]);

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4 sm:p-6">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 sm:p-12 text-center relative overflow-hidden"
 >
 {/* Background Decoration */}
 <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-light/5 rounded-full blur-3xl"/>
 <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#9f3562]/5 rounded-full blur-3xl"/>

 <div className="relative z-10">
 {status ==='verifying'&& (
 <div className="py-8 sm:py-12">
 <div className="relative inline-block mb-8">
 <div className="absolute inset-0 bg-brand-light/20 rounded-full animate-ping scale-150"/>
 <Loader2 size={64} className="text-brand-light animate-spin relative"/>
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Verifying Email</h1>
 <p className="text-gray-500 text-lg">Hang tight! We're confirming your account...</p>
 </div>
 )}

 {status ==='success'&& (
 <div className="py-8 sm:py-12">
 <div className="relative inline-block mb-8">
 <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse scale-150"/>
 <div className="relative bg-green-500 p-5 rounded-full shadow-lg shadow-green-200">
 <CheckCircle2 size={48} className="text-white"/>
 </div>
 </div>
 <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Success!</h1>
 <p className="text-gray-600 mb-10 text-lg leading-relaxed px-2">
 {message}
 </p>

 <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-500 mb-10 flex items-center justify-center gap-2">
 <Loader2 size={16} className="animate-spin"/>
 {isNewUser
 ?"Redirecting to onboarding in 2.5 seconds"
 :"Redirecting to home in 2.5 seconds"}
 </div>

 <button
 onClick={() => {
 const userId = localStorage.getItem('temp_signup_id');
 if (isNewUser && userId) {
 toast.info("Please let us know more about you");
 navigate(`/onboarding/${userId}`, { replace: true });
 localStorage.removeItem('new_signup_verification');
 localStorage.removeItem('temp_signup_id');
 } else {
 navigate('/', { replace: true });
 }
 }}
 className="w-full py-4.5 bg-[#9f3562] text-white font-bold rounded-2xl hover:bg-[#b24a78] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#9f3562]/20 group"
 >
 <Home size={22} />
 <span>{isNewUser ?"Continue to Onboarding":"Go to Dashboard"}</span>
 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
 </button>
 </div>
 )}

 {status ==='error'&& (
 <div className="py-8 sm:py-12">
 <div className="relative inline-block mb-8">
 <div className="bg-red-50 p-6 rounded-full shadow-inner">
 <AlertCircle size={56} className="text-red-500"/>
 </div>
 </div>
 <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Oops!</h1>
 <p className="text-red-600/80 mb-10 text-lg leading-relaxed">
 {message}
 </p>
 <div className="flex flex-col gap-4">
 <button
 onClick={() => navigate('/login')}
 className="w-full py-4.5 bg-[#9f3562] text-white font-bold rounded-2xl hover:bg-[#b24a78] transition-all shadow-xl shadow-[#9f3562]/20 flex items-center justify-center gap-2"
 >
 Return to Login
 </button>
 <button
 onClick={() => navigate('/contact')}
 className="w-full py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors border-2 border-transparent hover:border-gray-100 rounded-2xl"
 >
 Contact Support
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 );
};

export default VerifyEmail;
