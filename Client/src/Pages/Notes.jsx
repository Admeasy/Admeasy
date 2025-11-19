import React, { useEffect, useMemo, useState } from "react";
import { FileText, User, File, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notes = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Filter options
  const universities = [
    { id: "all", label: "All Universities" },
    { id: "du", label: "DU" },
    { id: "christ", label: "Christ University" },
    { id: "chandigarh", label: "Chandigarh University" },
    { id: "manipal", label: "Manipal University" },
    { id: "amity", label: "Amity University" }
  ];

  const programmes = [
    { id: "all", label: "All Programmes" },
    { id: "bachelors", label: "Bachelors" },
    { id: "masters", label: "Masters" }
  ];

  const courses = [
    { id: "all", label: "All Courses" },
    { id: "ba", label: "BA" },
    { id: "bcom", label: "BCom" },
    { id: "bsc", label: "BSc" },
    { id: "bba", label: "BBA" },
    { id: "btech", label: "BTech" }
  ];

  // Sample data for testing (fallback when backend has no data)
  const sampleNotes = [
    {
      _id: "sample-1",
      id: "sample-1",
      title: "CA Foundation Notes By Nitish",
      description: "Complete CA Foundation course notes covering all subjects including Accounting, Law, Economics, and Quantitative Aptitude.",
      uploaderName: "Nitish Kumar",
      uploader: "Nitish Kumar",
      standard: "CA Foundation",
      pages: 245,
      isFree: true,
      price: 0,
      university: "du",
      programme: "bachelors",
      course: "bcom",
      isFeatured: true,
      likes: 0,
      views: 0,
      publishedAt: new Date().toISOString(),
    },
    {
      _id: "sample-2",
      id: "sample-2",
      title: "JEE Advanced Physics By Rahul",
      description: "Advanced level physics notes covering mechanics, thermodynamics, waves, and modern physics with solved examples.",
      uploaderName: "Rahul Mehta",
      uploader: "Rahul Mehta",
      standard: "JEE Advanced",
      pages: 312,
      isFree: false,
      price: 199,
      university: "chandigarh",
      programme: "bachelors",
      course: "btech",
      isFeatured: true,
      likes: 0,
      views: 0,
      publishedAt: new Date().toISOString(),
    },
  ];

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/notes", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load notes");
        }
        const payload = await response.json();
        if (ignore) return;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        // Use sample data if backend returns empty array (for testing)
        setNotes(data.length > 0 ? data : sampleNotes);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong while loading notes");
        // On error, use sample data for testing
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
  }, [reloadToken]);

  // Filter notes based on all criteria
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const title = note.title?.toLowerCase() ?? "";
      const description = note.description?.toLowerCase() ?? "";
      const uploader = note.uploaderName?.toLowerCase() ?? note.uploader?.toLowerCase() ?? "";
      const noteUniversity = note.university?.toLowerCase() ?? "";
      const noteProgramme = note.programme?.toLowerCase() ?? "";
      const noteCourse = note.course?.toLowerCase() ?? "";

      const matchesSearch =
        !query || title.includes(query) || description.includes(query) || uploader.includes(query);
      const matchesUniversity =
        selectedUniversity === "all" || noteUniversity === selectedUniversity;
      const matchesProgramme =
        selectedProgramme === "all" || noteProgramme === selectedProgramme;
      const matchesCourse = selectedCourse === "all" || noteCourse === selectedCourse;
      
      return matchesSearch && matchesUniversity && matchesProgramme && matchesCourse;
    });
  }, [notes, searchQuery, selectedUniversity, selectedProgramme, selectedCourse]);

  const popularNotes = useMemo(() => {
    return notes.filter((note) => note.isFeatured || note.isPopular || (note.likes ?? 0) > 50);
  }, [notes]);

  // Filter Radio Component
  const FilterSection = ({ title, options, selected, onChange }) => (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${
              selected === option.id
                ? "bg-[#6C63FF] text-white border-[#6C63FF] shadow-lg"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#6C63FF] hover:shadow-md"
            }`}
          >
            <input
              type="radio"
              name={title}
              value={option.id}
              checked={selected === option.id}
              onChange={() => onChange(option.id)}
              className="hidden"
            />
            <span className="font-medium text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  // Notes Card Component
  const NotesCard = ({ note, compact = false }) => {
    const noteId = note._id || note.id;
    const isFree = note.isFree ?? true;
    return (
      <div
        onClick={() => noteId && navigate(`/notes/${noteId}`)}
        className={`bg-white cursor-pointer rounded-2xl shadow-3d hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.17)] transition-all border border-gray-100 ${
          compact ? "p-4 min-w-[320px]" : "p-6 mb-6"
        }`}
      >
        <div className={`flex gap-4 ${compact ? "flex-col" : ""}`}>
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <div className={`${compact ? "w-full h-32" : "w-24 h-24"} rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3A32CF] flex items-center justify-center`}>
              <FileText className={`${compact ? "w-16 h-16" : "w-12 h-12"} text-white drop-shadow-md`} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <h2 className={`${compact ? "text-lg" : "text-xl"} font-bold text-gray-900 mb-1`}>
              {note.title}
            </h2>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-2">
              {note.description}
            </p>
            
            {/* Price and Stats */}
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                  isFree
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {isFree
                  ? "FREE"
                  : typeof note.price === "number"
                  ? `₹${note.price}`
                  : "Paid"}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-3">
                <span>❤️ {note.likes ?? 0}</span>
                <span className="flex items-center gap-1">👁️ {note.views ?? 0}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!compact && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 text-white bg-black px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {note.uploaderName || note.uploader || "Unknown uploader"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <File className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {note.pages ? `${note.pages} pages` : "Pages N/A"}
                </span>
              </div>
            </div>

            <div className="text-sm font-semibold px-3 py-1.5 rounded-lg shadow-3d bg-red-50 text-red-700 border border-red-200">
              {note.standard || "General"}
            </div>
          </div>
        )}
      </div>
    );
  };

  // MAIN PAGE
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Notes Library
        </h1>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes by title, description, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#6C63FF] focus:outline-none shadow-3d text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-3d mb-8 border border-gray-100">
          <FilterSection
            title="Select Your University"
            options={universities}
            selected={selectedUniversity}
            onChange={setSelectedUniversity}
          />
          <FilterSection
            title="Select Programme"
            options={programmes}
            selected={selectedProgramme}
            onChange={setSelectedProgramme}
          />
          <FilterSection
            title="Select Course"
            options={courses}
            selected={selectedCourse}
            onChange={setSelectedCourse}
          />
        </div>

        {/* Most Popular Slider */}
        {popularNotes.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Most Popular</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {popularNotes.map((note) => (
                <div key={note._id || note.id} className="snap-start">
                  <NotesCard note={note} compact={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Notes Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Notes ({filteredNotes.length})
          </h2>
          {error && (
            <div className="text-center py-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-3d mb-6">
              <p className="font-semibold mb-2">We couldn&apos;t load the notes.</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => setReloadToken((prev) => prev + 1)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-500 transition"
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-3d">
              <p className="text-gray-500 text-lg">Loading notes…</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-3d">
              <p className="text-gray-500 text-lg">No notes found matching your criteria</p>
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

      {/* Custom scrollbar styling */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Notes;