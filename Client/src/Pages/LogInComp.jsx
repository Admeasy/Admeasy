import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Logo from '../assets/Admeasy/LOGO.webp'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext'
import { useMentor } from '../context/MentorContext'
import { FaTimes } from 'react-icons/fa'
import { MdAlternateEmail } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react"
import { MdLockOutline } from "react-icons/md";
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
    const { setMentor } = useMentor();
    const {user} = useUser()
    const validateEmail = (email) => {
        return /^\S+@\S+\.\S+$/.test(email);
    };
    const [showPassword, setShowPassword] = useState(false);
    const validatePassword = (password) => {
        return (
            password.length >= 8 &&
            /\d/.test(password) &&          // Contains number
            /[^A-Za-z0-9]/.test(password)   // Contains special character
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
                setMentor(null); // ensure mentor session is cleared
                await fetchUser(); // Refresh user context
                toast.info(`You're fine to go!`)
                navigate('/')
                
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
                    <div className="flex justify-end mt-1 mb-2">
  <Link
    to="/forgot-password"
    className="text-sm sm:text-base text-blue-600 hover:text-blue-700 hover:underline font-admeasy-semibold transition-colors duration-200"
  >
    Forgot Password?
  </Link>
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
                <div className="mt-4 flex items-center justify-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div className="mt-4">
                    <a
                        href="/api/users/auth/google"
                        className="flex items-center justify-center gap-3 w-full font-admeasy-semibold bg-white border-2 border-gray-300 text-gray-700 rounded-lg 
                        text-base px-4 py-3 hover:bg-gray-50 transition-all duration-150 ease-in-out cursor-pointer
                        shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </a>
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Don't have an account? </span>
                    <span onClick={()=>setShowLogin(!showLogin)} className="text-blue-600 hover:underline font-admeasy-semibold cursor-pointer">Create one</span>
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                    <span className="text-gray-700 text-sm sm:text-base">Are you a Mentor? </span>
                    <a href='/mentors/login' className="text-blue-600 hover:underline font-admeasy-semibold cursor-pointer">Log In now</a>
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