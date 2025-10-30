import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function MentorsProfile() {
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    college: '',
    aboutYou: '',
    oneLiner: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [examInput, setExamInput] = useState('');
  const [exams, setExams] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
const handleExamKeyPress = (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && examInput.trim()) {
    e.preventDefault();
    setExams([...exams, examInput.trim()]);
    setExamInput('');
  }
};
  const removeExam = (index) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    console.log('Profile updated:', { ...formData, exams });
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Profile Picture */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex justify-end mb-4">
            <button className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          
          {/* Profile Picture Section - Centered */}
          <div className="flex flex-col items-center">
            <label htmlFor="profile-upload" className="cursor-pointer">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover hover:opacity-90 transition-opacity"
                />
              ) : (
                <img 
                  src="https://via.placeholder.com/150/6366f1/ffffff?text=Mentor" 
                  alt="Default Profile" 
                  className="w-32 h-32 rounded-full object-cover hover:opacity-90 transition-opacity"
                />
              )}
            </label>
            <input 
              id="profile-upload" 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {/* Course */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your course"
            />
          </div>

          {/* College */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College
            </label>
            <select
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Drop down</option>
              <option value="MIT">MIT</option>
              <option value="Stanford">Stanford</option>
              <option value="Harvard">Harvard</option>
              <option value="IIT Delhi">IIT Delhi</option>
              <option value="IIT Bombay">IIT Bombay</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Exam Clearing with Bubbles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Clearing
            </label>
            <input
              type="text"
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              onKeyPress={handleExamKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type exam name and press Enter"
            />
            {/* Exam Bubbles */}
            {exams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {exams.map((exam, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    <span>{exam}</span>
                    <button
                      onClick={() => removeExam(index)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About You */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About You
            </label>
            <textarea
              name="aboutYou"
              value={formData.aboutYou}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* One-Liner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              One-Liner
            </label>
            <input
              type="text"
              name="oneLiner"
              value={formData.oneLiner}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., AIR 150 in CUET"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}