import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import mentorsLogo from "../assets/Admeasy/AdmeasyLatest.png";
import { MdAlternateEmail } from "react-icons/md";
import { toast } from "react-toastify";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

export default function MentorForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await fetch(`/api/mentors/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Reset link sent to your email!");
        setEmail("");
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network error. Try again later.");
    }
    setLoading(false);
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
              alt="Mentors Forgot Password"
            />
            <p className="font-admeasy-bold primary-color text-1xl">Mentors</p>
          </div>

          <h1 className="text-2xl font-admeasy-bold text-center text-gray-800 mb-2">
            Forgot Password?
          </h1>
          <p className="text-center text-gray-600 mb-4 text-sm">
            Enter your registered email to receive a password reset link.
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative mb-4">
              <MdAlternateEmail className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="pl-11 pr-4 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-purple-500/30 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-semibold rounded-xl bg-purple-900 hover:bg-purple-700 shadow-[#9f3562]/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            <span className="text-gray-600">Remember your password? </span>
            <span
              onClick={() => navigate("/mentors/login")}
              className="text-purple-700 font-semibold hover:text-purple-900 cursor-pointer hover:underline"
            >
              Go back
            </span>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
