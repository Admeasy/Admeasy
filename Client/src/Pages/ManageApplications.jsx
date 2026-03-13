import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaArrowLeft, FaSearch } from 'react-icons/fa'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getAdminAuthHeaders } from '../utils/adminAuth'

const ManageApplications = () => {
    const navigate = useNavigate()
    const [collections, setCollections] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const showError = (error) => toast.error(error)

    useEffect(() => {
        verifyAuth()
    }, [])

    const verifyAuth = async () => {
        try {
            const response = await fetch('/api/admin/verify', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            })
            if (!response.ok) throw new Error('Not authenticated')
            fetchCollections()
        } catch (err) {
            setError('Not authenticated')
            navigate('/')
        }
    }

    const fetchCollections = async () => {
        try {
            const response = await fetch('/api/apply', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch collections')
            const data = await response.json()
            setCollections(data.collections)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredCollections = collections.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
            {/* Enhanced Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <button
                className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
                Back
            </button>

            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
                Manage Applications
            </h1>

            {error && <div className="text-red-500 text-center mb-4 relative z-10">{error}</div>}

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
                    />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredCollections.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
                            <p className="text-gray-700 text-lg font-medium">No collections found.</p>
                        </div>
                    ) : (
                        filteredCollections.map((name) => (
                            <Link key={name} to={`/admin/applications/${encodeURIComponent(name)}`}>
                                <div className="admin-dashboard-card cursor-pointer hover:shadow-lg transition-all duration-300 aspect-[4/3] flex items-center justify-center flex-col">
                                    <h2 className="text-2xl font-admeasy-bold text-gray-900 mb-2 capitalize">{name}</h2>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
}

export default ManageApplications
