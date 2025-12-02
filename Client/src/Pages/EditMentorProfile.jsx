import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Upload, RotateCw, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useDropzone } from 'react-dropzone';
import { useMentor } from '../context/MentorContext';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/SearchableSelect';
import LoadingButton from '../components/LoadingButton';
import { useNavigate } from 'react-router-dom';
const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";



// Crop helper function
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export default function MentorsProfile() {
  const navigate = useNavigate()
  const { mentor, fetchMentor } = useMentor();
  const mentorData = useMemo(() => mentor, [mentor]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    course: { name: '', id: '' },
    college: { name: '', id: '' },
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

  // Image cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (300KB = 307200 bytes)
    if (file.size > 307200) {
      toast.error('Image size must be less than 300KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageSrc(reader.result);
      setCropModalOpen(true);
      setRotation(0);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    maxFiles: 1,
    multiple: false
  });

  const handleCropConfirm = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(30);

      const croppedBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels, rotation);
      
      setUploadProgress(60);

      // Check if cropped image is still under 300KB
      if (croppedBlob.size > 307200) {
        alert('Cropped image is still too large. Please zoom in more or choose a different image.');
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      setProfilePic(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setCropModalOpen(false);
        }, 500);
      };
      reader.readAsDataURL(croppedBlob);
    } catch (e) {
      console.error('Error cropping image:', e);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  useEffect(() => {
    if (mentorData) {
      const mentorCollege = mentorData.college;
      const normalizedCollege = typeof mentorCollege === 'object' && mentorCollege !== null
        ? { name: mentorCollege.name || '', id: mentorCollege.id || mentorCollege._id || '' }
        : { name: mentorCollege || '', id: '' };

      const mentorCourse = mentorData.course;
      const normalizedCourse = typeof mentorCourse === 'object' && mentorCourse !== null
        ? { name: mentorCourse.name || '', id: mentorCourse.id || mentorCourse._id || '' }
        : { name: mentorCourse || '', id: '' };

      setFormData({
        name: mentorData.name || '',
        username: mentorData.username || '',
        email: mentorData.email || '',
        course: normalizedCourse,
        college: normalizedCollege,
        aboutYou: mentorData.bio || '',
        oneLiner: mentorData.tagline || ''
      });

      if (mentorData.imageUrl) {
        setPreview(mentorData.imageUrl || fallbackProfilePic);
      } else {
        setPreview(fallbackProfilePic);
      }

      if (mentorData.competitiveExamsAttempted && Array.isArray(mentorData.competitiveExamsAttempted)) {
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

    setFormData(prev => ({ ...prev, [name]: value }));
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
  // Form Handler
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

      const response = await fetch(`/api/mentors/me/${mentorData._id}`, {
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
      navigate('/')
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={preview || fallbackProfilePic}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                onError={e => e.target.src = fallbackProfilePic}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center  bg-opacity-50 rounded-full">
                  <div className="text-white text-xs font-semibold">{uploadProgress}%</div>
                </div>
              )}
            </div>
            
            <div {...getRootProps()} className="mt-3 cursor-pointer">
              <input {...getInputProps()} />
              <div className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDragActive 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-400 border-dashed' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              }`}>
                <Upload className="inline-block mr-2 w-4 h-4" />
                {isDragActive ? 'Drop image here' : 'Upload Photo'}
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-2">Max 300KB • JPG, PNG, GIF</span>
          </div>

          {/* Form Fields */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Name"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md cursor-not-allowed"
              placeholder="Your Email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <SearchableSelect
              key={selectedCollege?._id || 'no-college'}
              name="course"
              value={formData.course?.name || ''}
              onChange={handleInputChange}
              options={selectedCollege?.courses || []}
              placeholder={selectedCollege ? "Search and select course" : "Select a college first"}
              
              getOptionLabel={(course) => course.title || course.name || ''}
              getOptionValue={(course) => course._id || course.id || ''}
            />
          </div>

          {/* Competitive Exams */}
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
                  <div key={index} className="flex gap-3 items-center p-3 border border-gray-300 rounded-md bg-white">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exam.name}
                        onChange={(e) => updateExam(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Exam name (e.g., JEE, NEET)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exam.rank}
                        onChange={(e) => updateExam(index, 'rank', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Rank (e.g., AIR 150)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExam(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
            <input
              type="text"
              name="oneLiner"
              value={formData.oneLiner}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., AIR 150 in CUET"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">About You</label>
            <textarea
              name="aboutYou"
              value={formData.aboutYou}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {
            isSubmitting ? <LoadingButton text={'Submitting'} variant={'blue'} /> :
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={` w-full py-3 px-4 rounded-md font-semibold text-white flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 active:scale-[0.97]
  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600`}>
                Submit
              </button>
          }

        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-2xl flex items-center justify-center z-[1001] p-4 transition-all duration-300">
          {/* Allowing z-index more than navbar is not allowed, employees shall only use it on this pop-up  */}
          <div className="bg-white rounded-lg w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Crop Profile Picture</h3>
              <button
                onClick={() => setCropModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative h-96 bg-gray-100">
              <Cropper
                image={tempImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRotate}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md font-medium flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} />
                  Rotate 90°
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>Processing {uploadProgress}%</>
                  ) : (
                    <>
                      <Check size={18} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}