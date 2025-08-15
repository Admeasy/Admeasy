import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../assets/Admeasy/LOGO.webp'
import googleIcon from '../assets/Icons/google.svg'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext';
import { MdAlternateEmail } from "react-icons/md";
import { MdLockOutline } from "react-icons/md";

const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
}

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { fetchUser } = useUser();
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const validateEmail = (email) => {
        return /^\S+@\S+\.\S+$/.test(email);
    };

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
            const res = await fetch('/api/users/signup', {
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
                navigate('/me');
                window.location.reload();
            } else {
                setError(data.message || 'Registration failed');
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
        <motion.section
            variants={fadeUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="w-full max-w-[90vw] sm:max-w-lg md:max-w-xl lg:w-2/5 mx-auto p-4 sm:p-6 bg-primary shadow-3d rounded-2xl"
        >
            <img src={Logo} className='w-32 sm:w-1/2 mx-auto mb-4' alt="Admeasy Logo" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-center font-admeasy-bold text-tprimary mb-6 sm:mb-10">Create a New Account</h1>
            <button className="w-full sm:w-2/3 bg-primary shadow-3d mx-auto p-2 rounded-xl flex items-center justify-evenly cursor-pointer text-lg sm:text-2xl font-admeasy-semibold transform hover:scale-105 mb-4 sm:mb-6"
                onClick={() => window.location.href = googleAuthUrl}> 
                <img src={googleIcon} className='w-6 sm:w-8' alt="Google icon" />
                Continue with Google
            </button>
            {/* http://localhost:5000/auth/google */}
            {/* Divider with OR */}
            <div className="relative flex items-center w-full sm:w-2/3 mx-auto my-4 sm:my-6">
                <div className="flex-grow border-t border-gray-400"></div>
                <span className="flex-shrink-0 px-1 bg-primary text-gray-700 text-base sm:text-lg font-semibold absolute left-1/2 -translate-x-1/2 -top-3">OR</span>
                <div className="flex-grow border-t border-gray-400"></div>
            </div>
            <form className=" flex flex-col gap-3 sm:gap-4 w-full sm:w-2/3 mx-auto" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-center text-xs sm:text-sm font-semibold">
                        {error}
                    </div>
                )}
                 <div className='relative flex items-center'>
                    <MdAlternateEmail className='absolute bottom-8 left-1 text-gray-400 text-2xl font-admeasy-extrabold'/>
                <input
                    type="email"
                    placeholder="Email"
                    className={`pl-8 py-4 my-4 rounded-full w-full border-none outline-none 
    font-bold text-gray-700 text-base mt-5
    shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)]
    bg-[#e9e9e9] active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]
    transition-all duration-150 ease-in-out ${error && (error.includes('Email') || error.includes('email')) ? 'border-red-500' : 'border-gray-300'} focus: focus:ring-2  text-base sm:text-lg`}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                    disabled={isSubmitting}
                />
                </div>
                 <div className='relative flex items-center'>
                        <MdLockOutline className='absolute bottom-8 left-1 text-gray-400 text-2xl font-admeasy-extrabold' />
                <input
                    type="password"
                    placeholder="Password"
                    className={`pl-8 py-4 my-4 rounded-full w-full border-none outline-none 
    font-bold text-gray-700 text-base mt-5
    shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)]
    bg-[#e9e9e9]
     active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]
    transition-all duration-150 ease-in-out ${error && error.includes('Password') ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 text-base sm:text-lg`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                />
                </div>
                <button
                    type="submit"
                    className="font-admeasy font-inherit bg-[#f0f0f0] border-0 text-[#242424] rounded-lg 
        text-[1.35rem] px-4 py-[0.375em] font-semibold 
        [text-shadow:0_1px_0_#fff]
        shadow-[inset_0_1px_0_0_#f4f4f4,0_1px_0_0_#efefef,0_2px_0_0_#ececec,0_4px_0_0_#e0e0e0,0_5px_0_0_#dedede,0_6px_0_0_#dcdcdc,0_6.8px_0_0_#cacaca,0_6.8px_8px_0_#cecece]
        transition-all duration-150 ease-in-out cursor-pointer
        active:translate-y-[0.225em]
        active:shadow-[inset_0_0.48px_0_0_#f4f4f4,0_0.48px_0_0_#efefef,0_1px_0_0_#ececec,0_2px_0_0_#e0e0e0,0_2px_0_0_#dedede,0_3.2px_0_0_#dcdcdc,0_3.6px_0_0_#cacaca,0_3.6px_6px_0_#cecece]
      "
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>
            <div className="mt-4 sm:mt-6 text-center">
                <span className="text-gray-700 text-sm sm:text-base">Already have an account? </span>
                <Link to="/login" className="text-blue-600 hover:underline font-admeasy-semibold">Log In</Link>
            </div>
            <div className="mt-4 sm:mt-6 text-center">
                <span className="text-gray-700 text-sm sm:text-base">Want to guide students? </span>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSeK9OSftbLbTUpYCJjs7Y9CPKVilVTvz7i-D0KZApmdVCnEqw/viewform?usp=dialog" target='_blank' className="text-blue-600 hover:underline font-admeasy-semibold">Become a Mentor now</a>
            </div>
        </motion.section>
    )
}

export default SignUp