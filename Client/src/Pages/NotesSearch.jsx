import React, { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotesCard from "../components/NotesCard";

const NotesSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sampleNotes = [
    {
      _id: "sample-1",
      title: "CA Foundation Notes By Nitish",
      description: "Complete CA Foundation course notes covering all subjects.",
      uploaderName: "Nitish Kumar",
      standard: "CA Foundation",
      pages: 245,
      isFree: true,
      likes: 156,
      views: 2341,
      tags: ["CA", "Foundation", "Accounting", "Law"],
      course: "bcom",
    },
    {
      _id: "sample-2",
      title: "JEE Advanced Physics By Rahul",
      description: "Advanced level physics notes with solved examples.",
      uploaderName: "Rahul Mehta",
      standard: "JEE Advanced",
      pages: 312,
      isFree: false,
      price: 199,
      likes: 423,
      views: 5672,
      tags: ["JEE", "Physics", "Advanced", "Engineering"],
      course: "btech",
    },
    {
  _id: "bad-1",
  title: "CA Foundation Law Notes",
  description: "Law notes",
  uploaderName: "Test User",
  standard: "CA Foundation",
  pages: 120,
  isFree: true,
  likes: 10,
  views: 100,
  tags: "CA Foundation Law",   //  String form hai instead of array
  course: "bcom",
},

  ];

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/notes", {
          signal: controller.signal,
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load notes");
        }
        const payload = await response.json();
        if (ignore) return;
        let data = Array.isArray(payload?.data) ? payload.data : [];
        if (data.length === 0) {
          data = sampleNotes;
        }
        setNotes(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong");
        if (!ignore) {
          setNotes(sampleNotes);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchNotes();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note => {
      const title = note.title?.toLowerCase() ?? "";
      const course = note.course?.toLowerCase() ?? "";
      const tags = Array.isArray(note.tags)? note.tags.map(t => String(t).toLowerCase()).join(" ") : "";
      return title.includes(query) || course.includes(query) || tags.includes(query);
    });
  }, [notes, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 text-gray-700 hover:text-[#9f3562] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Notes</span>
          </button>

          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, course, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#9f3562] focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 shadow-lg text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {searchQuery ? `Search Results (${filteredNotes.length})` : `All Notes (${notes.length})`}
        </h2>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 text-lg">Loading notes…</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 text-lg">
              {searchQuery ? "No notes found matching your search" : "No notes available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <NotesCard key={note._id || note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesSearch;
