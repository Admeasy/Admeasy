import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bounce, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUser } from '../context/UserContext'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
    gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !hasInitialized) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        institute: user.institute || '',
        course: user.course || '',
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
    if (localStorage.getItem('profileUpdated') === 'true') {
      toast.success('Profile updated successfully');
      localStorage.removeItem('profileUpdated');
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('phone', form.phone)
    formData.append('institute', form.institute);
    formData.append('course', form.course);
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
        console.log('Server response:', data);
        const updatedUser = data.user || {};
        setForm({
          name: updatedUser.name || form.name,
          email: updatedUser.email || form.email,
          phone: updatedUser.phone || form.phone,
          institute: updatedUser.institute || form.institute,
          course: updatedUser.course || form.course,
          gender: updatedUser.gender || form.gender
        });
        setPreview(updatedUser.image || fallbackProfilePic);
        setProfilePic(null);
        // Don't update user context here to prevent form reset
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
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

  return (
    <main className="relative max-w-md mx-auto my-8 p-8 shadow-3d rounded-xl bg-primary">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-3 py-1 rounded-md bg-red-500 text-white font-semibold hover:bg-red-700 transition cursor-pointer"
      >
        Logout
      </button>
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Phone Number
          <input
            type="tel"
            name="phone"
            value={form.phone}
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
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Course Name
          <input
            type="text"
            name="course"
            value={form.course}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <div className="flex gap-4 justify-center mt-4">
          <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer disabled:bg-gray-700" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer">Cancel</button>
        </div>
      </form>
    </main>
  );
}

export default EditProfile
