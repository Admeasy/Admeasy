import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../assets/Admeasy/LOGO.webp'
import googleIcon from '../assets/Icons/google.svg'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext'
import { FaTimes } from 'react-icons/fa'


const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
}

export default function LogIn({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { fetchUser } = useUser();

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

    return (
        <>
            {isOpen && <div className="w-full h-full fixed inset-0 bg-black/75 z-50"></div>}
            <motion.section
                variants={fadeUpVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className={`w-full max-w-[90vw] sm:max-w-lg md:max-w-xl lg:w-2/5 mx-auto p-4 sm:p-6 bg-primary shadow-3d rounded-2xl ${isOpen ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1000' : ''}`}
            >
                {isOpen && (
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-none hover:bg-black/5" onClick={onClose}>
                        <FaTimes size={24} />
                    </button>
                )}
                <img src={Logo} className='w-32 sm:w-1/2 mx-auto mb-4' alt="Admeasy Logo" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl text-center font-admeasy-bold text-tprimary mb-6 sm:mb-10">Log In to your Account</h1>
                <button className="w-full sm:w-2/3 bg-primary shadow-3d mx-auto p-2 rounded-xl flex items-center justify-evenly cursor-pointer text-lg sm:text-2xl font-admeasy-semibold transform hover:scale-105 transition-transform duration-200 mb-4 sm:mb-6"
                    onClick={() => window.location.href = 'http://localhost:5000/auth/google'}>
                    <img src={googleIcon} className='w-6 sm:w-8' alt="Google icon" />
                    Continue with Google
                </button>
                {/* Divider with OR */}
                <div className="relative flex items-center w-full sm:w-2/3 mx-auto my-4 sm:my-6">
                    <div className="flex-grow border-t border-gray-400"></div>
                    <span className="flex-shrink-0 px-1 bg-primary text-gray-700 text-base sm:text-lg font-semibold absolute left-1/2 -translate-x-1/2 -top-3">OR</span>
                    <div className="flex-grow border-t border-gray-400"></div>
                </div>
                <form className="flex flex-col gap-3 sm:gap-4 w-full sm:w-2/3 mx-auto" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-center text-xs sm:text-sm font-semibold">
                            {error}
                        </div>
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        className={`p-2 sm:p-3 rounded-lg border ${error && (error.includes('Email') || error.includes('email')) ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-base sm:text-lg`}
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        autoComplete="email"
                        disabled={isSubmitting}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className={`p-2 sm:p-3 rounded-lg border ${error && error.includes('Password') ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-base sm:text-lg`}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                    />
                    {/* <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</Link>
                </div> */}
                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-lg py-2 text-lg sm:text-xl font-admeasy-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-600"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Don't have an account? </span>
                    <Link to="/signup" className="text-blue-600 hover:underline font-admeasy-semibold">Create one</Link>
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Want to guide students? </span>
                    <a href="/careers/mentorship/apply" target='_blank' className="text-blue-600 hover:underline font-admeasy-semibold">Become a Mentor now</a>
                </div>
            </motion.section>
        </>
    )
}