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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className='min-h-screen p-6 sm:p-8'>
      <button
        className='admin-back-button'
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
      </button>

      <h1 className="w-fit h-fit m-0 p-0 mx-auto text-thead1 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8">
        Messages from Users
      </h1>

      <ToastContainer className='hidden' />

      {error && showError(error)}

      <div className="max-w-6xl mx-auto">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages by email or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
           {filteredMessages.map((message) => (
             <div
               key={message._id}
               className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 flex flex-col h-64 sm:h-72 relative"
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
               
               <h3 className="text-lg sm:text-xl font-semibold text-thead1 mb-3 line-clamp-1 pr-12">
                 {message.email || 'No Email'}
               </h3>
               <h3 className="text-tsecondary text-sm">
                 {message.createdAt ? formatDate(message.createdAt) : 'No Timestamp'}
               </h3>
               <p className="text-gray-600 text-sm sm:text-base flex-grow line-clamp-4 mb-4 font-semibold">
                 {message.text || 'No Message'}
               </p>
               <button
                 className="mt-auto w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No messages found</p>
          </div>
        )}
      </div>

             {/* Modal for full message */}
       {showModal && selectedMessage && (
         <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
             <div className="flex items-center justify-between p-6 pb-0">
               <h2 className="text-2xl font-bold text-thead1">
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
                   className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                 >
                   ×
                 </button>
               </div>
             </div>
             <div className="p-6 flex-grow overflow-y-auto">
               <h3 className="text-tsecondary text-base leading-relaxed">
                 {selectedMessage.createdAt ? formatDate(selectedMessage.createdAt) : 'No Timestamp'}
               </h3>
               <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap font-semibold">
                 {selectedMessage.text || 'No Message'}
               </p>
             </div>
             <div className="p-6">
               <button
                 onClick={closeModal}
                 className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
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
