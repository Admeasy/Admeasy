import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
const Logo = '/LOGO.webp';
import { MdLockOutline } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function ResetPassword() {
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
    if (!validatePassword()){
    return toast.error("Password needs 8+ chars, a letter, number & special symbol");
    }
      
    setLoading(true);
    try {
      const res = await fetch(`/api/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully!");
        navigate("/login");
      } else toast.error(data.message || "Invalid or expired token");
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  };

  return (
    
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="flex flex-col items-center mb-6 p-6 shadow-3d rounded-2xl mt-10"
    >
      <img src={Logo} alt="Admeasy" className="w-32 mx-auto mb-4" />
      <h1 className="text-2xl font-admeasy-bold text-center text-tprimary mb-4">
        Reset Your Password
      </h1>

      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div className="relative">
          <MdLockOutline className="absolute top-3 left-3 text-gray-400 text-xl" />
          <input
            type={show ? "text" : "password"}
            placeholder="New Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-full bg-[#e9e9e9] font-semibold
            shadow-[0_4px_0_#b5b5b5,0_4px_6px_rgba(0,0,0,0.2)] focus:ring-2 outline-none"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
          >
            {show ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>

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
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
      </form>
    </motion.section>
  );
}