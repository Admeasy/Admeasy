import React, { useState } from"react";
import { useNavigate } from"react-router-dom";
import { useUser } from"../context/UserContext";
import { Eye, EyeOff } from"lucide-react";
import { MdAlternateEmail, MdLockOutline } from"react-icons/md";
import { motion } from"framer-motion";
import LoadingButton from"../components/LoadingButton";
import Logo from"../assets/Admeasy/AdmeasyLatest.png";
import EmailVerificationModal from"../components/EmailVerificationModal";
import { toast } from"react-toastify";
import { enableNotifications } from"../Firebase/enableNotifications";


const fadeUpVariant = {
 hidden: { opacity: 0, y: 60 },
 visible: { opacity: 1, y: 0 },
};

const Signup = ({ setAuthMode, setShowLogin, onNotVerified }) => {
 const [email, setEmail] = useState("");
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [usernameStatus, setUsernameStatus] = useState("idle"); // idle, checking, available, taken, invalid
 const [usernameMessage, setUsernameMessage] = useState("");
 const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);


 const navigate = useNavigate();
 const { fetchUser, setUser } = useUser();

 const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
 const validateUsername = (username) => /^[a-z0-9_]{3,20}$/.test(username);
 const validatePassword = (password) =>
 password.length >= 8 &&
 /[A-Za-z]/.test(password) &&
 /[0-9]/.test(password) &&
 /[^A-Za-z0-9]/.test(password);

 const checkUsernameAvailability = React.useCallback(
 async (val) => {
 if (!val) {
 setUsernameStatus("idle");
 setUsernameMessage("");
 return;
 }

 if (!validateUsername(val)) {
 setUsernameStatus("invalid");
 setUsernameMessage("3-20 chars, lowercase, numbers & underscore only");
 return;
 }

 setUsernameStatus("checking");
 try {
 const res = await fetch(`/api/check-username/${val}`);
 const data = await res.json();
 if (data.available) {
 setUsernameStatus("available");
 setUsernameMessage("Username is available!");
 } else {
 setUsernameStatus("taken");
 setUsernameMessage("Username is already taken");
 }
 } catch (err) {
 console.error("Check username error:", err);
 setUsernameStatus("idle");
 }
 },
 []
 );

 React.useEffect(() => {
 const timeoutId = setTimeout(() => {
 if (username) {
 checkUsernameAvailability(username);
 }
 }, 500);
 return () => clearTimeout(timeoutId);
 }, [username, checkUsernameAvailability]);


 const handleSubmit = async (e) => {
 e.preventDefault();
 setError("");

 if (!email.trim() || !password.trim() || !username.trim())
 return setError("All fields are required!");

 if (!validateUsername(username))
 return setError("Please enter a valid username!");

 if (usernameStatus !=="available")
 return setError("Please choose an available username!");


 if (!validateEmail(email))
 return setError("Please enter a valid email address!");

 if (!validatePassword(password))
 return setError(
"Password must be at least 8 characters, with letters, numbers & special characters."
 );

 setIsSubmitting(true);

 try {
 const res = await fetch("/api/users/signup", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ email, password, username }),
 credentials:"include",
 });

 const data = await res.json();

 if (!res.ok) {
 setError(data.message ||"Registration failed!");
 return;
 }

 // Signup succeeded
 toast.success("Account created successfully! Please verify your email.");

 // Immediately sync local user state so Onboarding knows who we are (even if unverified)
 setUser({
 _id: data.id,
 email,
 username,
 isVerified: false
 });

 // Show verification modal instead of redirecting
 setIsVerificationModalOpen(true);

 // Store ID and flag for navigation after verification
 localStorage.setItem('temp_signup_id', data.id);
 localStorage.setItem('new_signup_verification','true');


 } catch (err) {
 setError(err.message ||"An error occurred. Please try again.");
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleVerified = () => {
 // Check if this is a new signup (not a logged-in user verifying email)
 const isNewSignup = localStorage.getItem('new_signup_verification');
 const id = localStorage.getItem('temp_signup_id');

 if (isNewSignup ==='true'&& id) {
 // New user - redirect to onboarding
 enableNotifications(id,"user", true);
 navigate(`/onboarding/${id}`);
 } else {
 // Logged-in user or edge case - redirect to home
 if (id) enableNotifications(id,"user", true);
 navigate('/');
 }



 // Clean up localStorage flags
 localStorage.removeItem('new_signup_verification');
 localStorage.removeItem('temp_signup_id');
 };


 return (
 <>
 <motion.section
 variants={fadeUpVariant}
 initial="hidden"
 animate="visible"
 transition={{ duration: 0.8, ease:"easeOut"}}
 className="w-full mx-auto p-6 bg-white shadow-2xl rounded-2xl"
 >
 <img src={Logo} className="w-32 mx-auto mb-4"alt="Admeasy Logo"/>

 <h1 className="text-xl md:text-2xl font-admeasy-bold text-center text-gray-800 mb-3">
 Create a New Account
 </h1>

 <div
 className="flex flex-col w-full mx-auto"
 onKeyDown={(e) => {
 if (e.key ==='Enter') {
 e.preventDefault();
 handleSubmit(e);
 }
 }}
 >
 {error && (
 <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-center text-sm font-semibold mb-4">
 {error}
 </div>
 )}

 <div className="relative flex items-center mb-4">
 <MdAlternateEmail className="absolute left-3 text-gray-400 text-2xl"/>
 <input
 type="email"
 placeholder="Email"
 className="pl-11 pr-4 py-4 rounded-full w-full border-none outline-none font-bold text-gray-700 shadow-md bg-gray-100 focus:ring-2 focus:ring-brand-light/30 transition-all"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 autoComplete="email"
 disabled={isSubmitting}
 />
 </div>

 {/* Username Input */}
 <div className="relative mb-4">
 <div className="relative flex items-center">
 <span className="absolute left-3 text-gray-400 font-bold text-xl">@</span>
 <input
 type="text"
 placeholder="Username"
 className={`pl-11 pr-4 py-4 rounded-full w-full border-none outline-none font-bold text-gray-700 shadow-md bg-gray-100 focus:ring-2 transition-all ${usernameStatus ==="available"
 ?"focus:ring-green-400"
 : usernameStatus ==="taken"|| usernameStatus ==="invalid"
 ?"focus:ring-red-400"
 :"focus:ring-brand-light/30"
 }`}
 value={username}
 onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g,""))}
 autoComplete="username"
 disabled={isSubmitting}
 />
 </div>
 {usernameMessage && (
 <p className={`mt-1 ml-4 text-xs font-semibold ${usernameStatus ==="available"?"text-green-600":
 (usernameStatus ==="taken"|| usernameStatus ==="invalid") ?"text-red-600":"text-gray-500"
 }`}>
 {usernameMessage}
 </p>
 )}
 </div>

 {/* Password Input */}
 <div className="relative flex items-center mb-4">
 <MdLockOutline className="absolute left-3 text-gray-400 text-2xl"/>
 <input
 type={showPassword ?"text":"password"}
 placeholder="Password"
 className="pl-11 pr-12 py-4 rounded-full w-full border-none outline-none font-bold text-gray-700 shadow-md bg-gray-100 focus:ring-2 focus:ring-brand-light/30 transition-all"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 autoComplete="new-password"
 disabled={isSubmitting}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 text-gray-400 hover:text-black"
 >
 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
 </button>
 </div>

 {/* Submit */}
 {isSubmitting ? (
 <LoadingButton text={"Creating Account..."} variant={'blue'} />
 ) : (
 <button
 type="button"
 onClick={handleSubmit}
 disabled={usernameStatus !=="available"}
 className={`w-full inline-flex items-center justify-center px-8 py-3.5 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 ${usernameStatus ==="available"
 ?"bg-[#9f3562] hover:bg-[#b24a78] shadow-[#9f3562]/50 hover:shadow-xl hover:-translate-y-0.5"
 :"bg-gray-400 cursor-not-allowed"
 }`}
 >
 Create Account
 </button>
 )}
 </div>

 {/* Divider */}
 <div className="mt-6 flex items-center justify-center">
 <div className="flex-1 border-t border-gray-300"></div>
 <span className="px-4 text-gray-500 text-sm">or</span>
 <div className="flex-1 border-t border-gray-300"></div>
 </div>

 {/* Google OAuth */}
 <div className="mt-6">
 <a
 href="/api/users/auth/google"
 className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-300 text-gray-700 rounded-full text-base px-4 py-3 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all"
 >
 <svg className="w-5 h-5"viewBox="0 0 24 24">
 <path
 fill="#4285F4"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 />
 <path
 fill="#34A853"
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 />
 <path
 fill="#FBBC05"
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
 />
 <path
 fill="#EA4335"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
 />
 </svg>
 Continue with Google
 </a>
 </div>

 {/* Switch to Login */}
 <div className="mt-6 text-center">
 <span className="text-gray-700 text-sm">Already have an account? </span>
 <button
 onClick={() => {
   if (setAuthMode) setAuthMode("login");
   if (setShowLogin) setShowLogin(false);
 }}
 className="text-brand-light hover:underline font-semibold"
 >
 Log In
 </button>
 </div>
 </motion.section>

 {/* Email Verification Modal */}
 <EmailVerificationModal
 isOpen={isVerificationModalOpen}
 email={email}
 onVerified={handleVerified}
 />
 </>
 );
};

export default Signup;