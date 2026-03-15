import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSearch, FaTrash, FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaUniversity, FaVenusMars, FaLock } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import GoogleIcon from '../assets/Icons/google.svg'
import { useUser } from '../context/UserContext'
import { getAdminAuthHeaders } from '../utils/adminAuth'

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
    const [userSubscriptions, setUserSubscriptions] = useState({})
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
    const showError = (error) => { toast.error(error); return "" }
    const showSuccess = (msg) => toast.success(msg)

    useEffect(() => {
        fetchUsers()
        fetchAllSubscriptions()
    }, [])

    const fetchAllSubscriptions = async () => {
        setLoadingSubscriptions(true)
        try {
            const response = await fetch('/api/subscriptions/all', { credentials: 'include', headers: getAdminAuthHeaders() })
            if (!response.ok) {
                throw new Error('Failed to fetch subscriptions')
            }
            const data = await response.json()
            if (data.success) {
                // Group subscriptions by user ID
                const subscriptionsByUser = {}
                data.subscriptions.forEach(sub => {
                    const userId = sub.user._id || sub.user
                    if (!subscriptionsByUser[userId]) {
                        subscriptionsByUser[userId] = []
                    }
                    subscriptionsByUser[userId].push(sub)
                })
                setUserSubscriptions(subscriptionsByUser)
            }
        } catch (err) {
            console.error('Error fetching subscriptions:', err)
        } finally {
            setLoadingSubscriptions(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', { credentials: 'include', headers: getAdminAuthHeaders() })
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
                credentials: 'include',
                headers: getAdminAuthHeaders()
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
                credentials: 'include',
                headers: getAdminAuthHeaders()
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
                </div>
            </div>
        )
    }

    return (
        <main className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]'>
            {/* Enhanced Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <button
                className='absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]'
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
                Back
            </button>

            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
                Manage Users
            </h1>

            <ToastContainer className='hidden' />

            {error && showError(error)}

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
                    />
                </div>


             <div className="flex items-center justify-center mb-6">
      <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 flex flex-col items-center w-64 border border-gray-200 hover:border-[#9f3562]/30 transition-all duration-300">
        <h2 className="text-xl font-bold text-gray-800">Total Users</h2>
        <p className="text-3xl font-extrabold text-[#9f3562] mt-1">
          {userCount}
        </p>
      </div>
    </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 cursor-pointer overflow-hidden flex flex-col"
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
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg sm:text-xl" style={{ display: user.image ? 'none' : 'flex', backgroundColor: '#993e66' }}>
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
                                    {/* Subscription Info */}
                                    {userSubscriptions[user._id] && userSubscriptions[user._id].length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex items-center text-[#9f3562] font-semibold mb-2">
                                                <FaUser className="w-4 h-4 mr-2" />
                                                Subscriptions ({userSubscriptions[user._id].length})
                                            </div>
                                            <div className="space-y-1">
                                                {userSubscriptions[user._id].slice(0, 2).map((sub, idx) => (
                                                    <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                        <div className="font-medium">{sub.mentor?.name || 'Unknown Mentor'}</div>
                                                        <div className="text-gray-500">{sub.plan?.name || 'Unknown Plan'} • {sub.status}</div>
                                                    </div>
                                                ))}
                                                {userSubscriptions[user._id].length > 2 && (
                                                    <div className="text-xs text-gray-500 italic">
                                                        +{userSubscriptions[user._id].length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <button
                                className={`w-9/10 mx-auto mb-3 px-3 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-all duration-300 flex items-center justify-center disabled:bg-gray-400 hover:scale-105 active:scale-95 ${deletingUserId === user._id ? 'cursor-not-allowed' : ''}`}
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
                    <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
                        <p className="text-gray-700 text-lg font-medium">No users found</p>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                User Details
                            </h2>
                            <div className="flex items-center gap-4">
                                {/* Delete button in modal */}
                                <button
                                    className={`px-3 py-2 rounded-xl text-white transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${deletingUserId === selectedUser._id
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
                                    className="text-gray-500 hover:text-[#9f3562] text-4xl font-bold transition-colors"
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
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl sm:text-5xl" style={{ display: selectedUser.image ? 'none' : 'flex', backgroundColor: '#993e66' }}>
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
                                    <FaEnvelope className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#993e66' }} />
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

                                {/* Subscriptions Section */}
                                {userSubscriptions[selectedUser._id] && userSubscriptions[selectedUser._id].length > 0 && (
                                    <div className="p-4 bg-gradient-to-br from-[#9f3562]/10 to-[#b14270]/10 rounded-lg border border-[#9f3562]/20">
                                        <div className="flex items-center mb-3">
                                            <FaUser className="w-5 h-5 text-[#9f3562] mr-2" />
                                            <h4 className="font-semibold text-gray-900">Subscriptions ({userSubscriptions[selectedUser._id].length})</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {userSubscriptions[selectedUser._id].map((sub, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-gray-900">{sub.mentor?.name || sub.mentor?.username || 'Unknown Mentor'}</span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            sub.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {sub.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <div>Plan: {sub.plan?.name || 'Unknown Plan'}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close button at bottom */}
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
    )
}

export default ManageUsers