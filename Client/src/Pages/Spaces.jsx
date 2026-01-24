import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowLeft, UserCircle2, Upload, RotateCw, Check, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import SEO from '../components/SEO';

const Spaces = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const loggedInAccount = user || mentor;

  const [mySpaces, setMySpaces] = useState([]);
  const [suggestedSpaces, setSuggestedSpaces] = useState([]);
  const [loadingMySpaces, setLoadingMySpaces] = useState(true);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [newSpaceLogo, setNewSpaceLogo] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Cropping state for logo
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_LOGO_SIZE_BYTES = 100 * 1024; // 100KB

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  async function getCroppedImg(imageSrc, pixelCrop, rotationDeg = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
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
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }

  useEffect(() => {
    const fetchMySpaces = async () => {
      if (!loggedInAccount) {
        setLoadingMySpaces(false);
        setMySpaces([]);
        return;
      }
      try {
        const res = await fetch('/api/spaces', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setMySpaces(data.spaces || []);
        }
      } catch (err) {
        console.error('Error fetching user spaces:', err);
      } finally {
        setLoadingMySpaces(false);
      }
    };

    fetchMySpaces();
  }, [loggedInAccount]);

  useEffect(() => {
    const fetchSuggestedSpaces = async () => {
      try {
        const res = await fetch('/api/spaces/discover', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setSuggestedSpaces(data.spaces || []);
        }
      } catch (err) {
        console.error('Error fetching suggested spaces:', err);
      } finally {
        setLoadingSuggested(false);
      }
    };

    fetchSuggestedSpaces();
  }, []);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error('Logo must be less than 100KB');
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
    multiple: false,
  });

  const handleLogoCropConfirm = useCallback(async () => {
    try {
      if (!tempImageSrc || !croppedAreaPixels) return;
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels, rotation);
      if (croppedBlob.size > MAX_LOGO_SIZE_BYTES) {
        toast.error('Cropped logo is still larger than 100KB. Please zoom in more or choose a different image.');
        setIsUploading(false);
        return;
      }
      const file = new File([croppedBlob], 'space-logo.jpg', { type: 'image/jpeg' });
      setNewSpaceLogo(file);
      setIsUploading(false);
      setCropModalOpen(false);
    } catch (err) {
      console.error('Error cropping logo:', err);
      toast.error('Error processing logo image');
      setIsUploading(false);
    }
  }, [tempImageSrc, croppedAreaPixels, rotation]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleJoin = async (spaceId) => {
    if (!loggedInAccount) {
      toast.info('Please log in to join spaces');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/spaces/${spaceId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to join space');
      }
      toast.success('Joined space');
      // Move to mySpaces and update suggested list
      setMySpaces((prev) => {
        const exists = prev.some((s) => s._id === spaceId);
        if (exists) return prev;
        return [data.space, ...prev];
      });
      setSuggestedSpaces((prev) =>
        prev.map((s) =>
          s._id === spaceId ? { ...s, isMember: true } : s
        )
      );
      navigate(`/spaces/${spaceId}`);
    } catch (err) {
      console.error('Error joining space:', err);
      toast.error('Failed to join space');
    }
  };

  const handleCreateSpace = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!loggedInAccount) {
      toast.info('Please log in to create a space');
      navigate('/login');
      return;
    }
    if (!newSpaceLogo) {
      toast.error('Please add a logo for your space');
      return;
    }
    if (!newSpaceName.trim()) {
      toast.error('Please enter a space name');
      return;
    }
    if (!newSpaceDescription.trim()) {
      toast.error('Please add a short description');
      return;
    }
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('name', newSpaceName.trim());
      formData.append('description', newSpaceDescription.trim());
      if (newSpaceLogo) {
        formData.append('logo', newSpaceLogo);
      }

      const res = await fetch('/api/spaces', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create space');
      }
      toast.success('Space created');
      setMySpaces((prev) => [data.space, ...prev]);
      setNewSpaceName('');
      setNewSpaceDescription('');
      setNewSpaceLogo(null);
      navigate(`/spaces/${data.space._id}`);
    } catch (err) {
      console.error('Error creating space:', err);
      toast.error('Failed to create space');
    } finally {
      setCreating(false);
    }
  };

  const renderSpaceCard = (space, isSuggested) => {
    const handleClick = () => {
      navigate(`/spaces/${space._id}`);
    };

    return (
      <button
        key={space._id}
        onClick={handleClick}
        className="w-full text-left bg-white/95 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 hover:border-[#9f3562]/30 p-4 flex flex-col gap-3 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
            {space.logo ? (
              <img
                src={space.logo}
                alt={space.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-[#9f3562]">
                {space.name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {space.name}
            </h3>
            {space.membersCount != null && (
              <p className="text-xs text-gray-500">
                {space.membersCount} member{space.membersCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
          {isSuggested && !space.isMember && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin(space._id);
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9f3562] text-white hover:bg-[#b14270] transition-colors cursor-pointer"
            >
              Join
            </button>
          )}
        </div>
        {space.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {space.description}
          </p>
        )}
      </button>
    );
  };

  const isLoading = loadingMySpaces || loadingSuggested;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-4 sm:p-6 lg:p-8 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      <SEO
        title="Spaces - Study Communities | Admeasy"
        description="Join public study spaces and communities with mentors and students."
        url="https://admeasy.in/spaces"
      />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 border border-gray-200 hover:border-[#9f3562]/40 hover:text-[#9f3562] shadow-sm hover:shadow-md transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-admeasy-bold text-gray-900 truncate">
                Spaces
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Public study communities with mentors & students
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-lg hover:shadow-[#9f3562]/30 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Space
          </button>
        </div>

        {/* Create Space Dialog Overlay */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs px-3">
            <form
              onSubmit={handleCreateSpace}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#9f3562]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      Create a new Space
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      All fields are required
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSpaceName('');
                    setNewSpaceDescription('');
                    setNewSpaceLogo(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pt-4 pb-3 overflow-y-auto space-y-4">
                {/* Logo: single circular input with preview & text */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    {...getRootProps()}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${
                      isDragActive
                        ? 'border-[#9f3562] bg-[#9f3562]/5'
                        : 'border-gray-300 bg-gray-50 hover:border-[#9f3562]/70 hover:bg-[#9f3562]/3'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {newSpaceLogo ? (
                      <img
                        src={URL.createObjectURL(newSpaceLogo)}
                        alt="Space logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] sm:text-xs font-medium text-gray-500 text-center px-2">
                        Add logo
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 text-center">
                    JPG/PNG • under 100KB (required)
                  </p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] sm:text-xs font-medium text-gray-700">
                    Space name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Eg. JEE 2026 Doubt Space"
                    maxLength={60}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562]"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] sm:text-xs font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newSpaceDescription}
                    onChange={(e) => setNewSpaceDescription(e.target.value)}
                    placeholder="What is this space about? Who is it for?"
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9f3562]/30 focus:border-[#9f3562] resize-none"
                  />
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-lg hover:shadow-[#9f3562]/30 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {creating ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/90 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-sm">
              Loading spaces for you...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#9f3562]" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Your Spaces
                </h2>
              </div>
              {mySpaces.length === 0 ? (
                <div className="bg-white/95 rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center text-center gap-3">
                  <UserCircle2 className="w-10 h-10 text-gray-300" />
                  <p className="text-sm text-gray-700 font-medium">
                    You’re not part of any space yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Join a public space below or create your own community
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mySpaces.map((space) => renderSpaceCard(space, false))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#9f3562]" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Suggested Spaces
                </h2>
              </div>
              {suggestedSpaces.length === 0 ? (
                <div className="bg-white/95 rounded-2xl border border-gray-100 p-6 text-sm text-gray-600">
                  We’ll show more public spaces here as the community grows.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedSpaces.map((space) =>
                    renderSpaceCard(space, true)
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Logo Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-[1001] p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold">Crop space logo</h3>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-64 sm:h-80 bg-gray-100">
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
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1">
                  Zoom
                </label>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4" />
                  Rotate 90°
                </button>
                <button
                  type="button"
                  onClick={handleLogoCropConfirm}
                  disabled={isUploading}
                  className="flex-1 px-3 py-2 bg-[#9f3562] hover:bg-[#b14270] text-white rounded-md text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Spaces;

