import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaInfoCircle } from "react-icons/fa";
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
  const [form, setForm] = useState({
    name: '',
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
  const navigate = useNavigate();

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
      console.log('Initializing form with user data:', user);
      
      // Determine course and streamOrYear from multiple possible sources
      let courseValue = '';
      let streamOrYearValue = '';
      
      // Priority 1: Check if user.course exists and has the combined format
      if (user.course && user.course.includes('(')) {
        courseValue = user.course.split(' (')[0];
        streamOrYearValue = user.course.split('(')[1].replace(')', '');
        console.log('Using combined course format:', { courseValue, streamOrYearValue });
      } 
      // Priority 2: Check if user.course exists without combined format
      else if (user.course) {
        courseValue = user.course;
        console.log('Using simple course format:', courseValue);
      }
      // Priority 3: Fall back to courseLevel from onboarding
      else if (user.courseLevel) {
        courseValue = user.courseLevel;
        console.log('Using courseLevel from onboarding:', courseValue);
      }
      
      // For streamOrYear, check courseDetails from onboarding if not already set
      if (!streamOrYearValue && user.courseDetails) {
        streamOrYearValue = user.courseDetails;
        console.log('Using courseDetails for streamOrYear:', streamOrYearValue);
      }
      
      // Determine institute from multiple sources
      const instituteValue = user.institute || user.schoolName || user.collegeName || '';
      console.log('Institute value:', instituteValue);
      
      setForm({
        name: user.name || '',
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
      
      console.log('Form initialized with:', {
        course: courseValue,
        streamOrYear: streamOrYearValue,
        institute: instituteValue
      });
      
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

  // Onchange
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submitting form with:', form);
    
    // Validation: all required fields
    if (!form.name.trim() || !form.phone.toString().trim() || !form.institute || !form.course || !form.gender || ((form.course !== 'Class 9th' && form.course !== 'Class 10th') && !form.streamOrYear)) {
      toast.error('Please fill all required fields.');
      return;
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
    
    console.log('Sending course value:', courseValue);
  
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
    if (form.examsPreparingFor && Array.isArray(form.examsPreparingFor)) {
      formData.append('examsPreparingFor', JSON.stringify(form.examsPreparingFor));
    }
    if (form.reasonForAdmeasy) formData.append('reasonForAdmeasy', form.reasonForAdmeasy);
    if (form.reasonForAdmeasyInput) formData.append('reasonForAdmeasyInput', form.reasonForAdmeasyInput);
    
    if (profilePic) {
      formData.append('image', profilePic);
    }
    
    setLoading(true);
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
        
        console.log('Updated user from API:', updatedUser);
        
        // Parse course and streamOrYear for form state
        let course = updatedUser.course || '';
        let streamOrYear = '';
        if (course.includes('(')) {
          streamOrYear = course.split('(')[1].replace(')', '');
          course = course.split(' (')[0];
        }
        
        setForm({
          name: updatedUser.name || form.name,
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

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setUser(null);
        // Clear any localStorage items
        localStorage.clear();
        // Force a page reload to clear any cached state
        toast.success('Logged out successfully');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Failed to logout');
    }
  };

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (loading) {
    return (
      <main className="relative max-w-md mx-auto my-8 p-8 shadow-3d rounded-xl bg-primary">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  return (
   <main className="
  relative max-w-md mx-auto my-10 p-8 
  bg-primary rounded-2xl shadow-3d 
  backdrop-blur-lg border border-white/20
">

  {/* Logout */}
  <div className="flex w-full justify-end mb-2">
    <button
      className="
        group flex items-center justify-start 
        w-[45px] h-[45px] 
        border-none rounded-full cursor-pointer relative overflow-hidden 
        shadow-[2px_2px_10px_rgba(0,0,0,0.15)]
        bg-red-500/90 transition-all duration-300 
        active:translate-x-[2px] active:translate-y-[2px]
        hover:w-[130px] hover:rounded-[40px]
      "
      onClick={handleLogout}
    >
      <div className="
        w-full flex items-center justify-center transition-all duration-300 
        group-hover:w-[30%] group-hover:pl-5
      ">
        <svg viewBox="0 0 512 512" className="w-[18px]">
          <path
            fill="white"
            d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
          ></path>
        </svg>
      </div>

      <div className="
        absolute right-0 w-0 opacity-0 text-white 
        text-[1.1em] font-semibold tracking-wide transition-all duration-300 
        group-hover:opacity-100 group-hover:w-[65%] group-hover:pr-[14px]
      ">
        Logout
      </div>
    </button>
  </div>

  {/* TITLE */}
  <h2 className="text-3xl font-admeasy-extrabold text-center mb-6 text-tprimary drop-shadow-sm">
    My Profile
  </h2>

  <form onSubmit={handleSubmit} className="flex flex-col gap-5">

    {/* PROFILE IMAGE */}
    <div className="flex flex-col items-center">
      <label htmlFor="profile-pic" className="cursor-pointer group">
        <img
          src={preview || fallbackProfilePic}
          alt="Profile Preview"
          className="
            w-24 h-24 rounded-full object-cover mb-2 border-2 border-gray-200 
            group-hover:border-tprimary transition
            shadow-md group-hover:shadow-lg duration-200
          "
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

      <span className="text-xs text-gray-600">
        Click image to change
      </span>
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
          w-full px-3 py-2 rounded-lg border border-gray-300 
          bg-white/90 shadow-sm
          focus:outline-none focus:ring-2 focus:ring-tprimary
          transition
        "
      />
    </label>

    <label className="flex flex-col gap-1 text-sm font-semibold">
      Gender
      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        required
        className="
          w-full px-3 py-2 rounded-lg border border-gray-300 
          bg-white/90 shadow-sm
          focus:outline-none focus:ring-2 focus:ring-tprimary
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
          w-full px-3 py-2 rounded-lg border border-gray-200 
          bg-gray-100 text-gray-400 cursor-not-allowed shadow-sm
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
          w-full px-3 py-2 rounded-lg border border-gray-300 
          bg-white/90 shadow-sm
          focus:outline-none focus:ring-2 focus:ring-tprimary
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
          w-full px-3 py-2 rounded-lg border border-gray-300 
          bg-white/90 shadow-sm
          focus:ring-2 focus:ring-tprimary
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
          w-full px-3 py-2 rounded-lg border border-gray-300 
          bg-white/90 shadow-sm
          focus:ring-2 focus:ring-tprimary
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
            w-full px-3 py-2 rounded-lg border border-gray-300 
            bg-white/90 shadow-sm
            focus:ring-2 focus:ring-tprimary
          "
        />
      </label>
    )}

    {/* BUTTONS */}
    <div className="flex gap-4 justify-center mt-6">
      <button
        type="submit"
        className="
          px-6 py-2 rounded-lg font-semibold text-white
          bg-gradient-to-r from-tprimary to-blue-600
          shadow-md hover:shadow-lg transition
          disabled:bg-gray-400 disabled:cursor-not-allowed
        "
        disabled={isSubmitting || isEmpty}
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>

      <button
        type="button"
        onClick={handleCancel}
        className="
          px-6 py-2 rounded-lg border border-gray-300 bg-white 
          text-gray-700 font-semibold shadow-sm 
          hover:bg-gray-100 transition
          disabled:bg-gray-100 disabled:cursor-not-allowed
        "
        disabled={!isDirty}
      >
        Cancel
      </button>
    </div>
  </form>
</main>

  );
}

export default EditProfile