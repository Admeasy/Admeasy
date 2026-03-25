import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaInfoCircle } from "react-icons/fa";
import { X, Upload, RotateCw, Check, GraduationCap } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext'
import LoadingButton from '../components/LoadingButton';

// Exams list (same as onboarding)
const examsList = [
  "CUET",
  "JEE",
  "NEET UG",
  "CLAT",
  "UPSC",
  "IPMAT",
  "CAT",
  "CA FOUNDATION",
  "CA INTERMEDIATE",
  "CA FINAL",
  "CFA L1",
  "CFA L2",
  "CFA L3",
  "PAT",
  "AILET",
  "SLAT",
  "NPAT",
  "SET",
  "CUET (Christ University)",
  "St. Xavier Entrance Test",
  "AIIMS NURSING",
  "ICAR AIEEA",
  "NEET PG",
  "GATE",
  "SAT (abroad)",
  "ACT (abroad)",
  "CEED (PG for Design)",
  "UCEED (UG for Design)",
  "CLAT PG",
  "LSAT - India",
  "MH CET",
  "STATE CIVIL SERVICES",
  "AMU BA LLB ENTRANCE",
  "CUET - PG",
  "AILET - PG",
  "XAT",
  "NMAT",
  "SNAP",
  "MAT",
  "CMAT",
  "ATMA",
  "GMAT",
  "TISS-NET",
  "MICAT",
  "UPSEE",
  "MAH-MCA MET",
  "NIMCET",
  "JAM",
  "JEST",
  "GATE (economics in IIT Delhi/IIT Bombay)",
  "CS (CSEET)",
  "CS Executive Exam (Module I & II)",
  "CS Professional Exam (Module I, II & III)",
  "ACCA",
  "CMA FOUNDATION",
  "CMA INTERMEDIATE",
  "CMA FINAL",
  "SSC",
  "FRM (Financial Risk Manager)",
  "CUET UG (Science)",
  "CUET UG (Maths)",
  "CUET UG (Commerce)",
  "CUET UG (Arts)",
  "CUET UG (Law)",
];

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

// Utility function to check if user profile is complete
function isProfileComplete(user) {
  if (!user) return false;
  // List all required fields
  const requiredFields = ['name', 'email', 'phone', 'institute', 'gender'];

  // Check basic required fields
  for (let field of requiredFields) {
    if (!user[field] || user[field] === '') return false;
  }

  // Check if course exists (either as course or courseLevel)
  const courseValue = user.course || user.courseLevel;
  if (!courseValue || courseValue === '') return false;

  // For 11th/12th and above, streamOrYear is also required
  const needsStreamOrYear = courseValue !== 'Class 9th' && courseValue !== 'Class 10th';

  if (needsStreamOrYear) {
    // Check if course has (streamOrYear) part OR courseDetails exists
    if (user.course && user.course.includes('(')) {
      const streamOrYear = user.course.split('(')[1]?.replace(')', '').trim();
      if (!streamOrYear) return false;
    } else if (user.courseDetails) {
      // Has courseDetails from onboarding
      return true;
    } else {
      return false;
    }
  }
  return true;
}

const EditProfile = () => {
  const { user, setUser, fetchUser } = useUser();
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  // Image cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    institute: '',
    course: '',
    streamOrYear: '',
    gender: '',
    // Onboarding fields
    languages: [],
    city: '',
    educationType: '',
    board: '',
    universityName: '',
    class: '',
    stream: '',
    schoolName: '',
    courseLevel: '',
    courseDetails: '',
    collegeName: '',
    examsPreparingFor: [],
    reasonForAdmeasy: '',
    reasonForAdmeasyInput: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [exams, setExams] = useState([]); // Array of strings for user exams
  const examSectionRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if any required value in the form is an empty string
    const requiredFields = ['name', 'phone', 'institute', 'course', 'gender'];
    const anyEmpty = requiredFields.some(field => !form[field] || form[field] === "");

    // Also check streamOrYear if applicable
    const needsStreamOrYear = form.course && form.course !== 'Class 9th' && form.course !== 'Class 10th';
    const streamOrYearEmpty = needsStreamOrYear && (!form.streamOrYear || form.streamOrYear === "");

    setIsEmpty(anyEmpty || streamOrYearEmpty);
  }, [form]);

  useEffect(() => {
    setIsSubmitted(isProfileComplete(user));
  }, [user]);

  useEffect(() => {
    if (user && !hasInitialized) {

      // Determine course and streamOrYear from multiple possible sources
      let courseValue = '';
      let streamOrYearValue = '';

      // Priority 1: Check if user.course exists and has the combined format
      if (user.course && user.course.includes('(')) {
        courseValue = user.course.split(' (')[0];
        streamOrYearValue = user.course.split('(')[1].replace(')', '');
      }
      // Priority 2: Check if user.course exists without combined format
      else if (user.course) {
        courseValue = user.course;
      }
      // Priority 3: Fall back to courseLevel from onboarding
      else if (user.courseLevel) {
        courseValue = user.courseLevel;
      }

      // For streamOrYear, check courseDetails from onboarding if not already set
      if (!streamOrYearValue && user.courseDetails) {
        streamOrYearValue = user.courseDetails;
      }

      // Determine institute from multiple sources
      const instituteValue = user.institute || user.schoolName || user.collegeName || '';

      setForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        institute: instituteValue,
        course: courseValue,
        streamOrYear: streamOrYearValue,
        gender: user.gender || '',
        // Onboarding fields
        languages: user.languages || [],
        city: user.city || '',
        educationType: user.educationType || '',
        board: user.board || '',
        universityName: user.universityName || '',
        class: user.class || '',
        stream: user.stream || '',
        schoolName: user.schoolName || '',
        courseLevel: user.courseLevel || '',
        courseDetails: user.courseDetails || '',
        collegeName: user.collegeName || '',
        examsPreparingFor: user.examsPreparingFor || [],
        reasonForAdmeasy: user.reasonForAdmeasy || '',
        reasonForAdmeasyInput: user.reasonForAdmeasyInput || ''
      });

      // Initialize exams array from user data
      setExams(user.examsPreparingFor && Array.isArray(user.examsPreparingFor)
        ? [...user.examsPreparingFor]
        : []);

      setPreview(user.imageUrl || user.image || fallbackProfilePic);
      setLoading(false);
      setHasInitialized(true);
    } else if (!user) {
      setLoading(false);
    }
  }, [user, hasInitialized]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem('blockNavigation');
      window.dispatchEvent(new Event('blockNavigationChange'));
    }
  }, [user]);

  useEffect(() => {
    if (isEmpty || isDirty || !isSubmitted) {
      localStorage.setItem('blockNavigation', 'true');
    } else {
      localStorage.removeItem('blockNavigation');
    }
    // Dispatch custom event
    window.dispatchEvent(new Event('blockNavigationChange'));
  }, [isEmpty, isDirty, isSubmitted]);

  useEffect(() => {
    if (localStorage.getItem('profileUpdated') === 'true') {
      toast.success('Profile updated successfully');
      localStorage.removeItem('profileUpdated');
    }
  }, []);

  // Real-time username availability check
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      const username = form.username?.trim();

      // Reset status if username is empty or same as current
      if (!username || username === user?.username) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

      // Validate username format (alphanumeric, underscore, hyphen, period, 3-30 chars)
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'Username must be 3-30 characters and contain only letters, numbers, underscores, hyphens, or periods'
        });
        return;
      }

      setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

      try {
        const res = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
        const data = await res.json();

        if (data.success) {
          setUsernameStatus({
            checking: false,
            available: data.available,
            message: data.available ? 'Username is available ✓' : 'Username is already taken'
          });
        } else {
          setUsernameStatus({ checking: false, available: false, message: 'Error checking username' });
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameStatus({ checking: false, available: false, message: 'Error checking username' });
      }
    };

    const debounceTimer = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [form.username, user?.username]);

  // Onchange
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

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
        toast.error('Cropped image is still too large. Please zoom in more or choose a different image.');
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
          setIsDirty(true);
        }, 500);
      };
      reader.readAsDataURL(croppedBlob);
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error('Error processing image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    // Validation: all required fields
    if (!form.name.trim() || !form.phone.toString().trim() || !form.institute || !form.course || !form.gender || ((form.course !== 'Class 9th' && form.course !== 'Class 10th') && !form.streamOrYear)) {
      toast.error('Please fill all required fields.');
      return;
    }

    // Validate username if it's changed
    if (form.username && form.username !== user?.username) {
      if (usernameStatus.checking) {
        toast.error('Please wait while we check username availability');
        return;
      }
      if (usernameStatus.available === false) {
        toast.error('Please choose a different username');
        return;
      }
      if (usernameStatus.available === null && form.username.trim() !== '') {
        toast.error('Please wait for username validation to complete');
        return;
      }
    }

    // mobile Function
    if (
      String(form.phone).trim().length < 10 ||
      ["1", "2", "3", "4", "5"].some((digit) =>
        String(form.phone).trim().startsWith(digit)
      )
    ) {
      toast.error("Mobile Number Is Invalid");
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    if (form.username) formData.append('username', form.username);
    formData.append('phone', form.phone);
    formData.append('gender', form.gender);
    formData.append('institute', form.institute);

    // Combine course and streamOrYear if both are present
    let courseValue = form.course;
    if (form.course !== 'Class 9th' && form.course !== 'Class 10th' && form.streamOrYear) {
      courseValue = `${form.course} (${form.streamOrYear})`;
    }
    // mobile Function
    if (
      form.phone.toString().trim().length < 10 ||
      ["1", "2", "3", "4", "5"].some((digit) =>
        form.phone.toString().trim().startsWith(digit)
      )
    ) {
      toast.error("Mobile Number Is Invalid");
      return;
    }

    formData.append('course', courseValue);


    // Onboarding fields
    if (form.languages && Array.isArray(form.languages)) {
      formData.append('languages', JSON.stringify(form.languages));
    }
    if (form.city) formData.append('city', form.city);
    if (form.educationType) formData.append('educationType', form.educationType);
    if (form.board) formData.append('board', form.board);
    if (form.universityName) formData.append('universityName', form.universityName);
    if (form.class) formData.append('class', form.class);
    if (form.stream) formData.append('stream', form.stream);
    if (form.schoolName) formData.append('schoolName', form.schoolName);
    if (form.courseLevel) formData.append('courseLevel', form.courseLevel);
    if (form.courseDetails) formData.append('courseDetails', form.courseDetails);
    if (form.collegeName) formData.append('collegeName', form.collegeName);
    // Update examsPreparingFor from exams state
    if (exams.length > 0) {
      const validExams = exams.filter(exam => exam && exam.trim());
      if (validExams.length > 0) {
        formData.append('examsPreparingFor', JSON.stringify(validExams));
      }
    } else {
      formData.append('examsPreparingFor', JSON.stringify([]));
    }
    if (form.reasonForAdmeasy) formData.append('reasonForAdmeasy', form.reasonForAdmeasy);
    if (form.reasonForAdmeasyInput) formData.append('reasonForAdmeasyInput', form.reasonForAdmeasyInput);

    if (profilePic) {
      formData.append('image', profilePic);
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user || {};


        // Parse course and streamOrYear for form state
        let course = updatedUser.course || '';
        let streamOrYear = '';
        if (course.includes('(')) {
          streamOrYear = course.split('(')[1].replace(')', '');
          course = course.split(' (')[0];
        }

        setForm({
          name: updatedUser.name || form.name,
          username: updatedUser.username || form.username,
          email: updatedUser.email || form.email,
          phone: updatedUser.phone || form.phone,
          institute: updatedUser.institute || form.institute,
          course: course || form.course,
          streamOrYear: streamOrYear || form.streamOrYear,
          gender: updatedUser.gender || form.gender,
          // Update onboarding fields
          languages: updatedUser.languages || form.languages,
          city: updatedUser.city || form.city,
          educationType: updatedUser.educationType || form.educationType,
          board: updatedUser.board || form.board,
          universityName: updatedUser.universityName || form.universityName,
          class: updatedUser.class || form.class,
          stream: updatedUser.stream || form.stream,
          schoolName: updatedUser.schoolName || form.schoolName,
          courseLevel: updatedUser.courseLevel || form.courseLevel,
          courseDetails: updatedUser.courseDetails || form.courseDetails,
          collegeName: updatedUser.collegeName || form.collegeName,
          examsPreparingFor: updatedUser.examsPreparingFor || form.examsPreparingFor,
          reasonForAdmeasy: updatedUser.reasonForAdmeasy || form.reasonForAdmeasy,
          reasonForAdmeasyInput: updatedUser.reasonForAdmeasyInput || form.reasonForAdmeasyInput
        });

        // Sync exams state with updated user data
        setExams(updatedUser.examsPreparingFor && Array.isArray(updatedUser.examsPreparingFor)
          ? [...updatedUser.examsPreparingFor]
          : []);

        setPreview(updatedUser.image || fallbackProfilePic);
        setProfilePic(null);

        // Update the user context
        await fetchUser();

        toast.success('Profile updated successfully');
        navigate('/');
      } else {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setIsEmpty(false);
      setIsDirty(false);
      setIsSubmitted(true);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };



  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Auto-focus exam section when navigating with ?focus=exams
  useEffect(() => {
    if (searchParams.get('focus') === 'exams' && examSectionRef.current) {
      setTimeout(() => {
        examSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove the query param after scrolling
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('focus');
        navigate({ search: newSearchParams.toString() }, { replace: true });
      }, 300);
    }
  }, [searchParams, navigate]);

  // Exam management functions
  const addExam = () => {
    setExams([...exams, '']);
    setIsDirty(true);
  };

  const updateExam = (index, value) => {
    const updatedExams = exams.map((exam, i) => {
      if (i === index) {
        return value;
      }
      return exam;
    });
    setExams(updatedExams);
    setIsDirty(true);
  };

  const removeExam = (index) => {
    setExams(exams.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  if (loading) {
    return (
      <main className="
        relative max-w-md mx-auto my-10 p-6 md:p-8 
        bg-white rounded-xl border border-gray-200
      ">
        {/* Title Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="flex flex-col gap-6">
          {/* Profile Image Skeleton */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-300/50 animate-pulse border-2 border-white/20" />
            <div className="h-8 w-32 bg-gray-300/50 rounded-lg animate-pulse" />
          </div>

          {/* Form Fields Skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-gray-300/50 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-300/50 rounded-lg animate-pulse shadow-sm" />
            </div>
          ))}

          {/* Button Skeleton */}
          <div className="mt-4 h-12 w-full bg-[#9f3562]/30 rounded-xl animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="
  relative max-w-md mx-auto my-10 p-6 md:p-8 
  bg-white rounded-xl border border-gray-200
">

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          My Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* PROFILE IMAGE */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={preview || fallbackProfilePic}
                alt="Profile Preview"
                className="
            w-24 h-24 rounded-full object-cover mb-2 border border-gray-200 
          "
                onError={e => e.target.src = fallbackProfilePic}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full mb-2">
                  <div className="text-white text-xs font-semibold">{uploadProgress}%</div>
                </div>
              )}
            </div>

            <div {...getRootProps()} className="mt-2 cursor-pointer">
              <input {...getInputProps()} />
              <div className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isDragActive
                ? 'bg-gray-50 text-gray-700 border-2 border-gray-300 border-dashed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-none'
                }`}>
                <Upload className="inline-block mr-2 w-4 h-4" />
                {isDragActive ? 'Drop image here' : 'Upload Photo'}
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-2">Max 300KB • JPG, PNG, GIF</span>
          </div>

          {/* FORM INPUTS */}
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-300 
          bg-white text-sm
          focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
          transition-colors
        "
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className={`
          w-full px-3 py-2.5 rounded-md border text-sm
          bg-white
          focus:outline-none focus:ring-1 transition-colors
          ${usernameStatus.available === false
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : usernameStatus.available === true
                    ? 'border-green-400 focus:ring-green-400 focus:border-green-400'
                    : 'border-gray-300 focus:ring-gray-400 focus:border-gray-400'
                }
        `}
              placeholder="Choose a username"
            />
            {form.username && (
              <span className={`text-xs mt-1 ${usernameStatus.available === true ? 'text-green-600' :
                usernameStatus.available === false ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                {usernameStatus.checking ? 'Checking...' : usernameStatus.message || ''}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Gender
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-300 
          bg-white text-sm
          focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
        "
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Rather not to say</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              disabled
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-200 
          bg-gray-50 text-gray-500 cursor-not-allowed text-sm
        "
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Phone Number (+91)
            <input
              type="tel"
              name="phone"
              value={form.phone}
              required
              onChange={handleChange}
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-300 
          bg-white text-sm
          focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
        "
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Institute / School
            <input
              type="text"
              name="institute"
              value={form.institute}
              required
              onChange={handleChange}
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-300 
          bg-white text-sm
          focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
        "
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Course
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
              required
              className="
          w-full px-3 py-2.5 rounded-md border border-gray-300 
          bg-white text-sm
          focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
        "
            >
              <option value="">Select Course</option>
              <option value="Class 9th">Class 9th</option>
              <option value="Class 10th">Class 10th</option>
              <option value="Class 11th">Class 11th</option>
              <option value="Class 12th">Class 12th</option>
              <option value="Diploma">Diploma</option>
              <option value="Post Diploma">Post Diploma</option>
              <option value="Graduation">Graduation</option>
              <option value="Post Graduation">Post Graduation</option>
              <option value="Doctorate">Doctorate</option>
            </select>
          </label>

          {form.course && form.course !== 'Class 9th' && form.course !== 'Class 10th' && (
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Stream / Course Name + Year
              <input
                type="text"
                name="streamOrYear"
                value={form.streamOrYear}
                onChange={handleChange}
                required
                placeholder="E.g., B.Tech Mechanical — 2nd Year"
                className="
            w-full px-3 py-2.5 rounded-md border border-gray-300 
            bg-white text-sm
            focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
          "
              />
            </label>
          )}

          {/* Exams Section */}
          <div ref={examSectionRef} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#9f3562]" />
                Exams Preparing For
              </label>
              <button
                type="button"
                onClick={addExam}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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
                  <div key={index} className="flex gap-3 items-center p-3 border border-gray-300 rounded-lg bg-white/90">
                    <div className="flex-1">
                      <select
                        value={exam}
                        onChange={(e) => updateExam(index, e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white"
                      >
                        <option value="">Select an exam</option>
                        {examsList.map((examName) => (
                          <option key={examName} value={examName}>
                            {examName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExam(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      aria-label="Remove exam"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 justify-center mt-6">

            {isSubmitting ? <LoadingButton text={'Saving'} variant={'blue'} /> :
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white font-medium rounded-md bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                disabled={isSubmitting || isEmpty}>
                Save
              </button>
            }

            <button
              type="button"
              onClick={handleCancel}
              className="
          px-6 py-2.5 rounded-md border border-gray-300 bg-white 
          text-gray-700 font-medium
          hover:bg-gray-50 transition-colors
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        "
              disabled={!isDirty}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-2xl flex items-center justify-center z-[1001] p-4 transition-all duration-300">
          {/* Allowing z-index more than navbar is not allowed, employees shall only use it on this pop-up  */}
          <div className="bg-white rounded-lg w-full max-w-md">
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
                  type="button"
                  onClick={handleRotate}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md font-medium flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} />
                  Rotate 90°
                </button>
                <button
                  type="button"
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
    </>

  );
}

export default EditProfile