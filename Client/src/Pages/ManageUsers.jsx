import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSearch, FaTrash } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ManageUsers = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deletingUserId, setDeletingUserId] = useState(null)

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <main className='min-h-screen p-6 sm:p-8'>
            <button
                className='m-0 p-1 sm:p-2 text-center text-2xl sm:text-3xl absolute top-2 sm:top-4 left-2 sm:left-4 rounded-full text-gray-700 font-semibold hover:bg-gray-300 transition-colors'
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
            </button>

            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-thead1 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8">
                Manage Users
            </h1>

            <ToastContainer className='hidden' />

            {error && (
                showError(error)
            )}

            <div className="max-w-6xl mx-auto">
                <div className="relative mb-6">
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

                <ul className="space-y-4">
                    {filteredUsers.map((user) => (
                        <li
                            key={user._id}
                            className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 p-3 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-md"
                        >
                            <span className="text-xl font-medium">{user.name || 'No Name'}</span>
                            <span className="text-gray-600">{user.email || 'No Email'}</span>
                            <button
                                className={`ml-4 px-3 py-1 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center disabled:bg-gray-700 ${deletingUserId === user._id ? 'cursor-not-allowed' : ''}`}
                                onClick={() => handleDelete(user._id)}
                                disabled={deletingUserId === user._id}
                                title="Delete user"
                            >
                                <FaTrash className="mr-2" />
                                {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    )
}

export default ManageUsers