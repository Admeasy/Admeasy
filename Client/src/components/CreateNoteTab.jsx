import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMentor } from "../context/MentorContext";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import { Upload, X, FileText, Loader2, Send } from "lucide-react";

const CreateNoteTab = () => {
  const navigate = useNavigate();
  const { mentor } = useMentor();
  const { user } = useUser();

  const universities = [
    { id: "du", label: "Delhi University" },
    { id: "mu", label: "Mumbai University" },
    { id: "davu", label: "Devi Ahilya Vishwavidyalaya" },
    { id: "rgpv", label: "RGPV Bhopal" },
    { id: "iit", label: "IIT (All Campuses)" },
    { id: "iim", label: "IIM (All Campuses)" },
    { id: "lu", label: "Lucknow University" },
    { id: "manipal", label: "Manipal University" },
    { id: "sage", label: "Sage University" },
    { id: "medicaps", label: "Medicaps University" },
    { id: "oriental", label: "Oriental University" },
    { id: "pu", label: "Panjab University" },
  ];

  const programmes = [
    { id: "bachelors", label: "Bachelors" },
    { id: "masters", label: "Masters" },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    schoolNotes: false,
    university: "",
    programme: "",
    standard: "",
    subject: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");

  const handleHashtagKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newTag = hashtagInput.trim().replace(/^#/, "");
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const isSchoolNoteToggle = name === "schoolNotes";
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(isSchoolNoteToggle && checked ? { university: "", programme: "" } : {})
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size must be less than 10MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a PDF file to upload");
      return;
    }

    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.schoolNotes) {
      if (!formData.university?.trim()) {
        toast.error("University is required");
        return;
      }

      if (!formData.programme?.trim()) {
        toast.error("Programme is required");
        return;
      }
    }

    if (!formData.standard?.trim()) {
      toast.error("Class/Standard is required");
      return;
    }

    if (!formData.subject?.trim()) {
      toast.error("Subject is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title?.trim() || "");
      submitData.append("description", formData.description?.trim() || "");
      submitData.append("schoolNotes", formData.schoolNotes);
      if (!formData.schoolNotes) {
        submitData.append("university", formData.university?.trim() || "");
        submitData.append("programme", formData.programme?.trim() || "");
      }
      submitData.append("standard", formData.standard?.trim() || "");
      submitData.append("course", formData.subject?.trim() || ""); // maps to existing 'course' field in backend
      submitData.append("isFree", "true");
      submitData.append("hashtags", JSON.stringify(hashtags));
      submitData.append("noteFile", selectedFile);

      const response = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        body: submitData,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Invalid response from server. Please try again.");
      }

      if (data.success) {
        toast.success(
          "Notes uploaded successfully! 📚 It will be reviewed before publishing.",
        );
        // Reset form
        setFormData({ title: "", description: "", schoolNotes: false, university: "", programme: "", standard: "", subject: "" });
        setSelectedFile(null);
        setFileError("");
        setHashtags([]);
        setHashtagInput("");
      } else {
        throw new Error(data.message || "Failed to upload notes");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg = error.message || "Failed to upload notes. Please try again.";
      toast.error(errorMsg.includes('Cannot read properties') ? 'An internal error occurred. Please try again.' : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          PDF File <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#9f3562]/40 transition-colors bg-slate-50">
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="text-[#9f3562]" size={24} />
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-slate-400 mb-2" size={28} />
              <p className="text-slate-600 text-sm mb-1">
                Drag and drop your PDF here, or click to browse
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Maximum file size: 10MB
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="note-file-upload"
              />
              <label
                htmlFor="note-file-upload"
                className="inline-block bg-[#9f3562] text-white px-5 py-2 rounded-xl cursor-pointer hover:bg-[#b14270] transition-colors text-sm font-semibold"
              >
                Choose File
              </label>
            </div>
          )}
        </div>
        {fileError && (
          <p className="text-red-500 text-xs mt-1.5">{fileError}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm"
          placeholder="e.g., Class 12 Physics Notes - Electrostatics"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all resize-none text-sm"
          placeholder="Describe what these notes cover..."
        />
      </div>

      {/* School Notes Toggle */}
      <div>
        <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            name="schoolNotes"
            checked={formData.schoolNotes}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#9f3562] focus:ring-[#9f3562] border-slate-300 rounded"
          />
          <span className="text-sm font-semibold text-slate-700 select-none">
            This is a School Note
          </span>
        </label>
      </div>

      {/* University and Programme side by side */}
      {!formData.schoolNotes && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              University <span className="text-red-500">*</span>
            </label>
            <select
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm appearance-none bg-white"
            >
              <option value="">Select University</option>
              {universities.map(uni => (
                <option key={uni.id} value={uni.id}>{uni.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Programme <span className="text-red-500">*</span>
            </label>
            <select
              name="programme"
              value={formData.programme}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm appearance-none bg-white"
            >
              <option value="">Select Programme</option>
              {programmes.map(prog => (
                <option key={prog.id} value={prog.id}>{prog.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Class and Subject side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Class / Standard <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="standard"
            value={formData.standard}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm"
            placeholder="e.g., Class 12, JEE, NEET"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm"
            placeholder="e.g., Physics, Maths, Accounts"
          />
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tags
        </label>
        <div className="w-full p-3 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#9f3562]/20 focus-within:border-[#9f3562]/50 min-h-[46px] bg-slate-50 flex flex-wrap gap-2 items-center transition-all">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="bg-[#9f3562]/10 text-[#9f3562] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeHashtag(tag)}
                className="hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            className="flex-1 outline-none border-none bg-transparent min-w-[120px] text-sm text-slate-700 placeholder:text-slate-400"
            placeholder={
              hashtags.length === 0
                ? "Add tags (press Space or Enter)..."
                : "Add more tags..."
            }
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#9f3562] hover:bg-[#b14270] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Upload Notes</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CreateNoteTab;
