import { useState, useEffect } from "react";
import { MdAlternateEmail, MdLockOutline } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mentorsLogo from "../assets/Admeasy/MentorsLoginLogo.webp";
import { useSearchParams, useNavigate } from "react-router-dom";

// Animation variants
const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
};

const slideLeftVariant = {
    hidden: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
};

const slideRightVariant = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0 },
};

const MentorRegistration = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [ params, setParams ] = useSearchParams();
    const id = params.get('id');
    const navigate = useNavigate();

    useEffect(() => {
        async function verify1() {
            if (!id) {
                navigate('/');
                return;
            }
            
            try {
                const res = await fetch('/api/apply/mentorship/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                    credentials: 'include'
                });
                
                if (!res.ok) {
                    navigate('/');
                    return;
                }
            } catch (err) {
                console.error('Verification error:', err);
                navigate('/');
            }
        }
        
        verify1();
    }, [id, navigate])

    const handleNext = () => {
        if (!formData.email.trim()) {
            setError("Email is required!");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address!");
            return;
        }

        setError("");
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.password.trim() || !formData.confirmPassword.trim()) {
            setError("Both password fields are required!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long!");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/mentors/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                console.log("✅ Registration successful:", data);
                // You can handle success here (e.g., redirect or show success message)
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("An error occurred. Please try again.");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 min-w-screen min-h-screen flex items-center justify-center">
            <motion.section
                variants={fadeUpVariant}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md p-2 pb-5 bg-white shadow-lg rounded-2xl"
            >
                <div className="flex flex-col items-center">
                    <img
                        src={mentorsLogo}
                        className="w-40 mb-4"
                        draggable="false"
                        alt="Admeasy Mentors"
                    />

                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-center text-xs font-semibold mb-2 w-full max-w-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="w-full max-w-sm">
                        <div className="relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.div
                                        key="step1"
                                        variants={slideLeftVariant}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Email */}
                                        <div className="relative mb-4">
                                            <MdAlternateEmail className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Email"
                                                className="pl-11 pr-4 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-indigo-300 outline-none"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    setError("");
                                                }}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                            className="w-full bg-indigo-500 text-white font-bold py-3 rounded-full shadow-md hover:bg-indigo-600 transition disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        variants={slideRightVariant}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Password */}
                                        <div className="relative mb-4">
                                            <MdLockOutline className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Password"
                                                className="pl-11 pr-12 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-indigo-300 outline-none"
                                                value={formData.password}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, password: e.target.value });
                                                    setError("");
                                                }}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="relative mb-4">
                                            <MdLockOutline className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="Confirm Password"
                                                className="pl-11 pr-12 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-indigo-300 outline-none"
                                                value={formData.confirmPassword}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        confirmPassword: e.target.value,
                                                    });
                                                    setError("");
                                                }}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff size={20} />
                                                ) : (
                                                    <Eye size={20} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Back Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setError("");
                                            }}
                                            disabled={isSubmitting}
                                            className="w-full mb-2 bg-gray-300 text-gray-700 font-bold py-3 rounded-full shadow-md hover:bg-gray-400 transition disabled:opacity-50"
                                        >
                                            Back
                                        </button>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-indigo-500 text-white font-bold py-3 rounded-full shadow-md hover:bg-indigo-600 transition disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Creating Account..." : "Create Account"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>
            </motion.section>
        </div>
    );
};

export default MentorRegistration;
