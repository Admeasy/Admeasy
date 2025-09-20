import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../assets/Admeasy/LOGO.webp'
import googleIcon from '../assets/Icons/google.svg'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext'
import { FaTimes } from 'react-icons/fa'
import { MdAlternateEmail } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react"
import { MdLockOutline } from "react-icons/md";
import Ballpit from '../components/Ballpit'
import { toast } from 'react-toastify'
const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
}

export default function LogInComp({ isOpen, onClose,showLogin,setShowLogin}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { fetchUser } = useUser();

    const validateEmail = (email) => {
        return /^\S+@\S+\.\S+$/.test(email);
    };
    const [showPassword, setShowPassword] = useState(false);
    const validatePassword = (password) => {
        // At least 8 characters, one letter, one number, one non-alphanumeric
        return (
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required!');
            return;
        } else if (!validateEmail(email)) {
            setError('Please enter a valid email address!');
            return;
        } else if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long, contain a letter, a number, and a special character.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setEmail('');
                setPassword('');
                await fetchUser(); // Refresh user context
                isOpen ? onClose() : navigate('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
        setIsSubmitting(false);
    };
const googleAuthUrl = 
  process.env.NODE_ENV === "production" 
    ? "https://admeasy.in/auth/google" 
    : "http://localhost:5000/auth/google";

    return (
        <>
            {isOpen && <div className="w-full h-full fixed inset-0 bg-black/75 z-50"></div>}
           <motion.section
                       variants={fadeUpVariant}
                       initial="hidden"
                       whileInView="visible"
                       viewport={{ once: true, amount: 0.25 }}
                       transition={{ duration: 0.9, ease: 'easeOut' }}
                       className="w-full mx-auto p-4 bg-white shadow-3d rounded-2xl"
                   >
                <div className='bg-white p-4 ml-auto mr-auto rounded-2xl w-full'>
                {isOpen && (
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-none hover:bg-black/5" onClick={onClose}>
                        <FaTimes size={24} />
                    </button>
                )}
                {/* Admeasy Logo */}
                <img src={Logo} className='w-32 mx-auto mb-4' alt="Admeasy Logo" />
                {/* Text */}
                <h1 className="text-[19px] sm:text-4xl md:text-2xl text-center font-admeasy-bold text-tprimary mb-2">Log In to your Account</h1>
                <form className="flex flex-col w-full sm:w-2/3 mx-auto" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-center text-xs sm:text-sm font-semibold">
                            {error}
                        </div>
                    )}
                    
                    <div className='relative flex items-center'>
                    <MdAlternateEmail className='absolute bottom-4 left-1 text-gray-400 text-2xl font-admeasy-extrabold'/>
                    <input
                        type="email"
                        placeholder="Email"
                        className={`pl-8 py-4 rounded-full w-full border-none outline-none 
    font-bold text-gray-700 text-base mt-5
    shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)]
    bg-[#e9e9e9]
    active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]
    transition-all duration-150 ease-in-out ${error && (error.includes('Email') || error.includes('email')) ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 text-base sm:text-lg`}
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        autoComplete="email"
                        disabled={isSubmitting}
                    />
                    </div>
                    
                    <div className='relative flex items-center'>
                        <MdLockOutline className='absolute bottom-8 left-1 text-gray-400 text-2xl font-admeasy-extrabold' />
                     <input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        className={`pl-8 pr-12 py-4 my-4 rounded-full w-full border-none outline-none 
          font-bold text-gray-700 text-base mt-5
          shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)]
          bg-[#e9e9e9] active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]
          transition-all duration-150 ease-in-out ${error && error.includes('Password') ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:outline-gray-300 text-base sm:text-lg`}
        value={password}
        onChange={e => { setPassword(e.target.value); setError(''); }}
        autoComplete="new-password"
        disabled={isSubmitting}
      />

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
      >
        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
      </button>
                    </div>
                    {/* <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</Link>
                </div> */}
                <div className='w-full text-center'>
                    <button
                        type="submit"
                        className=" font-admeasy-bold font-inherit bg-[#f0f0f0] border-0 text-[#242424] rounded-lg
        text-[1.35rem] px-4 sm:px-6 md:px-8 lg:px-12 py-[0.375em] font-semibold 
        [text-shadow:0_1px_0_#fff]
        shadow-[inset_0_1px_0_0_#f4f4f4,0_1px_0_0_#efefef,0_2px_0_0_#ececec,0_4px_0_0_#e0e0e0,0_5px_0_0_#dedede,0_6px_0_0_#dcdcdc,0_6.8px_0_0_#cacaca,0_6.8px_8px_0_#cecece]
        transition-all duration-150 ease-in-out cursor-pointer
        active:translate-y-[0.225em]
        active:shadow-[inset_0_0.48px_0_0_#f4f4f4,0_0.48px_0_0_#efefef,0_1px_0_0_#ececec,0_2px_0_0_#e0e0e0,0_2px_0_0_#dedede,0_3.2px_0_0_#dcdcdc,0_3.6px_0_0_#cacaca,0_3.6px_6px_0_#cecece]
      "
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging In...' : 'Log In'}
                    </button>
                    </div>
                </form>
                {/* When Issue Fixed */}
                 {/* <button className="bg-primary shadow-3d mx-auto p-2 rounded-xl flex items-center justify-evenly cursor-pointer font-admeasy-semibold transform hover:scale-105 transition-transform duration-200 mt-4 gap-1 text-[14px] lg:text-[17px]"
                    onClick={() => window.location.href = googleAuthUrl}>
                    <img src={googleIcon} className='w-3 sm:w-5' alt="Google icon" />
                    Continue with Google
                </button> */}
                {/* While Issue */}
                <button className="bg-primary shadow-3d mx-auto p-2 rounded-xl flex items-center justify-evenly cursor-pointer font-admeasy-semibold transform hover:scale-105 transition-transform duration-200 mt-4 gap-1 text-[14px] lg:text-[17px]"
                    onClick={() => toast.error('Google login error — please try again later.')}>
                    <img src={googleIcon} className='w-3 sm:w-5' alt="Google icon" />
                    Continue with Google
                </button>
                <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Don't have an account? </span>
                    <span onClick={()=>setShowLogin(!showLogin)} className="text-blue-600 hover:underline font-admeasy-semibold cursor-pointer">Create one</span>
                </div>
                {/* <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Want to guide students? </span>
                    <a href="/careers/mentorship/apply" target='_blank' className="text-blue-600 hover:underline font-admeasy-semibold">Become a Mentor now</a>
                </div> */}
                </div>

            
     </motion.section>
        </>
    )
}