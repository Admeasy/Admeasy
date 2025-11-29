import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMentor } from '../context/MentorContext';
import CourseSearchDropdown from "../components/CourseSearchDropdown";
import FilterSection from "../components/FilterSection";
import NotesCard from "../components/NotesCard";

const Notes = () => {
  const navigate = useNavigate();
  const { mentor, isLoading: mentorLoading } = useMentor();
  
  // Filter states
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Filter options
  const universities = [
    { id: "all", label: "All Universities" },
    { id: "du", label: "Delhi University" },
    { id: "mu", label: "Mumbai University" },
    { id: "davu", label: "Devi Ahilya Vishwavidyalaya" },
    { id: "rgpv", label: "RGPV Bhopal" },
    { id: "iit", label: "IIT (All Campuses)" },
    { id: "iim", label: "IIM (All Campuses)" },
    { id: "lu", label: "Lucknow University" },
    { id: "manipal", label: "Manipal University" },
    { id: "sage", label: "Sage University" },
    { id: "medicaps", label: "Medicaps University" },
    { id: "oriental", label: "Oriental University" },
    { id: "pu", label: "Panjab University" },
  ];

  const programmes = [
    { id: "all", label: "All Programmes" },
    { id: "bachelors", label: "Bachelors" },
    { id: "masters", label: "Masters" }
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
      likes: 156,
      views: 2341,
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
      likes: 423,
      views: 5672,
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
        let data = Array.isArray(payload?.data) ? payload.data : [];
        // Use sample data if backend returns empty array (for testing)
        if (data.length === 0) {
          data = sampleNotes;
        }
        // Sort notes: most popular first (by likes + views, then by most recent)
        data.sort((a, b) => {
          const aPopularity = (a.likes ?? 0) + (a.views ?? 0);
          const bPopularity = (b.likes ?? 0) + (b.views ?? 0);
          if (bPopularity !== aPopularity) {
            return bPopularity - aPopularity;
          }
          const aDate = new Date(a.publishedAt || a.createdAt || 0);
          const bDate = new Date(b.publishedAt || b.createdAt || 0);
          return bDate - aDate;
        });
        setNotes(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong while loading notes");
        if (!ignore) {
          const sortedSamples = [...sampleNotes].sort((a, b) => {
            const aPopularity = (a.likes ?? 0) + (a.views ?? 0);
            const bPopularity = (b.likes ?? 0) + (b.views ?? 0);
            if (bPopularity !== aPopularity) {
              return bPopularity - aPopularity;
            }
            const aDate = new Date(a.publishedAt || 0);
            const bDate = new Date(b.publishedAt || 0);
            return bDate - aDate;
          });
          setNotes(sortedSamples);
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
    return notes.filter((note) => {
      const noteUniversity = note.university?.toLowerCase() ?? "";
      const noteProgramme = note.programme?.toLowerCase() ?? "";
      const noteCourse = note.course?.toLowerCase() ?? "";

      const matchesUniversity =
        selectedUniversity === "all" || noteUniversity === selectedUniversity;
      const matchesProgramme =
        selectedProgramme === "all" || noteProgramme === selectedProgramme;
      const matchesCourse = selectedCourse === "all" || noteCourse === selectedCourse;
      
      return matchesUniversity && matchesProgramme && matchesCourse;
    });
  }, [notes, selectedUniversity, selectedProgramme, selectedCourse]);

  const popularNotes = useMemo(() => {
    return notes.filter((note) => note.isFeatured || note.isPopular || (note.likes ?? 0) > 50);
  }, [notes]);

  // Reset course when programme changes
  useEffect(() => {
    if (selectedProgramme !== "all") {
      setSelectedCourse("all");
    }
  }, [selectedProgramme]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-[90%] lg:w-[95%] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Notes Library
        </h1>

        {/* Search and Add Note Section */}
        <div className="mb-8  max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Animated Search Button */}
            <div className="flex-1">
              <button
                onClick={() => navigate('/notes-search')}
                className="w-full relative group"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-[#6C63FF] transition-colors" />
                  <div className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 group-hover:border-[#6C63FF] transition-all shadow-lg text-left bg-white">
                    <span className="text-gray-400 animate-pulse">
                      Search notes by title, course, or tags...
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Add Note Button - Only for Mentors */}
            <div className="w-full sm:w-max flex justify-center">
            {mentor && !mentorLoading && (
              <button
                onClick={() => navigate('/add-note')}
                className="flex items-center gap-2 bg-[#6C63FF] text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:bg-[#5a52e8] transition-all duration-200 hover:shadow-xl"
              >
                <Plus size={20} />
                Add Note
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-100">
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
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Search Course</h3>
            <CourseSearchDropdown 
              value={selectedCourse}
              onChange={setSelectedCourse}
              programme={selectedProgramme}
            />
          </div>
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
            <div className="text-center py-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-lg mb-6">
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
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500 text-lg">Loading notes…</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
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
