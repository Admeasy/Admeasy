import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaCheck, FaTimes, FaDownload, FaStar, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const ManageNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [searchTerm, statusFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/notes/admin/all?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.data || []);
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (noteId, status, rejectionReason = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/notes/admin/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, rejectionReason })
      });

      if (response.ok) {
        toast.success(`Note ${status === 'published' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`);
        fetchNotes();
        setShowModal(false);
        setSelectedNote(null);
      } else {
        throw new Error('Failed to update note status');
      }
    } catch (error) {
      console.error('Error updating note status:', error);
      toast.error('Failed to update note status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/notes/admin/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Note deleted successfully');
        fetchNotes();
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeatured = async (noteId, isFeatured) => {
    try {
      const response = await fetch(`/api/notes/admin/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isFeatured: !isFeatured })
      });

      if (response.ok) {
        toast.success(`Note ${!isFeatured ? 'marked as featured' : 'unmarked as featured'}`);
        fetchNotes();
      } else {
        throw new Error('Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && notes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Notes</h1>
          <p className="text-gray-600">Review and manage all uploaded notes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
            <div className="text-gray-600">Total Notes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {notes.filter(n => n.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">
              {notes.filter(n => n.status === 'published').length}
            </div>
            <div className="text-gray-600">Published</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-red-600">
              {notes.filter(n => n.status === 'rejected').length}
            </div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Notes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notes.map((note) => (
                    <tr key={note._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {note.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {note.standard} • {formatFileSize(note.fileSize)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {note.university} • {note.programme} • {note.course}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{note.uploaderName}</div>
                        <div className="text-sm text-gray-500">{note.uploader?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(note.status)}`}>
                          {note.status}
                        </span>
                        {note.isFeatured && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {note.likes} likes • {note.views} views
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(note.fileUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download/View File"
                          >
                            <FaDownload />
                          </button>
                          {note.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(note._id, 'published')}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedNote(note);
                                  setShowModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleFeatured(note._id, note.isFeatured)}
                            disabled={actionLoading}
                            className={`${note.isFeatured ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-900`}
                            title={note.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
                          >
                            <FaStar />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reject Note</h3>
              <p className="text-gray-600 mb-4">
                Provide a reason for rejecting "{selectedNote.title}":
              </p>
              <textarea
                id="rejectionReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                rows="3"
                placeholder="Reason for rejection..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedNote(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const reason = document.getElementById('rejectionReason').value;
                    handleStatusUpdate(selectedNote._id, 'rejected', reason);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ManageNotes;
