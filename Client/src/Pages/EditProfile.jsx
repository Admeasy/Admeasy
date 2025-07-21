import React, { useState } from 'react'

const EditProfile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    course: ''
  });

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
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic here
  };

  const handleCancel = () => {
    // Cancel logic here (e.g., reset form or navigate away)
  };

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', padding: '2rem', boxShadow: '0 2px 8px #eee', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>My Profile</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label htmlFor="profile-pic" style={{ cursor: 'pointer' }}>
            <img
              src={preview || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
              alt="Profile Preview"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
            />
          </label>
          <input
            id="profile-pic"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePicChange}
          />
          <span style={{ fontSize: 12, color: '#888' }}>Click image to change</span>
        </div>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4, background: '#f5f5f5' }}
          />
        </label>
        <label>
          College Name
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
          />
        </label>
        <label>
          Course Name
          <input
            type="text"
            name="course"
            value={form.course}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
          />
        </label>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button type="submit" style={{ padding: '0.6rem 1.5rem', borderRadius: 4, border: 'none', background: '#007bff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
          <button type="button" onClick={handleCancel} style={{ padding: '0.6rem 1.5rem', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </form>
    </main>
  );
}

export default EditProfile
