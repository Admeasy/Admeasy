import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { FileText, Loader2, Heart, Eye } from "lucide-react";
import { resolveNoteAuthor } from "../utils/noteAuthor";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

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
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        for (let i = 0; i < intervals.length; i++) {
            const interval = Math.floor(seconds / intervals[i].seconds);
            if (interval >= 1) {
                return `${interval} ${intervals[i].label}${interval !== 1 ? 's' : ''} ago`;
            }
        }
        return "Just now";
    };

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/notes", { credentials: "include" });
                if (!response.ok) throw new Error("Failed to fetch notes");

                const data = await response.json();

                if (data.success && data.data) {
                    // Limit to 10 notes
                    setNotes(data.data.slice(0, 10));
                } else {
                    // Fallback if data structure is different or empty
                    setNotes([]);
                }

            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    if (loading) {
        return null; // Don't show loader for suggestions to avoid clutter
    }

    if (notes.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="my-4 sm:my-6 relative"
        >
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-5 relative">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                        Suggested Notes
                    </h3>
                    <Link
                        to="/notes"
                        className="text-xs font-semibold text-[#9f3562] hover:underline transition-all"
                    >
                        See all
                    </Link>
                </div>

                {/* Custom Navigation Buttons */}
                <div className="hidden md:block absolute left-2 top-1/2 z-10 -translate-y-1/2">
                    <CustomButton ref={prevRef}>
                        <IoIosArrowBack size={20} />
                    </CustomButton>
                </div>

                <div className="hidden md:block absolute right-2 top-1/2 z-10 -translate-y-1/2">
                    <CustomButton ref={nextRef}>
                        <IoIosArrowForward size={20} />
                    </CustomButton>
                </div>

                {/* Swiper Carousel */}
                <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={16}
                    slidesPerView={2.5}
                    loop={false}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
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
                        });
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2.8, spaceBetween: 8 },
                        480: { slidesPerView: 3.5, spaceBetween: 10 },
                        768: { slidesPerView: 4.5, spaceBetween: 12 },
                        1024: { slidesPerView: 5.5, spaceBetween: 14 },
                    }}
                    className="pb-0.5"
                >
                    {notes.map((note, index) => (
                        <SwiperSlide key={note._id || index} className="h-auto">
                            <Link to={`/notes/${note._id}`} className="block h-full">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex flex-col h-[110px] sm:h-[135px] p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100 group relative"
                                >
                                    <div className="flex items-center gap-1.5 mb-1 text-[8px] text-gray-400">
                                        <FileText className="w-2.5 h-2.5" />
                                        <span className="truncate">{note.course || 'Note'}</span>
                                    </div>

                                    <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight line-clamp-2 mt-0.5 flex-1">
                                        {note.title || "Untitled"}
                                    </h4>

<<<<<<< HEAD
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow leading-relaxed">
                                        {note.description || "No description provided for this note. Explore it to learn more."}
                                    </p>

                                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium mt-auto pt-3 border-t border-gray-50">
                                        {(() => {
                                            const a = resolveNoteAuthor(note);
                                            return (
                                                <button
                                                    type="button"
                                                    className={`flex items-center gap-2 min-w-0 text-left ${
                                                        a.profilePath
                                                            ? "text-gray-900 hover:text-[#9f3562] cursor-pointer"
                                                            : "text-gray-700 cursor-default"
                                                    }`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (a.profilePath) navigate(a.profilePath);
                                                    }}
                                                >
                                                    <img
                                                        src={a.image}
                                                        alt=""
                                                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-gray-100 flex-shrink-0 bg-gray-50"
                                                    />
                                                    <span className="flex flex-col min-w-0">
                                                        <span className="font-bold text-gray-900 truncate text-xs leading-tight">
                                                            {a.displayName}
                                                        </span>
                                                        {a.username ? (
                                                            <span className="text-[10px] text-[#9f3562] font-semibold truncate">
                                                                @{a.username}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                </button>
                                            );
                                        })()}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5 text-gray-400" />
=======
                                    <div className="flex items-center justify-between text-[8px] font-medium text-gray-400 mt-1 pt-1.5 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center gap-0.5 text-blue-500">
                                                <Heart className="w-2 h-2" />
>>>>>>> 32930030 (Implemented Study and Masti mode)
                                                <span>{note.likes || 0}</span>
                                            </div>
                                        </div>
                                        <span>{note.uploaderName || 'Author'}</span>
                                    </div>
                                </motion.div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </motion.div>
    );
};

export default NoteSuggestionSwiper;
