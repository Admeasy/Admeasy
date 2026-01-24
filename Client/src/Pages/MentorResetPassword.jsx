import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import mentorsLogo from "../assets/Admeasy/AdmeasyLatest.png";
import { MdLockOutline } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

export default function MentorResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    const validatePassword = () => {
      return (
        password.length >= 8 &&
        /\d/.test(password) &&          // Contains number
        /[^A-Za-z0-9]/.test(password)   // Contains special character
      );
    };
    // Validation
    if (!validatePassword()) {
      return toast.error("Password needs 8+ chars, a letter, number & special symbol");
    }

    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/mentors/login");
      return;
    }

    setLoading(true);
    try {
      // Token from useParams is already decoded, but we need to ensure it's properly encoded in the URL
      // React Router handles URL encoding, but we'll encode it to be safe
      const encodedToken = encodeURIComponent(token);
      const res = await fetch(`/api/mentors/reset-password/${encodedToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully!");
        navigate("/mentors/login");
      } else {
        toast.error(data.message || "Invalid or expired token");
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <motion.section
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-2 py-5 bg-white shadow-lg rounded-2xl"
      >
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <img
              src={mentorsLogo}
              className="w-40"
              draggable="false"
              alt="Mentors Reset Password"
            />
            <p className="font-admeasy-bold primary-color text-1xl">Mentors</p>
          </div>

          <h1 className="text-2xl font-admeasy-bold text-center text-gray-800 mb-4">
            Reset Your Password
          </h1>

          <form onSubmit={handleReset} className="w-full">
            <div className="relative mb-4">
              <MdLockOutline className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
              <input
                type={show ? "text" : "password"}
                placeholder="New Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-12 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-purple-500/30 outline-none"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
              >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-semibold rounded-xl bg-purple-900 hover:bg-purple-700 shadow-[#9f3562]/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </motion.section>
    </div>
  );
}
