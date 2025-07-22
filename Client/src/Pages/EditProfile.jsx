import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bounce, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUser } from '../context/UserContext'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const EditProfile = () => {
  const { user, setUser } = useUser();
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    course: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        college: user.college || '',
        course: user.course || ''
      });
      setPreview(user.imageUrl || user.image || fallbackProfilePic);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

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
    formData.append('college', form.college);
    formData.append('course', form.course);
    if (profilePic) {
      formData.append('image', profilePic);
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user || {};
        setForm({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          college: updatedUser.college || '',
          course: updatedUser.course || ''
        });
        setPreview(updatedUser.image || fallbackProfilePic);
        setProfilePic(null);
        setUser(updatedUser); // Update context
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
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
        navigate('/');
        toast.success('Logged out successfully');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="relative max-w-md mx-auto my-8 p-8 shadow-3d rounded-xl bg-primary">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-3 py-1 rounded-md bg-red-500 text-white font-semibold hover:bg-red-700 transition cursor-pointer"
      >
        Logout
      </button>
      <h2 className="text-2xl font-bold text-center mb-8">My Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center">
          <label htmlFor="profile-pic" className="cursor-pointer group">
            <img
              src={preview || fallbackProfilePic}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-gray-200 group-hover:border-blue-400 transition"
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
          College Name
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={handleChange}
            required
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
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <div className="flex gap-4 justify-center mt-4">
          <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer">Submit</button>
          <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer">Cancel</button>
        </div>
      </form>
    </main>
  );
}

export default EditProfile
