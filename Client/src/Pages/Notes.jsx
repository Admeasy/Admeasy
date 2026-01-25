import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, FileText, Filter, TrendingUp, BookOpen, Sparkles } from "lucide-react";
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
        setNotes([]);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 px-4 py-8 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <SEO
        title="Study Notes Library - Premium Notes for Students | Admeasy"
        description="Access premium study notes for CA Foundation, JEE, NEET, and university courses. Download notes from verified mentors and excel in your exams."
        keywords="study notes, CA Foundation notes, JEE notes, NEET notes, university notes, exam preparation, study materials"
        url="https://admeasy.in/notes"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#9f3562] to-[#b8447a] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Notes Library
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Access premium study notes from verified mentors and excel in your exams
          </p>
        </div>

        {/* Search & Add Note Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
            {/* Search Button */}
            <div className="flex-1">
              <button
                onClick={() => navigate("/notes-search")}
                className="w-full group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9f3562] to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full px-5 py-4 bg-white rounded-2xl border-2 border-gray-200 group-hover:border-[#9f3562] transition-all duration-300 shadow-sm group-hover:shadow-lg">
                  <Search className="w-5 h-5 text-gray-400 group-hover:text-[#9f3562] transition-colors flex-shrink-0" />
                  <span className="text-gray-400 text-left flex-1">
                    Search notes by title, course, or tags...
                  </span>
                  <div className="hidden sm:block px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 group-hover:bg-[#9f3562]/10 group-hover:text-[#9f3562] transition-colors">
                    ⌘K
                  </div>
                </div>
              </button>
            </div>

            {/* Add Note (Mentor Only) */}
            {!mentorLoading && mentor && (
              <button
                onClick={() => navigate("/add-note")}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Add Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Card - Horizontal Scrollable */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-[#9f3562]" />
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          </div>

          {/* University Filter - Horizontal Scroll */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Select Your University</h3>
            <div className="relative">
              {/* Scroll gradient indicators */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {universities.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedUniversity(option.id)}
                    className={`
                      snap-start flex-shrink-0 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-2 whitespace-nowrap
                      ${
                        selectedUniversity === option.id
                          ? "bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white border-transparent shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#9f3562]/30 hover:bg-gray-50"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Programme Filter - Horizontal Scroll */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Select Programme</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {programmes.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedProgramme(option.id)}
                  className={`
                    flex-shrink-0 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-2 whitespace-nowrap
                    ${
                      selectedProgramme === option.id
                        ? "bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white border-transparent shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#9f3562]/30 hover:bg-gray-50"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course Search */}
          <div className="mb-0">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Search Course</h3>
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
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#9f3562]" />
                <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="relative">
              {/* Gradient overlays for scroll indication */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white to-transparent pointer-events-none z-10 hidden sm:block"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white to-transparent pointer-events-none z-10 hidden sm:block"></div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-1 scroll-smooth">
                {popularNotes.map((note) => (
                  <div key={note._id} className="snap-start flex-shrink-0 w-[320px] sm:w-[360px]">
                    <NotesCard note={note} compact />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ALL NOTES SECTION ================= */}
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#9f3562]" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                All Notes
              </h2>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-xs sm:text-sm font-semibold">
                {filteredNotes.length}
              </span>
            </div>
          </div>

          {/* ================= ERROR STATE ================= */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-8 text-center shadow-sm mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl">⚠️</span>
              </div>

              <p className="font-semibold text-red-900 text-base sm:text-lg mb-1">
                We couldn&apos;t load the notes
              </p>
              <p className="text-red-700 text-sm mb-5">
                {error}
              </p>

              <button
                onClick={() => setReloadToken((p) => p + 1)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ================= LOADING STATE ================= */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">
                Loading notes...
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No notes found
              </h3>
              <p className="text-gray-500 text-sm sm:text-base mb-6">
                Try adjusting your filters or search criteria
              </p>

              <button
                onClick={() => {
                  setSelectedUniversity("all");
                  setSelectedProgramme("all");
                  setSelectedCourse("all");
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white rounded-xl font-medium shadow-md hover:shadow-xl transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* ================= NOTES GRID ================= */
            <div className="flex flex-col gap-4">
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