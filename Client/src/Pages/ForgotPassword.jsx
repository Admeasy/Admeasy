import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
const Logo = '/LOGO.webp';
import { MdAlternateEmail } from "react-icons/md";
import { toast } from "react-toastify";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await fetch(`/api/users/forgot-password`, {
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
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="w-full max-w-md mb-8 mx-auto p-6 bg-white shadow-3d rounded-2xl mt-10"
    >
      <img src={Logo} alt="Admeasy" className="w-32 mx-auto mb-4" />
      <h1 className="text-2xl font-admeasy-bold text-center text-tprimary mb-2">
        Forgot Password?
      </h1>
      <p className="text-center text-gray-600 mb-4 text-sm">
        Enter your registered email to receive a password reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <MdAlternateEmail className="absolute top-3 left-3 text-gray-400 text-xl" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full pl-10 pr-3 py-3 rounded-full bg-[#e9e9e9] font-semibold 
              shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)] focus:ring-2 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="font-admeasy-bold bg-[#f0f0f0] text-[#242424] rounded-lg 
          text-[1.35rem] py-[0.5em] shadow-[inset_0_1px_0_0_#f4f4f4,0_1px_0_0_#efefef,0_2px_0_0_#ececec,0_4px_0_0_#e0e0e0,0_5px_0_0_#dedede]
          active:translate-y-[0.225em] transition-all duration-150"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="text-center mt-6 text-sm">
        <span className="text-gray-600">Remember your password? </span>
        <Link to="/login" className="text-blue-600 font-admeasy-semibold hover:underline">
          Go back
        </Link>
      </div>
    </motion.section>
  );
}