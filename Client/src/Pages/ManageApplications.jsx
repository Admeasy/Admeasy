import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaArrowLeft, FaSearch } from 'react-icons/fa'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
                credentials: 'include'
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
                credentials: 'include'
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
            <button
                className="admin-back-button"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
            </button>

            <h1 className="admin-heading">
                Manage Applications
            </h1>

            {error && <div className="text-red-500 text-center mb-4">{error}</div>}

            <div className="max-w-6xl mx-auto">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredCollections.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500">No collections found.</div>
                    ) : (
                        filteredCollections.map((name) => (
                            <Link key={name} to={`/admin/applications/${encodeURIComponent(name)}`}>
                                <div className="admin-dashboard-card cursor-pointer hover:shadow-lg transition-shadow aspect-[4/3] flex items-center justify-center flex-col">
                                    <h2 className="text-2xl font-admeasy-bold text-thead1 mb-2 capitalize">{name}</h2>
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
