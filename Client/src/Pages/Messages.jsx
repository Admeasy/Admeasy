import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSearch, FaEye, FaTrash } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Messages = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState(null)

  const showError = (error) => { toast.error(error); return "" }
  const showSuccess = (msg) => toast.success(msg)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowFullMessage = (message) => {
    setSelectedMessage(message)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedMessage(null)
  }

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    
    setDeletingMessageId(messageId)
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete message')
      }
      
      showSuccess('Message deleted successfully')
      await fetchMessages() // Refresh the messages list
      
      // If the deleted message was the one in the modal, close the modal
      if (selectedMessage && selectedMessage._id === messageId) {
        closeModal()
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setDeletingMessageId(null)
    }
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };

  const formatDate = (stamp) => {
    if (!stamp) return 'No Timestamp';

    const date = new Date(stamp);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return;
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  const filteredMessages = messages
    .filter(message =>
      (message.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (message.text?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (formatDate(message.createdAt).toLowerCase()).includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

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
        Messages from Users
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
            placeholder="Search messages by email or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredMessages.map((message) => (
            <div
              key={message._id}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 p-4 sm:p-6 flex flex-col h-64 sm:h-72 relative"
            >
              {/* Delete button - top right corner */}
              <button
                className={`absolute top-2 right-2 p-2 rounded-full text-white transition-colors flex items-center justify-center ${
                  deletingMessageId === message._id 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={() => handleDelete(message._id)}
                disabled={deletingMessageId === message._id}
                title="Delete message"
              >
                <FaTrash className="text-sm" />
              </button>
              
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 line-clamp-1 pr-12">
                {message.email || 'No Email'}
              </h3>
              <h3 className="text-gray-600 text-sm">
                {message.createdAt ? formatDate(message.createdAt) : 'No Timestamp'}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base flex-grow line-clamp-4 mb-4 font-semibold">
                {message.text || 'No Message'}
              </p>
              <button
                className="mt-auto w-full px-4 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                onClick={() => handleShowFullMessage(message)}
                title="Show full message"
              >
                <FaEye className="text-sm" />
                Show Full Message
              </button>
            </div>
          ))}
        </div>

        {filteredMessages.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
            <p className="text-gray-700 text-lg font-medium">No messages found</p>
          </div>
        )}
      </div>

      {/* Modal for full message */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMessage.email || 'No Email'}
              </h2>
              <div className="flex items-center gap-2">
                {/* Delete button in modal */}
                <button
                  className={`p-2 rounded-full text-white transition-colors flex items-center justify-center ${
                    deletingMessageId === selectedMessage._id 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={() => handleDelete(selectedMessage._id)}
                  disabled={deletingMessageId === selectedMessage._id}
                  title="Delete message"
                >
                  <FaTrash className="text-sm" />
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-[#9f3562] text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              <h3 className="text-gray-600 text-base leading-relaxed">
                {selectedMessage.createdAt ? formatDate(selectedMessage.createdAt) : 'No Timestamp'}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap font-semibold">
                {selectedMessage.text || 'No Message'}
              </p>
            </div>
            <div className="p-6">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Messages
