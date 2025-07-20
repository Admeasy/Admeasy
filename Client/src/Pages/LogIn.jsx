import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../assets/Admeasy/LOGO.webp'
import googleIcon from '../assets/Icons/google.svg'
import { motion } from 'framer-motion'


const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
}

const LogIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setEmail('');
            setPassword('');
            // Optionally navigate to login after success
            // navigate('/login');
        }, 1200);
    };

    return (
        <motion.section
            variants={fadeUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="w-2/5 mx-auto p-6 bg-primary shadow-3d rounded-2xl">
            <img src={Logo} className='w-1/2 mx-auto mb-4' alt="Admeasy Logo" />
            <h1 className="text-5xl text-center font-admeasy-bold text-tprimary mb-10">Log In to your Account</h1>
            <button className="w-2/3 bg-primary shadow-3d mx-auto p-2 rounded-xl flex items-center justify-evenly cursor-pointer text-2xl font-admeasy-semibold transform hover:scale-105 transition-transform duration-200 mb-6">
                <img src={googleIcon} className='w-8' alt="Google icon" />
                Continue with Google
            </button>
            {/* Divider with OR */}
            <div className="relative flex items-center w-2/3 mx-auto my-6">
                <div className="flex-grow border-t border-gray-400"></div>
                <span className="flex-shrink-0 px-1 bg-primary text-gray-700 text-lg font-semibold absolute left-1/2 -translate-x-1/2 -top-3">OR</span>
                <div className="flex-grow border-t border-gray-400"></div>
            </div>
            <form className="flex flex-col gap-4 w-2/3 mx-auto" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-center text-sm font-semibold">
                        {error}
                    </div>
                )}
                <input
                    type="email"
                    placeholder="Email"
                    className={`p-3 rounded-lg border ${error && (error.includes('Email') || error.includes('email')) ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg`}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                    disabled={isSubmitting}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className={`p-3 rounded-lg border ${error && error.includes('Password') ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                />
                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</Link>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-lg py-2 text-xl font-admeasy-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Logging In...' : 'Log In'}
                </button>
            </form>
            <div className="mt-6 text-center">
                <span className="text-gray-700">Don't have an account? </span>
                <Link to="/signup" className="text-blue-600 hover:underline font-admeasy-semibold">Create one</Link>
            </div>
            <div className="mt-6 text-center">
                <span className="text-gray-700">Want to guide students? </span>
                <Link to="/login" className="text-blue-600 hover:underline font-admeasy-semibold">Become a Mentor now</Link>
            </div>
        </motion.section>
    )
}

export default LogIn