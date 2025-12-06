import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMentor } from "../context/MentorContext";
import CourseSearchDropdown from "../components/CourseSearchDropdown";
import FilterSection from "../components/FilterSection";
import NotesCard from "../components/NotesCard";
import SEO from "../components/SEO";

const Notes = () => {
  const navigate = useNavigate();
  const { mentor, isLoading: mentorLoading } = useMentor();

  // Filter states
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Backend driven notes
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // Filter options
  const universities = [
    { id: "all", label: "All Universities" },
    { id: "delhi university", label: "Delhi University" },
    { id: "mumbai university", label: "Mumbai University" },
    { id: "devi ahilya vishwavidyalaya", label: "Devi Ahilya Vishwavidyalaya" },
    { id: "rgpv", label: "RGPV Bhopal" },
    { id: "iit", label: "IIT (All Campuses)" },
    { id: "iim", label: "IIM (All Campuses)" },
    { id: "lucknow university", label: "Lucknow University" },
    { id: "manipal university", label: "Manipal University" },
    { id: "sage university", label: "Sage University" },
    { id: "medicaps university", label: "Medicaps University" },
    { id: "oriental university", label: "Oriental University" },
    { id: "panjab university", label: "Panjab University" },
  ];

  const programmes = [
    { id: "all", label: "All Programmes" },
    { id: "bachelors", label: "Bachelors" },
    { id: "masters", label: "Masters" },
  ];

  // Fetch Notes
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

        // Sort notes: popular → newest
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
        setNotes([]); // No fallback, no fake data
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchNotes();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [reloadToken]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const noteUniversity = note.university?.toLowerCase() ?? "";
      const noteProgramme = note.programme?.toLowerCase() ?? "";
      const noteCourse = note.course?.toLowerCase() ?? "";

      const matchesUniversity =
        selectedUniversity === "all" || noteUniversity === selectedUniversity;

      const matchesProgramme =
        selectedProgramme === "all" || noteProgramme === selectedProgramme;

      const matchesCourse =
        selectedCourse === "all" || noteCourse === selectedCourse;

      return matchesUniversity && matchesProgramme && matchesCourse;
    });
  }, [notes, selectedUniversity, selectedProgramme, selectedCourse]);

  const popularNotes = useMemo(() => {
    return notes.filter((note) => note.isFeatured || (note.likes ?? 0) > 50);
  }, [notes]);

  // Reset course when programme changes
  useEffect(() => {
    if (selectedProgramme !== "all") {
      setSelectedCourse("all");
    }
  }, [selectedProgramme]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <SEO
        title="Study Notes Library - Premium Notes for Students | Admeasy"
        description="Access premium study notes for CA Foundation, JEE, NEET, and university courses. Download notes from verified mentors and excel in your exams."
        keywords="study notes, CA Foundation notes, JEE notes, NEET notes, university notes, exam preparation, study materials"
        url="https://admeasy.in/notes"
      />

      <div className="w-[90%] lg:w-[95%] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Notes Library
        </h1>

        {/* Search & Add Note Section */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <button
                onClick={() => navigate("/notes-search")}
                className="w-full relative group"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-[#6C63FF] transition-colors" />
                <div className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 group-hover:border-[#6C63FF] transition-all shadow-lg text-left bg-white">
                  <span className="text-gray-400 animate-pulse">
                    Search notes by title, course, or tags...
                  </span>
                </div>
              </button>
            </div>

            {/* Add Note (Mentor Only) */}
            {!mentorLoading && mentor && (
              <button
                onClick={() => navigate("/add-note")}
                className="flex items-center gap-2 bg-[#6C63FF] text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:bg-[#5a52e8] transition"
              >
                <Plus size={20} />
                Add Note
              </button>
            )}
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

        {/* Popular Notes Slider */}
        {popularNotes.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Most Popular
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {popularNotes.map((note) => (
                <div key={note._id} className="snap-start">
                  <NotesCard note={note} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Notes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Notes ({filteredNotes.length})
          </h2>

          {error && (
            <div className="text-center py-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-lg mb-6">
              <p className="font-semibold mb-2">We couldn&apos;t load the notes.</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => setReloadToken((p) => p + 1)}
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
                <NotesCard key={note._id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hide scrollbars */}
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