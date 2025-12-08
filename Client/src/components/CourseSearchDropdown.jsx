import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

const CourseSearchDropdown = ({ value, onChange, programme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const allCourses = {
    bachelors: [
      { id: "ba", label: "BA (Bachelor of Arts)" },
      { id: "bcom", label: "BCom (Bachelor of Commerce)" },
      { id: "bsc", label: "BSc (Bachelor of Science)" },
      { id: "bba", label: "BBA (Bachelor of Business Administration)" },
      { id: "btech", label: "BTech (Bachelor of Technology)" },
      { id: "bca", label: "BCA (Bachelor of Computer Applications)" },
      { id: "bds", label: "BDS (Bachelor of Dental Surgery)" },
      { id: "bhms", label: "BHMS (Bachelor of Homeopathic Medicine)" },
      { id: "bams", label: "BAMS (Bachelor of Ayurvedic Medicine)" },
      { id: "barch", label: "BArch (Bachelor of Architecture)" },
      { id: "bed", label: "BEd (Bachelor of Education)" },
      { id: "bpharm", label: "BPharm (Bachelor of Pharmacy)" },
      { id: "llb", label: "LLB (Bachelor of Laws)" },
      { id: "mbbs", label: "MBBS (Bachelor of Medicine)" },
    ],
    masters: [
      { id: "ma", label: "MA (Master of Arts)" },
      { id: "mcom", label: "MCom (Master of Commerce)" },
      { id: "msc", label: "MSc (Master of Science)" },
      { id: "mba", label: "MBA (Master of Business Administration)" },
      { id: "mtech", label: "MTech (Master of Technology)" },
      { id: "mca", label: "MCA (Master of Computer Applications)" },
      { id: "med", label: "MEd (Master of Education)" },
      { id: "mpharm", label: "MPharm (Master of Pharmacy)" },
      { id: "llm", label: "LLM (Master of Laws)" },
      { id: "md", label: "MD (Doctor of Medicine)" },
      { id: "ms", label: "MS (Master of Surgery)" },
    ],
  };

  const courses = programme === "bachelors" 
    ? allCourses.bachelors 
    : programme === "masters" 
    ? allCourses.masters 
    : [...allCourses.bachelors, ...allCourses.masters];

  const filteredCourses = searchTerm.trim()
  ? courses.filter(course => {
      const term = searchTerm.toLowerCase();
      const label = course.label.toLowerCase();
      const id = course.id.toLowerCase();

      const words = label.split(/[\s()]+/);

      const startsWithWord = words.some(word =>
        word.startsWith(term)
      );

      const containsMeaningfully = words.some(word =>
        word.includes(term) && word.length > term.length
      );

      const idMatches = id.startsWith(term);

      return startsWithWord || containsMeaningfully || idMatches;
    })
  : [];


  const selectedCourse = courses.find(c => c.id === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearchTerm("");
    onChange("all");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={selectedCourse ? selectedCourse.label : "Search for a course..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6C63FF] transition-all text-gray-700"
        />
        {(searchTerm || value !== "all") && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() && filteredCourses.length > 0 && (
        <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filteredCourses.map(course => (
            <button
              key={course.id}
              onClick={() => {
                onChange(course.id);
                setSearchTerm("");
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-[#6C63FF] hover:text-white transition-colors ${
                value === course.id ? 'bg-[#6C63FF] text-white' : 'text-gray-700'
              }`}
            >
              {course.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm.trim() && filteredCourses.length === 0 && (
        <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 text-center text-gray-500">
          No courses found
        </div>
      )}
    </div>
  );
};

export default CourseSearchDropdown;