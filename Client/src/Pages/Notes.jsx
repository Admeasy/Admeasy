import React from "react";
import { FileText, User, File } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notes = () => {
  // SAMPLE DATA 
  const notes = [
    {
      id: 1,
      title: "CA Foundation Notes By Nitish",
      description:
        "Complete CA Foundation course notes covering all subjects including Accounting, Law, Economics, and Quantitative Aptitude.",
      uploader: "Nitish Kumar",
      standard: "CA Foundation",
      pages: 245,
      isFree: true,
      price: null,
    },
    {
      id: 2,
      title: "NEET Biology Chapter-wise Notes",
      description:
        "Comprehensive biology notes for NEET preparation with diagrams, important questions, and previous year analysis.",
      uploader: "Dr. Priya Sharma",
      standard: "Class 12",
      pages: 189,
      isFree: false,
      price: 149,
    },
    {
      id: 3,
      title: "JEE Advanced Physics By Rahul",
      description:
        "Advanced level physics notes covering mechanics, thermodynamics, waves, and modern physics with solved examples.",
      uploader: "Rahul Mehta",
      standard: "JEE Advanced",
      pages: 312,
      isFree: false,
      price: 199,
    },
    {
      id: 4,
      title: "Class 10 Mathematics Full Course",
      description:
        "Complete mathematics notes for CBSE Class 10 with formulas, theorems, and step-by-step problem solving techniques.",
      uploader: "Amit Singh",
      standard: "Class 10 CBSE",
      pages: 156,
      isFree: true,
      price: null,
    },
    {
      id: 5,
      title: "CS Executive Company Law Notes",
      description:
        "Detailed notes on Company Law for CS Executive students with case studies, amendments, and practical examples.",
      uploader: "Adv. Sneha Kapoor",
      standard: "CS Executive",
      pages: 278,
      isFree: false,
      price: 89,
    },
  ];

  const navigate = useNavigate()

  // ---- Notes Card Component (INSIDE SAME FILE) ----
  const NotesCard = ({ note }) => (
    <div 
    onClick={()=> navigate('/notes/:id')}
    className="bg-white cursor-pointer rounded-2xl shadow-3d hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.17)] transition-all p-6 mb-8 border border-gray-100">
      <div className="flex gap-5">
        
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3A32CF] flex items-center justify-center">
            <FileText className="w-12 h-12 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {note.title}
          </h2>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {note.description}
          </p>
        </div>

        {/* Price */}
        <span
          className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-3d self-start ${
            note.isFree
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {note.isFree ? "FREE" : `₹${note.price}`}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 text-white bg-black px-3 py-1.5 rounded-lg ">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{note.uploader}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <File className="w-4 h-4" />
            <span className="font-medium text-sm">Pages: {note.pages}</span>
          </div>
        </div>

        <div className="text-sm font-semibold px-3 py-1.5 rounded-lg shadow-3d bg-red-50 text-red-700 border border-red-200">
          {note.standard}
        </div>
      </div>
    </div>
  );

  // ---- MAIN PAGE ----
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">
        Notes Library
      </h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {notes.map((note) => (
            <div 
            className="lol-Nothing-to-add"
            onClick={navigate('/notes/:id')}
            > 
                <NotesCard key={note.id} note={note} />
            </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
