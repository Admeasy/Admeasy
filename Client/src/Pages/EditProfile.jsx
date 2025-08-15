import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaInfoCircle } from "react-icons/fa";
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUser } from '../context/UserContext'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// Utility function to check if user profile is complete
function isProfileComplete(user) {
  if (!user) return false;
  // List all required fields
  const requiredFields = ['name', 'email', 'phone', 'institute', 'course', 'gender'];
  // For 11th/12th and above, streamOrYear is also required
  const needsStreamOrYear = user.course && user.course !== 'Class 9th' && user.course !== 'Class 10th';
  for (let field of requiredFields) {
    if (!user[field] || user[field] === '') return false;
  }
  if (needsStreamOrYear) {
    // Check if course has (streamOrYear) part
    if (!user.course.includes('(')) return false;
    const streamOrYear = user.course.split('(')[1]?.replace(')', '').trim();
    if (!streamOrYear) return false;
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
    gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if any value in the form is an empty string
    const anyEmpty = Object.values(form).some(val => val === "");
    setIsEmpty(anyEmpty);
  }, [form]);

  useEffect(() => {
    setIsSubmitted(isProfileComplete(user));
  }, [user]);

  useEffect(() => {
    if (user && !hasInitialized) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        institute: user.institute || '',
        course: user.course ? user.course.split(' (')[0] : '',
        streamOrYear: user.course && user.course.includes('(') ? user.course.split('(')[1].replace(')', '') : '',
        gender: user.gender || ''
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
    // Validation: all required fields
    if (!form.name || !form.phone || !form.institute || !form.course || !form.gender || ((form.course !== 'Class 9th' && form.course !== 'Class 10th') && !form.streamOrYear)) {
      toast.error('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('phone', form.phone)
    formData.append('institute', form.institute);
    // Combine course and streamOrYear if both are present
    let courseValue = form.course;
    if (form.course !== 'Class 9th' && form.course !== 'Class 10th' && form.streamOrYear) {
      courseValue = `${form.course} (${form.streamOrYear})`;
    }
        // mobile Function
      if(form.phone.length<10 || form.phone.startsWith("1"|"2"|"3"|"4"|"5")){
      toast.error("Not cool")
      return;
    }
    formData.append('course', courseValue);
    formData.append('gender', form.gender);
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
          gender: updatedUser.gender || form.gender
        });
        setPreview(updatedUser.image || fallbackProfilePic);
        setProfilePic(null);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
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
  const teleValidate = ''
  return (
    <main className="relative max-w-md mx-auto my-8 p-8 shadow-3d rounded-xl bg-primary">
      {/* (Mentos Jindagi) Logout Button */}
      <div className='flex w-full justify-end'> 
       <button
      className="
        group flex items-center justify-start 
        w-[45px] h-[45px] 
        border-none rounded-full cursor-pointer relative overflow-hidden 
        shadow-[2px_2px_10px_rgba(0,0,0,0.199)]
        bg-red-500 transition-all duration-300 
        active:translate-x-[2px] active:translate-y-[2px]
        hover:w-[125px] hover:rounded-[40px]"
        onClick={handleLogout}
    >
      {/* Sign (Icon) */}
      <div
        className="
          w-full flex items-center justify-center transition-all duration-300 
          group-hover:w-[30%] group-hover:pl-5
        "
      >
        <svg viewBox="0 0 512 512" className="w-[17px]">
          <path
            fill="white"
            d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
          ></path>
        </svg>
      </div>

      {/* Text */}
      <div
        className="
          absolute right-0 w-0 opacity-0 text-white 
          text-[1.2em] font-semibold transition-all duration-300 
          group-hover:opacity-100 group-hover:w-[70%] group-hover:pr-[10px]
        "
      >
        Logout
      </div>
    </button>
    </div>
      <h2 className="text-3xl font-bold text-center mb-8">My Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center">
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Gender
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Rather not to say">Rather not to say</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
          />
        </label>
        {/* Phone Number */}
        <label className="flex flex-col gap-1 text-sm font-medium">
          {"Phone Number (+91)"}
          <input
            type="tel"
            name="phone"
            value={form.phone}
            required
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Institute/School Name
          <input
            type="text"
            name="institute"
            value={form.institute}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Course
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        {form.course && form.course !== 'Class 9th' && form.course !== 'Class 10th' ? (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Stream/Course Name + Year
            <span className="w-fit text-xs sm:text-sm text-tsecondary font-medium sm:font-light flex items-start sm:items-center gap-1"><FaInfoCircle className='mt-0.5 sm:mt-0' /> If you're in 11th/12th, enter your Stream only</span>
            <input
              type="text"
              name="streamOrYear"
              value={form.streamOrYear}
              onChange={handleChange}
              required
              disabled={form.course === 'Class 9th' || form.course === 'Class 10th' || form.course === ''}
              placeholder="E.g., B.Tech. in Mechanical Engg. 2nd year"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </label>
        ) : null}
        <div className="flex gap-4 justify-center mt-4">
          <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer disabled:bg-gray-700" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition cursor-pointer" disabled={isEmpty || isDirty || !isSubmitted} >Cancel</button>
        </div>
      </form>
    </main>
  );
}

export default EditProfile
