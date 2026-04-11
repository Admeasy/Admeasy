import { Navigate, useLocation } from"react-router-dom";
import { toast } from'react-toastify'
import'react-toastify/dist/ReactToastify.css'
import { useState, useEffect } from'react';

const ProtectedRoute = ({ user, mentor, children }) => {
 const location = useLocation();
 const [isCheckingVerification, setIsCheckingVerification] = useState(true);
 const [isVerified, setIsVerified] = useState(true);
 const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
 const [onboardingComplete, setOnboardingComplete] = useState(true);

 // Check if OAuth is in progress - check both sessionStorage and URL parameter
 const urlParams = new URLSearchParams(location.search);
 const oauthSuccessParam = urlParams.get('oauth_success');
 const oauthInProgress = typeof window !=='undefined'&& (
 sessionStorage.getItem('oauth_in_progress') ==='true'||
 oauthSuccessParam ==='true'
 );

 // If OAuth is detected in URL, set the flag immediately
 if (oauthSuccessParam ==='true'&& typeof window !=='undefined') {
 sessionStorage.setItem('oauth_in_progress','true');
 if (!sessionStorage.getItem('oauth_intended_path')) {
 sessionStorage.setItem('oauth_intended_path', location.pathname);
 }
 }

 // Check email verification and onboarding status for users
 useEffect(() => {
 const checkStatus = async () => {
 if (!user || mentor) {
 setIsCheckingVerification(false);
 setIsCheckingOnboarding(false);
 return;
 }

 // Allow access to verification and onboarding pages
 const allowedPages = ['/verify-email','/login','/signup','/onboarding'];
 if (allowedPages.some(page => location.pathname.startsWith(page))) {
 setIsCheckingVerification(false);
 setIsCheckingOnboarding(false);
 return;
 }

 try {
 // Check verification status
 const verificationRes = await fetch('/api/users/verification-status', {
 credentials:'include'
 });
 
 if (verificationRes.ok) {
 const verificationData = await verificationRes.json();
 setIsVerified(verificationData.isVerified || false);
 } else {
 setIsVerified(true);
 }

 // Check onboarding status
 const onboardingRes = await fetch('/api/users/onboarding/status', {
 credentials:'include'
 });
 
 if (onboardingRes.ok) {
 const onboardingData = await onboardingRes.json();
 setOnboardingComplete(!onboardingData.requiresOnboarding);
 } else {
 setOnboardingComplete(true);
 }
 } catch (err) {
 // On error, assume verified and complete to avoid blocking
 setIsVerified(true);
 setOnboardingComplete(true);
 } finally {
 setIsCheckingVerification(false);
 setIsCheckingOnboarding(false);
 }
 };

 checkStatus();
 }, [user, mentor, location.pathname]);

 // Handle different types of protection
 if (mentor === true) {
 // This route requires mentor authentication
 if (user && oauthInProgress) {
 toast.info('Please login as a mentor', {
 toastId:'mentor-login-warning'
 });
 return <Navigate to="/mentors/login"replace />;
 }
 } else {
 // Regular user protection
 if (!user && !oauthInProgress) {
 toast.info('Please Login to setup a profile', {
 toastId:'login-warning'
 });
 return <Navigate to="/login"replace />;
 }

 // Check email verification and onboarding for authenticated users
 if (user && !oauthInProgress && !isCheckingVerification && !isCheckingOnboarding) {
 if (!isVerified) {
 // Allow access to verification page and login
 const allowedPages = ['/verify-email','/login','/signup','/onboarding'];
 if (!allowedPages.some(page => location.pathname.startsWith(page))) {
 toast.warn('Please verify your email address to access this page', {
 toastId:'email-verification-required'
 });
 return <Navigate to="/login?verify_required=true"replace />;
 }
 }

 // MANDATORY: Check onboarding completion
 if (!onboardingComplete) {
 // Allow access to onboarding page only
 if (!location.pathname.startsWith('/onboarding')) {
 const userId = user._id || user.id;
 toast.warn('Please complete your onboarding to access this page', {
 toastId:'onboarding-required'
 });
 return <Navigate to={`/onboarding/${userId}`} replace />;
 }
 }
 }
 }

 // Show loading state while checking verification and onboarding
 if ((isCheckingVerification || isCheckingOnboarding) && user && !mentor) {
 return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
 }

 return children;
};

export default ProtectedRoute;