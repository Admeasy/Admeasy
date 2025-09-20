import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSearch, FaTrash, FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaUniversity, FaVenusMars, FaLock } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import GoogleIcon from '../assets/Icons/google.svg'
import { useUser } from '../context/UserContext'

const ManageUsers = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deletingUserId, setDeletingUserId] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [unlockedImages, setUnlockedImages] = useState({})
    const [unlockingImage, setUnlockingImage] = useState(null)
    const { user: currentUser } = useUser()
    const [userCount,SetUserCount] = useState(0)
    const showError = (error) => { toast.error(error); return "" }
    const showSuccess = (msg) => toast.success(msg)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', { credentials: 'include' })
            if (!response.ok) {
                throw new Error('Failed to fetch users')
            }
            const data = await response.json()
            setUsers(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleShowUserDetails = (user) => {
        setSelectedUser(user)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedUser(null)
    }

    const unlockImage = async (userId) => {
        if (unlockedImages[userId]) return; // Already unlocked
        
        setUnlockingImage(userId);
        try {
            const response = await fetch(`/api/users/${userId}/image`, { 
                credentials: 'include' 
            });
            if (!response.ok) {
                throw new Error('Failed to unlock image');
            }
            const imageUrl = await response.json();
            if (imageUrl) {
                setUnlockedImages(prev => ({
                    ...prev,
                    [userId]: imageUrl
                }));
            }
        } catch (err) {
            showError('Failed to unlock image');
        } finally {
            setUnlockingImage(null);
        }
    }

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        setDeletingUserId(userId)
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }
            showSuccess('User deleted successfully');
            await fetchUsers();
            if (selectedUser && selectedUser._id === userId) {
                closeModal();
            }
        } catch (err) {
            showError(err.message)
        } finally {
            setDeletingUserId(null)
        }
    }

    const filteredUsers = users
        .filter(user =>
            (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    useEffect(()=>{
 SetUserCount(filteredUsers.length)
    },[filteredUsers])
       
    
        if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <main className='min-h-screen p-4 sm:p-6 lg:p-8'>
            <button
                className='admin-back-button'
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
            </button>

            <h1 className="admin-heading">
                Manage Users
            </h1>

            <ToastContainer className='hidden' />

            {error && showError(error)}

            <div className="max-w-6xl mx-auto">
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>


             <div className="flex items-center justify-center mb-3">
      <div className="bg-white shadow-lg rounded-2xl p-2 flex flex-col items-center w-64 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Total Users</h2>
        <p className="text-3xl font-extrabold text-blue-600 mt-1">
          {userCount}
        </p>
      </div>
    </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                            onClick={() => handleShowUserDetails(user)}
                        >
                            <div className="p-4 sm:p-6 flex-1">
                                <div className="flex items-center space-x-3 mb-4 relative">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {user.image ? (
                                            <img
                                                src={user.image}
                                                alt={user.name || 'User'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl" style={{ display: user.image ? 'none' : 'flex' }}>
                                            {(user.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    {user.image ? user?.image.includes('googleusercontent.com') && (<img src={GoogleIcon} alt="Google Account" className="size-6 sm:size-8 absolute top-0 right-0" />) : null}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                            {user.name || 'No Name'}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {user.email || 'No Email'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {user.course && (
                                        <div className="flex items-center text-gray-600">
                                            <FaGraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">{user.course}</span>
                                        </div>
                                    )}
                                    {user.institute && (
                                        <div className="flex items-center text-gray-600">
                                            <FaUniversity className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">{user.institute}</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <button
                                className={`w-9/10 mx-auto mb-3 px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400 ${deletingUserId === user._id ? 'cursor-not-allowed' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(user._id);
                                }}
                                disabled={deletingUserId === user._id}
                                title="Delete user"
                            >
                                <FaTrash className="mr-2" />
                                {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    ))}
                </div>

                {filteredUsers.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No users found</p>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-thead1">
                                User Details
                            </h2>
                            <div className="flex items-center gap-4">
                                {/* Delete button in modal */}
                                <button
                                    className={`px-3 py-2 rounded-lg text-white transition-colors flex items-center justify-center ${deletingUserId === selectedUser._id
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    onClick={() => handleDelete(selectedUser._id)}
                                    disabled={deletingUserId === selectedUser._id}
                                    title="Delete user"
                                >
                                    <FaTrash className="mr-2" />
                                    Delete
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 text-4xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
                            <div className="flex flex-col items-center mb-6">
                                {/* Large Round Image */}
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-200 mb-4 flex-shrink-0 relative">
                                    {selectedUser.image ? (
                                        <>
                                            {/* Show locked image if not unlocked and not Google user */}
                                            {!unlockedImages[selectedUser._id] && !selectedUser.image.includes('googleusercontent.com') ? (
                                                <div 
                                                    className="w-full h-full relative cursor-pointer group"
                                                    onClick={() => unlockImage(selectedUser._id)}
                                                >
                                                    {/* Blurred original image as background */}
                                                    <img
                                                        src={selectedUser.image}
                                                        alt={selectedUser.name || 'User'}
                                                        className="w-full h-full object-cover blur-sm"
                                                    />
                                                    {/* Translucent black overlay */}
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                                        <FaLock className="text-white text-2xl sm:text-3xl mb-2" />
                                                        <span className="text-white text-sm sm:text-base font-medium text-center">
                                                            {unlockingImage === selectedUser._id ? 'Unlocking...' : 'Tap to Unlock'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Show unlocked/Google image */
                                                <img
                                                    src={unlockedImages[selectedUser._id] || selectedUser.image}
                                                    alt={selectedUser.name || 'User'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : null}
                                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl sm:text-5xl" style={{ display: selectedUser.image ? 'none' : 'flex' }}>
                                        {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
                                    {selectedUser.name || 'No Name'}
                                </h3>
                            </div>

                            {/* User Information */}
                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <FaEnvelope className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedUser.email || 'No Email'}</p>
                                    </div>
                                </div>

                                {selectedUser.phone && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <FaPhone className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="font-medium">{selectedUser.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedUser.gender && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <FaVenusMars className="w-5 h-5 text-pink-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-500">Gender</p>
                                            <p className="font-medium capitalize">{selectedUser.gender}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedUser.course && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <FaGraduationCap className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-500">Course</p>
                                            <p className="font-medium">{selectedUser.course}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedUser.institute && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <FaUniversity className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-500">Institute</p>
                                            <p className="font-medium">{selectedUser.institute}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close button at bottom */}
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
    )
}

export default ManageUsers