import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMentor } from '../context/MentorContext';
import { toast } from 'react-toastify';
import { Upload, X, FileText, ArrowLeft } from 'lucide-react';

const AddNote = () => {
  const navigate = useNavigate();
  const { mentor, isLoading } = useMentor();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    standard: '',
    pages: '',
    isFree: true,
    price: '',
    university: '',
    programme: '',
    course: '',
    tags: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not a mentor or not authenticated
  useEffect(() => {
    if (!isLoading && !mentor) {
      navigate('/mentors-login');
      return;
    }
  }, [mentor, isLoading, navigate]);

  // University options
  const universities = [
    { id: 'du', label: 'Delhi University' },
    { id: 'mu', label: 'Mumbai University' },
    { id: 'davu', label: 'Devi Ahilya Vishwavidyalaya' },
    { id: 'rgpv', label: 'RGPV Bhopal' },
    { id: 'iit', label: 'IIT (All Campuses)' },
    { id: 'iim', label: 'IIM (All Campuses)' },
    { id: 'lu', label: 'Lucknow University' },
    { id: 'manipal', label: 'Manipal University' },
    { id: 'sage', label: 'Sage University' },
    { id: 'medicaps', label: 'Medicaps University' },
    { id: 'oriental', label: 'Oriental University' },
    { id: 'pu', label: 'Panjab University' },
  ];

  const programmes = [
    { id: 'bachelors', label: 'Bachelors' },
    { id: 'masters', label: 'Masters' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed');
      setSelectedFile(null);
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'standard', 'university', 'programme', 'course'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Add file
      submitData.append('noteFile', selectedFile);

      const response = await fetch('/api/notes', {
        method: 'POST',
        credentials: 'include',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Note uploaded successfully! It will be reviewed by admin before publishing.');
        navigate('/notes');
      } else {
        throw new Error(data.message || 'Failed to upload note');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload note. Please try again.');
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

  if (!mentor) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/notes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Notes
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Notes</h1>
          <p className="text-gray-600 mb-6">Share your knowledge by uploading study notes for students</p>

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
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
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
                    <p className="text-gray-600 mb-2">Drag and drop your PDF file here, or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">Maximum file size: 10MB</p>
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
                  placeholder="e.g., CA Foundation, JEE Main"
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
                <span className="text-sm font-medium text-gray-700">Free to download</span>
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

            {/* University */}
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

            {/* Programme and Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., B.Com, B.Tech CSE"
                  required
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., accounting, ca, foundation (comma separated)"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Notes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNote;
