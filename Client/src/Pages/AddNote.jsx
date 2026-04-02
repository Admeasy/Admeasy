import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMentor } from "../context/MentorContext";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import { Upload, X, FileText, ArrowLeft } from "lucide-react";

const AddNote = () => {
  const navigate = useNavigate();
  const { mentor, isLoading: mentorLoading } = useMentor();
  const { user, isLoading: userLoading } = useUser();
  const isLoading = mentorLoading || userLoading;
  const isMentor = !!mentor;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    schoolNotes: false,
    standard: "",
    pages: "",
    isFree: true,
    price: "",
    university: "",
    programme: "",
    course: "",
    tags: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Hashtag State & Logic
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");

  const handleHashtagKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      // Remove any '#' the user might have typed manually to prevent double ##
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

  // Redirect if not a mentor or not authenticated
  useEffect(() => {
    if (!isLoading && !mentor && !user) {
      navigate("/login"); // Redirect to general login if they are neither a user nor mentor
      return;
    }
  }, [mentor, user, isLoading, navigate]);

  // University options
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "schoolNotes" && checked ? { university: "", programme: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }

    // Validate file size (10MB)
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

  // Retry function with exponential backoff
  const fetchWithRetry = async (
    url,
    options,
    maxRetries = 2,
    retryCount = 0,
  ) => {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json().catch(() => ({
            message: `Server error: ${response.status}`,
          }));
          throw new Error(
            errorData.message ||
            `Request failed with status ${response.status}`,
          );
        }
        // For server errors (5xx), retry
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      // Don't retry on abort (timeout) or if max retries reached
      if (error.name === "AbortError") {
        throw new Error(
          "Request timeout. Please check your connection and try again.",
        );
      }

      // Retry logic
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
        console.log(
          `Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, maxRetries, retryCount + 1);
      }

      // If it's a network error, provide a helpful message
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your internet connection and try again.",
        );
      }

      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a PDF file to upload");
      return;
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'standard', 'course'];
    if (!formData.schoolNotes) {
      requiredFields.push('university', 'programme');
    }
    const missingFields = requiredFields.filter(
      (field) => !formData[field].trim(),
    );

    if (missingFields.length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Add all form fields with proper formatting
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Skip university and programme if schoolNotes is true
        if (formData.schoolNotes && (key === 'university' || key === 'programme')) {
          return;
        }

        // Skip empty strings, null, and undefined
        if (value !== "" && value !== null && value !== undefined) {
          // Convert boolean to string for FormData
          if (typeof value === "boolean") {
            submitData.append(key, value.toString());
          } else {
            submitData.append(key, value);
          }
        }
      });

      // NEW: Add hashtags to FormData
      submitData.append("hashtags", JSON.stringify(hashtags));

      // Validate file before adding
      if (!selectedFile) {
        toast.error("Please select a PDF file to upload");
        setIsSubmitting(false);
        return;
      }

      // Add file
      submitData.append("noteFile", selectedFile);

      console.log("Submitting note with:", {
        title: formData.title,
        hasFile: !!selectedFile,
        fileSize: selectedFile.size,
        fileName: selectedFile.name,
      });

      // Use retry function
      const response = await fetchWithRetry("/api/notes", {
        method: "POST",
        credentials: "include",
        body: submitData,
        // Note: Don't set Content-Type header - browser will set it with boundary for FormData
      });

      // Parse response with error handling
      let data;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // If response is not JSON, read as text for debugging
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error(
            "Server returned an invalid response. Please try again.",
          );
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }

      if (data.success) {
        toast.success(
          "Note uploaded successfully! It will be reviewed by admin before publishing.",
        );
        // Reset form
        setFormData({
          title: "",
          description: "",
          schoolNotes: false,
          standard: "",
          pages: "",
          isFree: true,
          price: "",
          university: "",
          programme: "",
          course: "",
          tags: "",
        });
        setSelectedFile(null);
        setFileError("");
        navigate("/notes");
      } else {
        throw new Error(data.message || "Failed to upload note");
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to upload note. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage =
          "Request timeout. Please check your connection and try again.";
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!mentor && !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Notes
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Notes
          </h1>
          <p className="text-gray-600 mb-6">
            Share your knowledge by uploading study notes for students
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="text-red-500" size={24} />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your PDF file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Maximum file size: 10MB
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
              {fileError && (
                <p className="text-red-500 text-sm mt-2">{fileError}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., CA Foundation Accounting Notes"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe what this note covers..."
                required
              />
            </div>

            {/* Standard and Pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard/Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="standard"
                  value={formData.standard}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 12th, CA Foundation, JEE Main"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Pages
                </label>
                <input
                  type="number"
                  name="pages"
                  value={formData.pages}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 150"
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Free to download
                </span>
              </label>
              {!formData.isFree && (
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Price in rupees"
                />
              )}
            </div>

            {/* School Notes Toggle */}
            <div className="flex items-center gap-2 p-4 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="schoolNotes"
                id="schoolNotesToggleAdd"
                checked={formData.schoolNotes}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="schoolNotesToggleAdd" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                This is a School Note
              </label>
            </div>

            {/* University */}
            {!formData.schoolNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University <span className="text-red-500">*</span>
                </label>
                <select
                  name="university"
                  value={formData.university}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select University</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>{uni.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Programme and Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!formData.schoolNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programme <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="programme"
                    value={formData.programme}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Programme</option>
                    {programmes.map(prog => (
                      <option key={prog.id} value={prog.id}>{prog.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={formData.schoolNotes ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Subject , B.Com, B.Tech CSE"
                  required
                />
              </div>
            </div>

            {/* Dynamic Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags for SEO
              </label>
              <div className="w-full p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[42px] bg-white flex flex-wrap gap-2 items-center">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-red-500 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  className="flex-1 outline-none border-none bg-transparent min-w-[120px] text-sm"
                  placeholder={
                    hashtags.length === 0
                      ? "Type tag & press Space..."
                      : "Add more..."
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? "Uploading..." : "Upload Notes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNote;
