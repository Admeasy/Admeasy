import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { FileText, Loader2, Heart, Eye } from "lucide-react";
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
                const response = await fetch("/api/notes");
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
            className="my-8 relative"
        >
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 md:p-6 relative">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">
                    Suggested Notes
                </h3>

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
                        0: { slidesPerView: 1.2, spaceBetween: 12 },
                        640: { slidesPerView: 2.2, spaceBetween: 16 },
                        1024: { slidesPerView: 3.2, spaceBetween: 20 },
                    }}
                    className="pb-2"
                >
                    {notes.map((note, index) => (
                        <SwiperSlide key={note._id || index} className="h-auto">
                            <Link to={`/notes/${note._id}`} className="block h-full">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex flex-col h-[220px] p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 group relative"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                                <FileText className="w-5 h-5 text-[#9f3562]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 rounded-md text-gray-600 border border-gray-100 shrink-0 w-fit">
                                                    {note.course || note.subject || 'Note'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {formatRelativeTime(note.createdAt || note.publishedAt)}
                                        </span>
                                    </div>

                                    <h4 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 mb-1 group-hover:text-[#9f3562] transition-colors">
                                        {note.title || "Untitled Note"}
                                    </h4>

                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow leading-relaxed">
                                        {note.description || "No description provided for this note. Explore it to learn more."}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 mt-auto pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-900">{note.uploaderName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{note.likes || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{note.views || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* View All Button */}
                <div className="flex justify-center mt-4">
                    <Link to="/notes">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#9f3562]/50 transition-all duration-300 flex items-center gap-2"
                        >
                            <span>View All</span>
                            <IoIosArrowForward className="w-4 h-4" />
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default NoteSuggestionSwiper;
