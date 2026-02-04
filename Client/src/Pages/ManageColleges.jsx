import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import AddCollegeForm from '../components/AddCollegeForm'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Colleges = () => {
    const navigate = useNavigate()
    const [colleges, setColleges] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingCollege, setEditingCollege] = useState(null)
    const [deletingCollegeId, setDeletingCollegeId] = useState(null)

    const showError = (error) => {toast.error(error); return ""};
    const showSuccess = (message) => toast.success(message);

    useEffect(() => {
        verifyAuth()
    }, [])

    const verifyAuth = async () => {
        try {
            const response = await fetch('/api/admin/verify', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Not authenticated');
            }

            // If authenticated, fetch colleges
            fetchColleges();
        } catch (error) {
            console.error('Authentication failed:', error);
            // Redirect to login page
            navigate('/admin');
        }
    };

    const fetchColleges = async () => {
        try {
            const response = await fetch('/api/colleges?page=1&limit=9999')
            if (!response.ok) {
                throw new Error('Failed to fetch colleges')
            }
            const data = await response.json()
            const colleges = data.colleges || []
            setColleges(colleges)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = async (collegeId) => {
        try {
            const response = await fetch(`/api/colleges/${collegeId}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch college details');
            }
            const collegeData = await response.json();
            setEditingCollege(collegeData);
            setShowAddForm(true);
        } catch (err) {
            setError(err.message);
        }
    }

    const handleDelete = async (collegeId) => {
        if (window.confirm('Are you sure you want to delete this college? This will also delete all gallery images of this college.')) {
            setDeletingCollegeId(collegeId);
            try {
                const response = await fetch(`/api/colleges/${collegeId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete college');
                }

                // Refresh the colleges list
                await fetchColleges();
            } catch (err) {
                console.error('Delete error:', err);
                setError(err.message);
            } finally {
                setDeletingCollegeId(null);
            }
        }
    }

    const handleAddNew = () => {
        setEditingCollege(null);
        setShowAddForm(true);
    }

    const handleSubmitCollege = async (formData, collegeId = null) => {
        try {
            const url = collegeId ? `/api/colleges/${collegeId}` : '/api/colleges';
            const method = collegeId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                body: formData // FormData object will set the correct Content-Type
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || (collegeId ? 'Failed to update college' : 'Failed to add college'));
            }

            await fetchColleges();
            setShowAddForm(false);
            setEditingCollege(null);
            showSuccess(collegeId ? 'College updated successfully' : 'College added successfully');
        } catch (err) {
            console.error('Error submitting college:', err);
            setError(err.message);
        }
    }

    const handleCloseForm = () => {
        setShowAddForm(false);
        setEditingCollege(null);
    }

    const filteredColleges = colleges
        .filter(college =>
            college.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
                </div>
            </div>
        );
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
                Manage Colleges
            </h1>

            <ToastContainer className='hidden'/>

            {error && (
                showError(error)
            )}

            <div className="max-w-6xl mx-auto relative z-10">
                <button
                    onClick={handleAddNew}
                    className="mb-6 px-4 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 flex items-center hover:scale-105 active:scale-95"
                >
                    <FaPlus className="mr-2" />
                    Add New College
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search colleges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
                    />
                </div>

                <ul className="space-y-4">
                    {filteredColleges.map((college) => (
                        <li 
                            key={college._id} 
                            className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 p-3 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30"
                        >
                            <span className="text-xl font-medium text-gray-900">{college.name}</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEdit(college._id)}
                                    className="px-3 sm:px-6 py-1.25 sm:py-2.5 flex items-center gap-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                >
                                    <FaEdit className="inline" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(college._id)}
                                    disabled={deletingCollegeId === college._id}
                                    className={`px-3 sm:px-6 py-1.25 sm:py-2.5 flex items-center gap-2 ${deletingCollegeId === college._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95`}
                                >
                                    {deletingCollegeId === college._id ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FaTrash className="inline" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                {showAddForm && (
                    <AddCollegeForm
                        onClose={handleCloseForm}
                        onSubmit={handleSubmitCollege}
                        editData={editingCollege}
                    />
                )}
            </div>
        </main>
    )
}

export default Colleges
