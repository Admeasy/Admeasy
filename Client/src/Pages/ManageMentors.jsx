import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaArrowLeft,
  FaGraduationCap,
  FaSearch,
  FaUniversity,
  FaVenusMars,
  FaEnvelope,
  FaPhone,
  FaTrash,
  FaLock,
} from 'react-icons/fa';

const fallbackProfilePic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const ManageMentors = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingMentorId, setDeletingMentorId] = useState(null);
  const [unlockedImages, setUnlockedImages] = useState({});
  const [unlockingImage, setUnlockingImage] = useState(null);

  const showError = (message) => {
    toast.error(message);
    return '';
  };

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await fetch('/api/mentors', { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to fetch mentors');
        }
        const data = await res.json();
        setMentors(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load mentors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const filteredMentors = useMemo(
    () =>
      mentors
        .filter((mentor) => {
          const q = searchQuery.toLowerCase();
          return (
            (mentor.name || '').toLowerCase().includes(q) ||
            (mentor.username || '').toLowerCase().includes(q) ||
            (mentor.email || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [mentors, searchQuery]
  );

  const handleShowMentorDetails = (mentor) => {
    setSelectedMentor(mentor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMentor(null);
  };

  const handleDelete = async (mentorId) => {
    if (!mentorId) {
      showError('Mentor ID is missing');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this mentor?')) return;
    setDeletingMentorId(mentorId);
    try {
      const res = await fetch(`/api/mentors/${encodeURIComponent(mentorId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete mentor');
      }
      toast.success('Mentor deleted successfully');
      setMentors((prev) => prev.filter((mentor) => mentor._id !== mentorId));
      if (selectedMentor && selectedMentor._id === mentorId) {
        closeModal();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete mentor');
    } finally {
      setDeletingMentorId(null);
    }
  };

  const unlockImage = async (username) => {
    if (!username || unlockedImages[username]) return;
    setUnlockingImage(username);
    try {
      const res = await fetch(`/api/mentors/${encodeURIComponent(username)}/pic`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to unlock image');
      }
      const data = await res.json();
      if (!data) {
        throw new Error('No image available');
      }
      setUnlockedImages((prev) => ({ ...prev, [username]: data }));
    } catch (err) {
      showError(err.message || 'Failed to unlock image');
    } finally {
      setUnlockingImage(null);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <button className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]" onClick={() => navigate(-1)}>
        <FaArrowLeft />
        Back
      </button>

      <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">Manage Mentors</h1>

      <ToastContainer className="hidden" />

      {error && showError(error)}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
          />
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 flex flex-col items-center w-64 border border-gray-200 hover:border-[#9f3562]/30 transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-800">Total Mentors</h2>
            <p className="text-3xl font-extrabold text-[#9f3562] mt-1">{filteredMentors.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor._id}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 cursor-pointer overflow-hidden flex flex-col"
              onClick={() => handleShowMentorDetails(mentor)}
            >
              <div className="p-4 sm:p-6 flex-1">
                <div className="flex items-center space-x-3 mb-4 relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={fallbackProfilePic}
                      alt={mentor.name || mentor.username || 'Mentor'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{mentor.username || 'No Username'}</h3>
                    <h4 className="text-md sm:text-lg font-medium text-gray-500 truncate">
                      {mentor.name || 'No Name'}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">{mentor.email || 'No Email'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {mentor.course && mentor.course.name && (
                    <div className="flex items-center text-gray-600">
                      <FaGraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{mentor.course.name}</span>
                    </div>
                  )}
                  {mentor.college && mentor.college.name && (
                    <div className="flex items-center text-gray-600">
                      <FaUniversity className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{mentor.college.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                className={`w-9/10 mx-auto mb-3 px-3 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-all duration-300 flex items-center justify-center disabled:bg-gray-400 hover:scale-105 active:scale-95 ${deletingMentorId === mentor._id ? 'cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(mentor._id);
                }}
                disabled={deletingMentorId === mentor._id}
                title="Delete mentor"
              >
                <FaTrash className="mr-2" />
                {deletingMentorId === mentor._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
            <p className="text-gray-700 text-lg font-medium">No mentors found</p>
          </div>
        )}
      </div>

      {showModal && selectedMentor && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mentor Details</h2>
              <div className="flex items-center gap-4">
                <button
                  className={`px-3 py-2 rounded-xl text-white transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${deletingMentorId === selectedMentor._id ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                  onClick={() => handleDelete(selectedMentor._id)}
                  disabled={deletingMentorId === selectedMentor._id}
                  title="Delete mentor"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
                <button onClick={closeModal} className="text-gray-500 hover:text-[#9f3562] text-4xl font-bold transition-colors">
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-200 mb-4 flex-shrink-0 relative">
                  {selectedMentor.image ? (
                    unlockedImages[selectedMentor.username] ? (
                      <img
                        src={unlockedImages[selectedMentor.username]}
                        alt={selectedMentor.name || selectedMentor.username || 'Mentor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full relative cursor-pointer group"
                        onClick={() => unlockImage(selectedMentor.username)}
                      >
                        <div className="w-full h-full bg-gray-300 blur-sm" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                          <FaLock className="text-white text-2xl sm:text-3xl mb-2" />
                          <span className="text-white text-sm sm:text-base font-medium text-center">
                            {unlockingImage === selectedMentor.username ? 'Unlocking...' : 'View Image'}
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl sm:text-5xl" style={{ backgroundColor: '#993e66' }}>
                      {(selectedMentor.name || selectedMentor.username || 'M').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
                  {selectedMentor.name || selectedMentor.username || 'No Name'}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FaEnvelope className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#993e66' }} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedMentor.email || 'No Email'}</p>
                  </div>
                </div>

                {selectedMentor.phone && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <FaPhone className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedMentor.phone}</p>
                    </div>
                  </div>
                )}

                {selectedMentor.username && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <FaVenusMars className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="font-medium">{selectedMentor.username}</p>
                    </div>
                  </div>
                )}

                {selectedMentor.course && selectedMentor.course.name && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <FaGraduationCap className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-medium">{selectedMentor.course.name}</p>
                    </div>
                  </div>
                )}

                {selectedMentor.college && selectedMentor.college.name && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <FaUniversity className="w-5 h-5 text-pink-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">College</p>
                      <p className="font-medium">{selectedMentor.college.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 pt-0 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ManageMentors;


