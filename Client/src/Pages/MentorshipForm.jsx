import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cropper from 'react-easy-crop';
import { Upload, X, Loader2, Camera, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// Helper for Cropping & Compression
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Square crop size (we force 1:1 on cropper)
    const size = Math.min(pixelCrop.width, pixelCrop.height);

    // Set fixed max bounds for 1:1 ratio if you want to cap res, e.g. 800x800
    const desiredSize = Math.min(size, 800);

    canvas.width = desiredSize;
    canvas.height = desiredSize;

    // Draw image cropped
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        size,
        size,
        0,
        0,
        desiredSize,
        desiredSize
    );

    return new Promise((resolve) => {
        // Compress using JPEG at 0.8 quality
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.8);
    });
};

const MentorshipForm = () => {
    const [profilePic, setProfilePic] = useState(null);
    const [preview, setPreview] = useState('');

    // Cropper states
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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

    const handleFileRead = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(file);
        } else {
            toast.error('Please upload a valid image file');
        }
    };

    const handlePicChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileRead(e.target.files[0]);
        }
        // clear input so same file can be selected again if cancelled
        if (fileInputRef.current) fileInputRef.current.value = "";
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileRead(e.dataTransfer.files[0]);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Create a preview URL for UI
            const previewUrl = URL.createObjectURL(croppedImageBlob);
            setPreview(previewUrl);

            // Convert blob to file for standard formData schema
            const finalFile = new File([croppedImageBlob], "profile_crop.jpg", { type: "image/jpeg" });
            setProfilePic(finalFile);

            setIsCropModalOpen(false);
            setImageSrc(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image.");
        }
    };

    const handleCropCancel = () => {
        setIsCropModalOpen(false);
        setImageSrc(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error('Please agree to the Terms and Conditions');
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone', form.phone);
        formData.append('college', form.college);
        formData.append('course', form.course);

        // Optional image
        if (profilePic) {
            formData.append('image', profilePic);
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/apply/mentorship', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                navigate('/')
                toast.success('🎉 Application submitted successfully. We will contact you shortly.')
                setForm({
                    name: "",
                    email: "",
                    phone: "",
                    college: "",
                    course: ""
                });
                setProfilePic(null)
                setPreview("")
                setAgreedToTerms(false)
            } else if (res.status === 409) {
                toast.error('Applicant already exists');
            } else if (res.status === 403) {
                toast.error('Mentor already exists');
            } else {
                toast.error('An Error Occurred!');
            }
        } catch (e) {
            toast.error('Network Error. Please try again.');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative selection:bg-[#9f3562]/20 selection:text-[#9f3562] py-12 px-4 sm:px-6">
            <SEO
                title="Apply for Mentorship | Admeasy"
                description="Want to guide students in their college admissions and career choices and earn a passive income? Apply for mentorship at Admeasy."
                keywords="apply, mentorship, admeasy, earn money, passive income, guide students, career"
                url="https://admeasy.in/careers/mentorship/apply"
            />

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#9f3562]/5 to-pink-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-300/5 to-pink-200/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                        Join as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9f3562] to-[#b86286]">Mentor</span>
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
                        Empower students, share your college journey, and start building your passive income stream today.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-10 flex flex-col gap-6">

                        {/* Image Upload Area (Optional, Premium) */}
                        <div className="flex flex-col items-center justify-center pt-2 pb-6 border-b border-gray-100">
                            <div className="relative group">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 flex items-center justify-center cursor-pointer transition-all duration-300
                                    ${isDragOver ? 'border-[#9f3562] scale-105 bg-pink-50' : preview ? 'border-transparent shadow-md' : 'border-gray-200 border-dashed bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Upload className="w-8 h-8 group-hover:text-[#9f3562] transition-colors" />
                                        </div>
                                    )}
                                </div>
                                {!preview && (
                                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-sm border border-gray-100">
                                        <Camera className="w-4 h-4 text-[#9f3562]" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-sm font-semibold text-gray-700 block">Profile Picture</span>
                                <span className="text-xs text-gray-400 font-medium">Optional • Drag & drop or click to upload</span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePicChange}
                            />
                        </div>

                        {/* Input Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-1.5 focus-within:text-[#9f3562] transition-colors">
                                <span className="text-sm font-semibold text-gray-700">Full Name</span>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="Prakash Jha"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5 focus-within:text-[#9f3562] transition-colors">
                                <span className="text-sm font-semibold text-gray-700">Email Address</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="prakash@example.com"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5 focus-within:text-[#9f3562] transition-colors">
                                <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all text-gray-900 placeholder:text-gray-400"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5 focus-within:text-[#9f3562] transition-colors">
                                <span className="text-sm font-semibold text-gray-700">College Name</span>
                                <input
                                    type="text"
                                    name="college"
                                    value={form.college}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="IIT Bombay"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5 sm:col-span-2 focus-within:text-[#9f3562] transition-colors">
                                <span className="text-sm font-semibold text-gray-700">Course / Degree</span>
                                <input
                                    type="text"
                                    name="course"
                                    value={form.course}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="B.Tech Computer Science"
                                />
                            </label>
                        </div>

                        {/* Terms */}
                        <div className="bg-gray-50 rounded-xl p-4 mt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        required
                                        className="peer sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center group-hover:border-[#9f3562] ${agreedToTerms ? 'bg-[#9f3562] border-[#9f3562]' : 'border-gray-300'}`}>
                                        <Check className={`w-3.5 h-3.5 text-white transition-opacity ${agreedToTerms ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                                    </div>
                                </div>
                                <span className="text-[13px] text-gray-600 leading-relaxed">
                                    I agree to the <a href="/t&c" target="_blank" className="font-semibold text-[#9f3562] hover:underline" onClick={(e) => e.stopPropagation()}>Terms and Conditions</a> and understand my application will be reviewed for authenticity by the Admeasy team.
                                </span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="order-2 sm:order-1 flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="order-1 sm:order-2 flex-[2] relative overflow-hidden group px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed transition-all text-sm shadow-md hover:shadow-lg focus:ring-4 focus:ring-[#9f3562]/30"
                            >
                                <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${isSubmitting ? 'scale-0' : 'scale-100'}`}>
                                    Apply for Mentorship
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </span>
                                {isSubmitting && (
                                    <div className="absolute inset-0 flex items-center justify-center gap-2.5">
                                        <Loader2 className="w-5 h-5 animate-spin text-white/90" />
                                        <span>Submitting...</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Instagram Style Image Crop Modal */}
            <AnimatePresence>
                {isCropModalOpen && imageSrc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={handleCropCancel}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-3xl overflow-hidden w-full max-w-md sm:max-w-lg relative z-10 shadow-2xl flex flex-col h-[600px] max-h-[85vh] sm:max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-none">
                                <button type="button" onClick={handleCropCancel} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-gray-900">Adjust Photo</h3>
                                <div className="w-9" /> {/* Spacer for centering */}
                            </div>

                            <div className="relative w-full flex-1 min-h-0 bg-gray-900 overscroll-none touch-none">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>

                            <div className="p-4 sm:p-5 flex flex-col gap-4 flex-none">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-gray-500">Zoom</span>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        onChange={(e) => setZoom(e.target.value)}
                                        className="w-full accent-[#9f3562]"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCropSave}
                                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                                >
                                    Confirm Profile Photo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MentorshipForm;
