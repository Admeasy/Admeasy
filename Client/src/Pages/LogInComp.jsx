import React, { useEffect } from "react";
import LoadingButton from "../components/LoadingButton";
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from "react";
import { MdAlternateEmail, MdLockOutline } from 'react-icons/md';
import Logo from '../assets/Admeasy/AdmeasyLatest.png';
import MentorsLogo from '../assets/Admeasy/MentorsLoginLogo.webp';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import { enableNotifications } from "../Firebase/enableNotifications";



const LogInComp = ({ setAuthMode, onNotVerified }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { fetchUser } = useUser();
  const { setMentor } = useMentor();
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  };

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
  const validatePassword = (password) =>
    password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required!');
      return;
    } else if (!validateEmail(email)) {
      setError('Please enter a valid email address!');
      return;
    } else if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters long, contain a letter, a number, and a special character.'
      );
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();

if (res.ok) {
        setEmail('');
        setPassword('');
        setMentor(null);
        
        // Pass the switchToken from backend to fetchUser so it saves the account
        const loggedInUser = await fetchUser(data.switchToken); 
        
        if (loggedInUser) {
          enableNotifications(loggedInUser._id, "user", true);
        }

        const requiresOnboarding = data.requiresOnboarding || 
                                  !data.hasCompletedOnboarding ||
                                  (data.onboardingStatus && !data.onboardingStatus.isComplete);

        if (requiresOnboarding && loggedInUser) {
          toast.info("Please complete your profile to continue");
          navigate(`/onboarding/${loggedInUser._id}`, { replace: true });
        } else {
          toast.success("You're all set!");
          navigate('/');
        }
      }
      else {

        if (data.isNotVerified) {
          onNotVerified(email);
          setError(''); // Clear error if we're showing the modal
        } else {
          setError(data.message || 'An error occurred. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full mx-auto p-6 bg-white shadow-2xl rounded-2xl"
    >
      <img src={Logo} className="w-32 mx-auto mb-4" alt="Admeasy Logo" />
      <h1 className="text-2xl text-center font-bold text-gray-800 mb-2">
        Log In to your Account
      </h1>

      <form className="flex flex-col w-full mx-auto" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-center text-sm font-semibold mb-4">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="relative flex items-center mb-4">
          <MdAlternateEmail className="absolute left-3 text-gray-400 text-2xl" />
          <input
            type="email"
            placeholder="Email"
            className="pl-10 pr-4 py-4 rounded-full w-full border-none outline-none font-bold text-gray-700 shadow-md bg-gray-100 focus:ring-2 focus:ring-brand-light/30 transition-all"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        {/* Password Input */}
        <div className="relative flex items-center mb-2">
          <MdLockOutline className="absolute left-3 text-gray-400 text-2xl" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="pl-10 pr-12 py-4 rounded-full w-full border-none outline-none font-bold text-gray-700 shadow-md bg-gray-100 focus:ring-2 focus:ring-[#9f3562]/30 transition-all"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            autoComplete="current-password"
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

        {/* Forgot Password */}
        <div className="flex justify-end mb-4">
          <a
            href="/forgot-password"
            className="text-sm text-brand-light hover:underline font-semibold"
          >
            Forgot Password?
          </a>
        </div>

        {/* Submit Button */}
        {isSubmitting ? <LoadingButton text={"Logging In..."} variant={'blue'} />
          : <button
            type="submit"
            className="w-full relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-semibold rounded-xl bg-[#9f3562] hover:bg-[#b24a78] shadow-[#9f3562]/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            disabled={isSubmitting}
          >
            Log In
          </button>
        }
      </form>

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
          className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-300 text-gray-700 rounded-full text-base px-4 py-3 hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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

      {/* Switch to Signup */}
      <div className="mt-6 text-center">
        <span className="text-gray-700 text-sm">Don't have an account? </span>
        <button
          onClick={() => setAuthMode('signup')}
          className="text-brand-light hover:underline font-semibold cursor-pointer"
        >
          Create one
        </button>
      </div>
    </motion.section>
  );
};
export default LogInComp