import React, { useState, useEffect } from 'react';
import { X, Search, FileText, BookOpen, Filter } from 'lucide-react';
// Assuming NotesCard is in the same folder. If not, adjust path (e.g., '../components/NotesCard')
import NotesCard from './NotesCard'; 

export default function NotesLibraryModal({ isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Notes when Modal Opens
  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      // Disable background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Fetching Global Notes
      const response = await fetch('/api/notes', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Handle different data structures (array directly or data.data)
        const notesList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setNotes(notesList);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Filter Notes based on Search Term
  const filteredNotes = notes.filter((note) => {
    const term = searchTerm.toLowerCase();
    return (
      note.title?.toLowerCase().includes(term) ||
      note.subject?.toLowerCase().includes(term) ||
      note.course?.toLowerCase().includes(term) ||
      note.university?.toLowerCase().includes(term)
    );
  });

  // If modal is closed, return nothing
  if (!isOpen) return null;

  return (
    // Overlay (Background Dim)
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* --- Header --- */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#9f3562]/10 text-[#9f3562] rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Notes</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Search Bar --- */}
        <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200">
          <div className="relative max-w-xl mx-auto md:mx-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by title, subject, or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
              autoFocus
            />
          </div>
        </div>

        {/* --- Content Area (Scrollable) --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <div className="w-10 h-10 border-4 border-[#9f3562]/30 border-t-[#9f3562] rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-500">Loading notes...</p>
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
              {filteredNotes.map((note) => (
                <div key={note._id} className="h-full">
                  {/* Reusing existing NotesCard */}
                  <NotesCard note={note} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-70">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-gray-400" size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No notes found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm">
                {searchTerm 
                  ? `We couldn't find any notes matching "${searchTerm}"` 
                  : "The library is currently empty."}
              </p>
            </div>
          )}
        </div>

        {/* --- Footer (Optional info) --- */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 text-xs text-center text-gray-400">
          Showing {filteredNotes.length} results
        </div>

      </div>
    </div>
  );
}