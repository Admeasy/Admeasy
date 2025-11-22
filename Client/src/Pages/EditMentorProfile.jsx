import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useMentor } from '../context/MentorContext';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/SearchableSelect';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function MentorsProfile() {
  const { mentor, fetchMentor } = useMentor();

  // Memoize mentor data to prevent unnecessary re-renders
  const mentorData = useMemo(() => mentor, [mentor]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    course: {
      name: '',
      id: ''
    },
    college: {
      name: '',
      id: ''
    },
    aboutYou: '',
    oneLiner: ''
  });

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [exams, setExams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch mentor data on component mount
  useEffect(() => {
    fetchMentor();
  }, [fetchMentor]);

  // Populate form when mentor data is available
  useEffect(() => {
    if (mentorData) {
      const mentorCollege = mentorData.college;
      const normalizedCollege = typeof mentorCollege === 'object' && mentorCollege !== null
        ? {
            name: mentorCollege.name || '',
            id: mentorCollege.id || mentorCollege._id || ''
          }
        : {
            name: mentorCollege || '',
            id: ''
          };

      const mentorCourse = mentorData.course;
      const normalizedCourse = typeof mentorCourse === 'object' && mentorCourse !== null
        ? {
            name: mentorCourse.name || '',
            id: mentorCourse.id || mentorCourse._id || ''
          }
        : {
            name: mentorCourse || '',
            id: ''
          };

      setFormData({
        name: mentorData.name || '',
        username: mentorData.username || '',
        email: mentorData.email || '',
        course: normalizedCourse,
        college: normalizedCollege,
        aboutYou: mentorData.bio || '',
        oneLiner: mentorData.tagline || ''
      });

      // Set profile image if available
      if (mentorData.imageUrl) {
        setPreview(mentorData.imageUrl || fallbackProfilePic);
      } else {
        setPreview(fallbackProfilePic);
      }

      // Set exams if available
      if (mentorData.competitiveExamsAttempted && Array.isArray(mentorData.competitiveExamsAttempted)) {
        // Handle both object format {name, rank} and string format
        const examObjects = mentorData.competitiveExamsAttempted.map(exam => {
          if (typeof exam === 'string') {
            return { name: exam, rank: '' };
          }
          return { name: exam.name || '', rank: exam.rank || '' };
        });
        setExams(examObjects);
      }

    }
  }, [mentorData]);

  // Sync selected college once colleges list is available
  useEffect(() => {
    if (!mentorData || colleges.length === 0) return;
    if (!mentorData.college) {
      setSelectedCollege(null);
      return;
    }

    const mentorCollege = mentorData.college;
    const mentorCollegeId = typeof mentorCollege === 'object' && mentorCollege !== null
      ? mentorCollege.id || mentorCollege._id || ''
      : '';

    let matchedCollege = null;
    if (mentorCollegeId) {
      matchedCollege = colleges.find(col => String(col._id) === String(mentorCollegeId));
    }
    if (!matchedCollege) {
      const mentorCollegeName = typeof mentorCollege === 'object' && mentorCollege !== null
        ? mentorCollege.name
        : mentorCollege;
      matchedCollege = colleges.find(col => col.name === mentorCollegeName);
    }

    if (matchedCollege) {
      setSelectedCollege(matchedCollege);
      setFormData(prev => ({
        ...prev,
        college: {
          name: matchedCollege.name || prev.college.name || '',
          id: matchedCollege._id?.toString() || matchedCollege.id || prev.college.id || ''
        }
      }));
    }
  }, [mentorData, colleges]);

  // Sync selected course once selected college and courses are available
  useEffect(() => {
    if (!mentorData || !selectedCollege || !selectedCollege.courses || selectedCollege.courses.length === 0) {
      if (!selectedCollege) {
        setSelectedCourse(null);
      }
      return;
    }
    if (!mentorData.course) {
      setSelectedCourse(null);
      return;
    }

    const mentorCourse = mentorData.course;
    const mentorCourseId = typeof mentorCourse === 'object' && mentorCourse !== null
      ? mentorCourse.id || mentorCourse._id || ''
      : '';

    let matchedCourse = null;
    if (mentorCourseId) {
      matchedCourse = selectedCollege.courses.find(course => String(course._id) === String(mentorCourseId));
    }
    if (!matchedCourse) {
      const mentorCourseName = typeof mentorCourse === 'object' && mentorCourse !== null
        ? mentorCourse.name || mentorCourse.title
        : mentorCourse;
      matchedCourse = selectedCollege.courses.find(course =>
        course.title === mentorCourseName || course.name === mentorCourseName
      );
    }

    if (matchedCourse) {
      setSelectedCourse(matchedCourse);
      setFormData(prev => ({
        ...prev,
        course: {
          name: matchedCourse.title || matchedCourse.name || prev.course.name || '',
          id: matchedCourse._id?.toString() || matchedCourse.id || prev.course.id || ''
        }
      }));
    }
  }, [mentorData, selectedCollege]);

  //Fetch and store list of colleges
  useEffect(() => {
    const fetchColleges = async () => {
      const response = await fetch('/api/colleges');
      const data = await response.json();
      // Handle both array response and object with colleges property
      const collegesList = Array.isArray(data) ? data : (data.colleges || []);
      setColleges(collegesList);
    }
    fetchColleges();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'college') {
      const matchedCollege = colleges.find(col => col.name === value);
      setSelectedCollege(matchedCollege || null);
      setFormData(prev => ({
        ...prev,
        college: {
          name: value,
          id: matchedCollege?._id?.toString() || matchedCollege?.id || ''
        },
        course: matchedCollege ? { name: '', id: '' } : prev.course
      }));
      setSelectedCourse(null);
      return;
    }

    if (name === 'course') {
      const matchedCourse = selectedCollege?.courses?.find(course =>
        course.title === value || course.name === value
      );
      setSelectedCourse(matchedCourse || null);
      setFormData(prev => ({
        ...prev,
        course: {
          name: matchedCourse?.title || value,
          id: matchedCourse?._id?.toString() || matchedCourse?.id || ''
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const addExam = () => {
    setExams([...exams, { name: '', rank: '' }]);
  };

  const updateExam = (index, field, value) => {
    const updatedExams = exams.map((exam, i) => {
      if (i === index) {
        return { ...exam, [field]: value };
      }
      return exam;
    });
    setExams(updatedExams);
  };

  const removeExam = (index) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = new FormData();

      payload.append('name', formData.name);
      payload.append('username', formData.username);

      const collegePayload = formData.college?.name
        ? {
            name: formData.college.name,
            id: formData.college.id || selectedCollege?._id?.toString() || selectedCollege?.id || ''
          }
        : null;

      if (collegePayload) {
        payload.append('college', JSON.stringify(collegePayload));
      } else {
        payload.append('college', '');
      }

      const coursePayload = formData.course?.name
        ? {
            name: formData.course.name,
            id: formData.course.id || selectedCourse?._id?.toString() || selectedCourse?.id || ''
          }
        : null;

      if (coursePayload) {
        payload.append('course', JSON.stringify(coursePayload));
      } else {
        payload.append('course', '');
      }
      payload.append('bio', formData.aboutYou);
      payload.append('tagline', formData.oneLiner);

      if (exams.length) {
        // Filter out exams with empty names and format as objects
        const validExams = exams
          .filter(exam => exam.name && exam.name.trim())
          .map(exam => ({
            name: exam.name.trim(),
            rank: exam.rank ? exam.rank.trim() : ''
          }));
        if (validExams.length > 0) {
          payload.append('competitiveExamsAttempted', JSON.stringify(validExams));
        }
      }

      if (profilePic) {
        payload.append('image', profilePic);
      }

      const response = await fetch(`/api/mentors/me/${mentorData.username}`, {
        method: 'PUT',
        credentials: 'include',
        body: payload
      });

      let data = null;
      try {
        data = await response.json();
      } catch (err) {
        // ignore json parse errors
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update profile. Please try again.');
      }

      await fetchMentor();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update mentor profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Profile Picture */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">

          {/* Profile Picture Section - Centered */}
          <div className="flex flex-col items-center mb-6">
            <label htmlFor="profile-pic" className="cursor-pointer group">
              <img
                src={preview || fallbackProfilePic}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-gray-200 group-hover:border-blue-400 transition"
                onError={e => e.target.src = fallbackProfilePic}
              />
            </label>
            <input
              id="profile-pic"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePicChange}
            />
            <span className="text-xs text-gray-500">Click image to change</span>
          </div>

          {/* Form */}
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
              placeholder="Your Name"
            />
          </div>

          {/* Username */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Username"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
              placeholder="Your Email"
            />
          </div>

          {/* College */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College
            </label>
            <SearchableSelect
              name="college"
            value={formData.college?.name || ''}
              onChange={handleInputChange}
              options={colleges}
              placeholder="Search and select college"
              getOptionLabel={(college) => college.name || ''}
              getOptionValue={(college) => college.id || ''}
            />
          </div>

          {/* Course */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <SearchableSelect
              key={selectedCollege?._id || 'no-college'}
              name="course"
              value={formData.course?.name || ''}
              onChange={handleInputChange}
              options={selectedCollege?.courses || []}
              placeholder={selectedCollege ? "Search and select course" : "Select a college first"}
              disabled={!selectedCollege}
              getOptionLabel={(course) => course.title || course.name || ''}
              getOptionValue={(course) => course._id || course.id || ''}
            />
          </div>

          {/* Competitive Exams Attempted */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Competitive Exams Attempted
              </label>
              <button
                type="button"
                onClick={addExam}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Exam
              </button>
            </div>
            {exams.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center border border-gray-200 rounded-md bg-gray-50">
                No exams added yet. Click "Add Exam" to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-center p-3 border border-gray-300 rounded-md bg-white"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exam.name}
                        onChange={(e) => updateExam(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Exam name (e.g., JEE, NEET, CUET)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exam.rank}
                        onChange={(e) => updateExam(index, 'rank', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Rank achieved (e.g., AIR 150)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExam(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove exam"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* One-Liner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
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

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}