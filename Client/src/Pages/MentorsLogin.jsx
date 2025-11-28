import React, { useState } from "react";
import { MdAlternateEmail, MdLockOutline } from "react-icons/md";
import { Eye, EyeOff, X } from "lucide-react";
import { motion } from "framer-motion";
import mentorsLogo from "../assets/Admeasy/MentorsLoginLogo.webp";
import { Upload, User, BookOpen, GraduationCap, Sparkles, FileText, Calendar } from "lucide-react";
import { useMentor } from "../context/MentorContext";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";


// Animation variant
const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

// ✅ Main Wrapper Component
export default function MentorPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      {!isLoggedIn ? (
        <MentorsLogin onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <MentorsProfile />
      )}
    </>
  );
}

// ✅ LOGIN FORM
function MentorsLogin({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ mentorId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { fetchMentor, mentor } = useMentor();
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mentorId.trim() || !formData.password.trim()) {
      setError("Mentor ID and password are required!");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/mentors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.mentorId, password: formData.password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        // Fetch mentor data and store in context
        setUser(null); // ensure user session is cleared
        await fetchMentor();
        
        // Wait for mentor to be available in localStorage (set by MentorContext)
        // This ensures the ProtectedRoute will see the mentor in context
        let attempts = 0;
        while (attempts < 10) {
          const mentorStored = localStorage.getItem('admeasy:mentor');
          const roleStored = localStorage.getItem('admeasy:authRole');
          if (mentorStored && roleStored === 'mentor') {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }
        
        // Navigate to profile edit page
        navigate('/me');
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
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
        className="w-full max-w-md p-2 pb-5 bg-white shadow-lg rounded-2xl">
        <div className="flex flex-col items-center">
          <img
            src={mentorsLogo}
            className="w-40 mb-4"
            draggable="false"
            alt="Mentors Login"
          />

          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-center text-xs font-semibold mb-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="">
            {/* Mentor ID */}
            <div className="relative mb-4">
              <MdAlternateEmail className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
              <input
                type="text"
                name="mentorId"
                placeholder="Mentor ID"
                className="pl-11 pr-4 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-indigo-300 outline-none"
                value={formData.mentorId}
                onChange={(e) =>
                  setFormData({ ...formData, mentorId: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <MdLockOutline className="absolute bottom-4 left-3 text-gray-400 text-2xl" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="pl-11 pr-12 py-4 rounded-full w-full bg-[#e9e9e9] text-gray-700 font-bold shadow-md focus:ring-2 focus:ring-indigo-300 outline-none"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-500 text-white font-bold py-3 rounded-full shadow-md hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {isSubmitting ? "Logging In..." : "Login"}
            </button>
          </form>
        </div>
      </motion.section>
    </div>
  );
}

function MentorsProfile() {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    college: "",
    bio: "",
    tagline: "",
    dob: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [examInput, setExamInput] = useState("");
  const [exams, setExams] = useState([]);

  const handleInputChange = (e) => {
    const {name, type,value} = e.target
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    console.log(e.target.value)
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleExamKeyPress = (e) => {
    if ((e.key === "Enter" || e.key === " ") && examInput.trim()) {
      e.preventDefault();
      setExams([...exams, examInput.trim()]);
      setExamInput("");
    }
  };

  const removeExam = (index) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    console.log("Profile updated:", { ...formData, exams });
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600 text-sm">Share your story with the student community</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Photo Section */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <label htmlFor="profile-upload" className="cursor-pointer block">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-purple-400 transition-all">
                    <img
                      src={
                        profileImage ||
                        "https://via.placeholder.com/150/8B5CF6/ffffff?text=+"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{formData.name || "Your Name"}</h3>
                <label htmlFor="profile-upload" className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                  Change profile photo
                </label>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-6 py-6">
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  placeholder="Describe yourself in a few words"
                />
                <p className="text-xs text-gray-500 mt-1.5">A catchy headline that appears on your profile</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none"
                  placeholder="Your Bio"/>
                <p className={`inline-block text-xs ${formData.bio.length>150?'text-red-700':'text-gray-500'} mt-1.5`}>{formData.bio.length}</p> <span className="text-xs text-gray-500">/150</span>
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Course
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  placeholder="e.g., B.Tech Computer Science"
                />
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  College/University
                </label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  placeholder="Your college name"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1.5">This won't be shown publicly</p>
              </div>

              {/* Exams */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Exams Cleared
                </label>
                <input
                  type="text"
                  value={examInput}
                  onChange={(e) => setExamInput(e.target.value)}
                  onKeyPress={handleExamKeyPress}
                  placeholder="Type exam name and press Enter"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                />
                {exams.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {exams.map((exam, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm"
                      >
                        <span className="font-medium">{exam}</span>
                        <button
                          onClick={() => removeExam(i)}
                          className="hover:bg-gray-200 rounded-full p-0.5 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
             <div className="mt-8 flex gap-4">
              <button
                onClick={handleSubmit}
                className="cursor-pointer flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-xs mt-6">
          When you share personal information, you give people on the platform access to this info
        </p>
      </div>
    </div>
  );
}