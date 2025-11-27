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
  const [deletingMentorUsername, setDeletingMentorUsername] = useState(null);
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

  const handleDelete = async (username) => {
    if (!username) {
      showError('Mentor username is missing');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this mentor?')) return;
    setDeletingMentorUsername(username);
    try {
      const res = await fetch(`/api/mentors/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete mentor');
      }
      toast.success('Mentor deleted successfully');
      setMentors((prev) => prev.filter((mentor) => mentor.username !== username));
      if (selectedMentor && selectedMentor.username === username) {
        closeModal();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete mentor');
    } finally {
      setDeletingMentorUsername(null);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <button className="admin-back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <h1 className="admin-heading">Manage Mentors</h1>

      <ToastContainer className="hidden" />

      {error && showError(error)}

      <div className="max-w-6xl mx-auto">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-center mb-3">
          <div className="bg-white shadow-lg rounded-2xl p-2 flex flex-col items-center w-64 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Total Mentors</h2>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{filteredMentors.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
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
                className={`w-9/10 mx-auto mb-3 px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400 ${deletingMentorUsername === mentor.username ? 'cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(mentor.username);
                }}
                disabled={deletingMentorUsername === mentor.username}
                title="Delete mentor"
              >
                <FaTrash className="mr-2" />
                {deletingMentorUsername === mentor.username ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No mentors found</p>
          </div>
        )}
      </div>

      {showModal && selectedMentor && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-thead1">Mentor Details</h2>
              <div className="flex items-center gap-4">
                <button
                  className={`px-3 py-2 rounded-lg text-white transition-colors flex items-center justify-center ${deletingMentorUsername === selectedMentor.username ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                  onClick={() => handleDelete(selectedMentor.username)}
                  disabled={deletingMentorUsername === selectedMentor.username}
                  title="Delete mentor"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-4xl font-bold">
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
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl sm:text-5xl">
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
                  <FaEnvelope className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
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
                className="w-full px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
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


