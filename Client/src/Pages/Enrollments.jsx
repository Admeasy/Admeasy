import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSearch, FaEye, FaTrash } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Enrollments = () => {
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState(null)

  const showError = (error) => { toast.error(error); return "" }
  const showSuccess = (msg) => toast.success(msg)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments', { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch enrollments')
      const data = await response.json()
      setEnrollments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowFullEnrollment = (enrollment) => {
    setSelectedEnrollment(enrollment)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedEnrollment(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) return

    setDeletingEnrollmentId(id)
    try {
      const response = await fetch(`/api/enrollments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete enrollment')
      }

      showSuccess('Enrollment deleted successfully')
      await fetchEnrollments()

      if (selectedEnrollment && selectedEnrollment._id === id) {
        closeModal()
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setDeletingEnrollmentId(null)
    }
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }
  const formatDate = (stamp) => {
    if (!stamp) return 'No Timestamp'
    const date = new Date(stamp)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }

 const filteredEnrollments = enrollments
  .filter(e =>
    (e.bannerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (e.number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (formatDate(e.createdAt).toLowerCase()).includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className='min-h-screen p-6 sm:p-8'>
      <button className='admin-back-button' onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <h1 className="text-center text-3xl sm:text-5xl font-admeasy-bold text-thead1 mb-8">
        Enrollments
      </h1>

      <ToastContainer className='hidden' />

      {error && showError(error)}

      <div className="max-w-6xl mx-auto">
        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <div
              key={enrollment._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 relative flex flex-col h-64"
            >
              {/* Delete Button */}
              <button
                className={`absolute top-2 right-2 p-2 rounded-full text-white transition-colors ${
                  deletingEnrollmentId === enrollment._id
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={() => handleDelete(enrollment._id)}
                disabled={deletingEnrollmentId === enrollment._id}
              >
                <FaTrash className="text-sm" />
              </button>

              <p className='text-red-800'>User Clicked On {enrollment.bannerName||'None'}</p>
              <h3 className="text-lg font-semibold text-thead1 mb-2">{enrollment.name || 'No Name'}</h3>
              <p className="text-gray-600 text-sm">{enrollment.email || 'No Email'}</p>
              <p className="text-gray-600 text-sm">{enrollment.number || 'No Number'}</p>
              <p className="text-tsecondary text-xs mt-2">{enrollment.createdAt ? formatDate(enrollment.createdAt) : 'No Timestamp'}</p>

              <button
                className="mt-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                onClick={() => handleShowFullEnrollment(enrollment)}>
                <FaEye className="text-sm" />
                Show Full Enrollment
              </button>
            </div>
          ))}
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No enrollments found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-2xl font-bold text-thead1">{selectedEnrollment.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-full text-white ${
                    deletingEnrollmentId === selectedEnrollment._id
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={() => handleDelete(selectedEnrollment._id)}
                  disabled={deletingEnrollmentId === selectedEnrollment._id}
                >
                  <FaTrash className="text-sm" />
                </button>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
              </div>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              <p className="text-gray-600">User Clicked On Banner Of <span className='text-red-700 font-admeasy-bold'>{selectedEnrollment.bannerName} </span> </p>
              <p className="text-gray-600"><strong>Email:</strong> {selectedEnrollment.email}</p>
              <p className="text-gray-600"><strong>Number:</strong> {selectedEnrollment.number}</p>
              <p className="text-gray-600"><strong>Joined:</strong> {selectedEnrollment.createdAt ? formatDate(selectedEnrollment.createdAt) : 'No Timestamp'}</p>
            </div>
            <div className="p-6">
              <button onClick={closeModal} className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Enrollments