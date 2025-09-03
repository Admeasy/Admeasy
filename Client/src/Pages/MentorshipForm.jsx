import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const MentorshipForm = () => {
    const [profilePic, setProfilePic] = useState(null);
    const [preview, setPreview] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePicChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            toast.error('Please upload an image file');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error('Please agree to the Terms and Conditions');
            return;
        }

        if (!profilePic) {
            toast.error('Please upload a profile image');
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone', form.phone);
        formData.append('college', form.college);
        formData.append('course', form.course);
        formData.append('image', profilePic);

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/apply/mentorship', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast.success('Application submitted successfully. We will contact you shortly.');
            } else {
                toast.error('An Error Occurred!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e);
        }

        setIsSubmitting(false);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <main className="relative max-w-lg mx-auto my-8 p-8 shadow-3d rounded-xl bg-primary">
            <h2 className="text-3xl font-bold text-center mb-8">Apply for Mentorship</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Image Upload Section */}
                <div className="flex flex-col gap-2 items-center">
                    <span className="text-sm font-medium mt-2">
                        {preview ? 'Click to change image' : 'Upload your profile picture'}
                    </span>
                                         <div
                         className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDragOver
                                 ? 'border-blue-400 bg-blue-50'
                                 : 'border-gray-300 hover:border-blue-400'
                             }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                                                 {preview ? (
                             <div className="w-full h-full p-1 flex items-center justify-center">
                                 <img
                                     src={preview}
                                     alt="Profile Preview"
                                     className="max-w-full max-h-full object-contain"
                                 />
                             </div>
                         ) : (
                            <div className="text-center">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Drag and drop an image here, or click to select
                                </p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePicChange}
                    />
                </div>

                {/* Full Name */}
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Full Name
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your full name"
                    />
                </label>

                {/* Email */}
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Email
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your email address"
                    />
                </label>

                {/* Phone Number */}
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Phone Number
                    <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your phone number"
                    />
                </label>

                {/* College Name */}
                <label className="flex flex-col gap-1 text-sm font-medium">
                    College
                    <input
                        type="text"
                        name="college"
                        value={form.college}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your college name"
                    />
                </label>

                {/* Course/Degree Name */}
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Course/Degree
                    <input
                        type="text"
                        name="course"
                        value={form.course}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your course or degree name"
                    />
                </label>

                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                        I agree to the&nbsp;
                        <p
                            onClick={()=> navigate('/t&c')}
                            className="text-blue-600 hover:underline inline-block cursor-pointer"
                        >
                            Terms and Conditions
                        </p>
                        &nbsp;and understand that my application will be reviewed by Admeasy team.
                    </label>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex gap-4 justify-center mt-6">
                    <button
                        type="submit"
                        className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer disabled:bg-gray-700 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Apply'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </main>
    )
}

export default MentorshipForm
