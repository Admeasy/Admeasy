// src/components/UniversityCard.jsx
import React from "react";
import { FaMapMarkerAlt, FaStar, FaBookmark } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

export default function UniversityCard({
  name = "DTU - Delhi Technological University",
  location = "Delhi",
  rank = "#30 NIRF",
  coursesCount = 20,
  rating = 4.3,
  fees = "₹5.32 L - 7.4 L",
  brochureColor = "bg-emerald-500",
}) {
  return (
    <div className="p-6 bg-[#f3ecf6] rounded-3xl">
      <div className="relative w-80 bg-white rounded-2xl p-5 border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        {/* Logo */}
        <div className="absolute top-10 right-4 w-11 h-11 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm z-10 overflow-hidden">
          <img
            src='https://upload.wikimedia.org/wikipedia/en/a/ae/Devi_Ahilya_Vishwavidyalaya_Logo.png'
            alt="University Logo"
            className="w-7 h-7 object-contain"
          />
        </div>

        {/* Title */}
        <h3 className="text-[#1e63d6] text-[16px] font-semibold leading-tight">
          {name}
        </h3>

        {/* Location + Rank */}
        <div className="mt-3 flex items-center gap-3 text-gray-500 text-[13px]">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <span className="text-emerald-500 font-semibold">{rank}</span>
        </div>

        <hr className="my-3 border-gray-200" />

        {/* Middle content */}
        <div className="flex justify-between text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-500">Courses Offered</div>
            <div className="mt-2">
              <a className="text-sky-500 font-semibold underline cursor-pointer">
                {coursesCount} courses
              </a>
              <span className="ml-2 text-amber-400 font-semibold flex items-center gap-1">
                <FaStar className="inline-block" /> {rating}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">Total Fees Range</div>
            <div className="mt-2 font-semibold">{fees}</div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-4 flex items-center justify-between">
          <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center">
            <FaBookmark className="text-slate-600 w-[18px] h-[18px]" />
          </button>

          <button
            className={`${brochureColor} text-white px-4 py-2 rounded-full inline-flex items-center gap-2`}
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm font-semibold">Brochure</span>
          </button>
        </div>
      </div>
    </div>
  );
}