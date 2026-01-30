import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { X, Upload, Loader2, Menu } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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

const EditAdvertiserProfile = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { setShowMobileMenu } = outletContext;
  const [advertiser, setAdvertiser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    website: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Image cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Real-time username availability check
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      const username = formData.username?.trim();

      if (!username || username === advertiser?.username) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

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
  }, [formData.username, advertiser?.username]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/advertisers/me', {
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        setAdvertiser(data.advertiser);
        setFormData({
          name: data.advertiser.name || '',
          username: data.advertiser.username || '',
          bio: data.advertiser.bio || '',
          website: data.advertiser.website || ''
        });
        if (data.advertiser.image) {
          setPreview(data.advertiser.image);
        }
      } else {
        toast.error('Failed to load profile');
        navigate('/advertiser/dashboard');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      toast.error('Failed to load profile');
      navigate('/advertiser/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useRef((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop.current,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const onCropComplete = useRef((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  });

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(
        tempImageSrc,
        croppedAreaPixels,
        rotation
      );
      setProfilePic(croppedImage);
      setPreview(URL.createObjectURL(croppedImage));
      setCropModalOpen(false);
      setTempImageSrc(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameStatus.checking || (formData.username && formData.username !== advertiser?.username && !usernameStatus.available)) {
      toast.error('Please wait for username validation or choose a different username');
      return;
    }

    try {
      setIsSubmitting(true);
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('username', formData.username || '');
      submitFormData.append('bio', formData.bio || '');
      submitFormData.append('website', formData.website || '');
      
      if (profilePic) {
        submitFormData.append('image', profilePic);
      }

      const res = await fetch('/api/advertisers/profile', {
        method: 'PUT',
        body: submitFormData,
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Profile updated successfully!');
        navigate('/advertiser/profile');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SEO title="Edit Profile | Advertiser Dashboard" description="Edit your advertiser profile" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100"
      >
        <div className="flex items-center justify-between gap-2 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Profile</h1>
          <button
            type="button"
            onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
            className="inline-flex xl:hidden items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Profile Picture
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="relative">
                <img
                  src={preview || fallbackProfilePic}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-4 border-gray-100"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
              </div>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{isDragActive ? 'Drop image here' : 'Change Photo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base"
            />
            {usernameStatus.message && (
              <p className={`text-xs sm:text-sm mt-1 ${
                usernameStatus.available ? 'text-green-600' : 
                usernameStatus.checking ? 'text-gray-600' : 'text-red-600'
              }`}>
                {usernameStatus.message}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562] text-sm sm:text-base"
              placeholder="https://example.com"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/advertiser/profile')}
              className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus.checking}
              className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="relative h-64 sm:h-80 md:h-96 mb-3 sm:mb-4">
              <Cropper
                image={tempImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete.current}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <label className="flex-1 w-full sm:w-auto">
                <span className="text-xs sm:text-sm font-medium mb-1 block">Zoom: {Math.round(zoom * 100)}%</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="flex-1 w-full sm:w-auto">
                <span className="text-xs sm:text-sm font-medium mb-1 block">Rotation: {rotation}°</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setCropModalOpen(false);
                  setTempImageSrc(null);
                }}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg text-sm sm:text-base"
              >
                Crop & Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EditAdvertiserProfile;
