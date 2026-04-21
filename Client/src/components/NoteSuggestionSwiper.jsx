import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { FileText, Heart } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

// ✅ Import the missing function
import { resolveNoteAuthor } from "../utils/noteAuthor";

const NoteSuggestionSwiper = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (let i = 0; i < intervals.length; i++) {
      const interval = Math.floor(seconds / intervals[i].seconds);
      if (interval >= 1) {
        return `${interval} ${intervals[i].label}${interval !== 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/notes");

        if (!response.ok) throw new Error("Failed to fetch notes");

        const data = await response.json();

        // Handle different possible API response structures
        let fetchedNotes = [];
        if (data.success && Array.isArray(data.data)) {
          fetchedNotes = data.data;
        } else if (Array.isArray(data)) {
          fetchedNotes = data;
        }

        // Limit to 10 notes for suggestions
        setNotes(fetchedNotes.slice(0, 10));
      } catch (error) {
        console.error("Error fetching suggested notes:", error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Don't render anything if still loading or no notes
  if (loading || notes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-6 relative"
    >
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            Suggested Notes
          </h3>
          <Link
            to="/notes"
            className="text-sm font-semibold text-[#9f3562] hover:underline transition-all"
          >
            See all →
          </Link>
        </div>

        {/* Custom Navigation Buttons */}
        <div className="hidden md:block absolute left-4 top-1/2 z-10 -translate-y-1/2">
          <CustomButton ref={prevRef} className="!w-9 !h-9 !px-0 !min-w-0">
            <IoIosArrowBack size={16} />
          </CustomButton>
        </div>

        <div className="hidden md:block absolute right-4 top-1/2 z-10 -translate-y-1/2">
          <CustomButton ref={nextRef} className="!w-9 !h-9 !px-0 !min-w-0">
            <IoIosArrowForward size={16} />
          </CustomButton>
        </div>

        {/* Swiper */}
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={16}
          slidesPerView={2.5}
          loop={false}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onSwiper={(swiper) => {
            setTimeout(() => {
              if (swiper.params.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }
            }, 100);
          }}
          breakpoints={{
            0: { slidesPerView: 2.2, spaceBetween: 8 },
            480: { slidesPerView: 3.2, spaceBetween: 10 },
            768: { slidesPerView: 4.2, spaceBetween: 12 },
            1024: { slidesPerView: 5.2, spaceBetween: 14 },
          }}
          className="pb-2"
        >
          {notes.map((note, index) => {
            const author = resolveNoteAuthor(note);   // ← Now properly imported

            return (
              <SwiperSlide key={note._id || index} className="h-auto">
                <Link to={`/notes/${note._id}`} className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="flex flex-col h-[138px] p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100 group"
                  >
                    {/* Course Tag */}
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{note.course || note.standard || "Study Note"}</span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2 mb-2 flex-1">
                      {note.title || "Untitled Note"}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {note.description || "No description available"}
                    </p>

                    {/* Footer - Author + Stats */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      {/* Author Info */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (author.profilePath) navigate(author.profilePath);
                        }}
                        className={`flex items-center gap-2 flex-1 min-w-0 text-left ${
                          author.profilePath
                            ? "cursor-pointer hover:text-[#9f3562]"
                            : "cursor-default"
                        }`}
                      >
                        <img
                          src={author.image || "/avatar.png"}
                          alt={author.displayName}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-xs truncate">
                            {author.displayName}
                          </p>
                          {author.username && (
                            <p className="text-[10px] text-[#9f3562] font-medium truncate">
                              @{author.username}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Likes */}
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{note.likes || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </motion.div>
  );
};

export default NoteSuggestionSwiper;