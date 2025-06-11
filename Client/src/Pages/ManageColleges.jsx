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
            const response = await fetch('/api/colleges', {
                credentials: 'include'
            })
            if (!response.ok) {
                throw new Error('Failed to fetch colleges')
            }
            const data = await response.json()
            setColleges(data)
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
        if (window.confirm('Are you sure you want to delete this college? This will also delete all gallery images.')) {
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

    const filteredColleges = colleges.filter(college =>
        college.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className='min-h-screen p-8'>
            <button 
                className='size-fit m-0 p-2 text-center text-3xl absolute top-4 left-4 rounded-full text-gray-700 font-semibold hover:bg-gray-400 transition-colors' 
                onClick={() => navigate('/admin')}
            >
                <FaArrowLeft />
            </button>
            
            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-thead1 font-admeasy-bold text-5xl mb-8">
                Manage Colleges
            </h1>

            <ToastContainer className='hidden'/>

            {error && (
                showError(error)
            )}

            <div className="max-w-6xl mx-auto">
                <button
                    onClick={handleAddNew}
                    className="mb-4 px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
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
                        className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <ul className="space-y-4">
                    {filteredColleges.map((college) => (
                        <li 
                            key={college._id} 
                            className="flex items-center justify-between p-6 bg-white rounded-xl shadow-md"
                        >
                            <span className="text-xl font-medium">{college.name}</span>
                            <div className="space-x-3">
                                <button
                                    onClick={() => handleEdit(college._id)}
                                    className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <FaEdit className="inline mr-2" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(college._id)}
                                    disabled={deletingCollegeId === college._id}
                                    className={`px-6 py-2.5 ${deletingCollegeId === college._id ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg transition-colors`}
                                >
                                    {deletingCollegeId === college._id ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FaTrash className="inline mr-2" />
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
        </div>
    )
}

export default Colleges
