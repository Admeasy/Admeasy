import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { GraduationCap, MapPin, Star, Building, TrendingUp } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const CollegeSuggestionSwiper = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                setLoading(true);
                // Using main colleges route with limit
                const response = await fetch("/api/colleges?limit=10");
                if (!response.ok) throw new Error("Failed to fetch colleges");

                const data = await response.json();

                if (data.colleges && Array.isArray(data.colleges)) {
                    setColleges(data.colleges);
                } else if (Array.isArray(data)) {
                    setColleges(data.slice(0, 10));
                } else {
                    setColleges([]);
                }

            } catch (error) {
                console.error("Error fetching colleges:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchColleges();
    }, []);

    if (loading) {
        return null;
    }

    if (colleges.length === 0) {
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
                    Top Colleges
                </h3>

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
                    {colleges.map((college, index) => (
                        <SwiperSlide key={college._id || index} className="h-auto">
                            <Link to={`/colleges/${college._id}`} className="block h-full">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex flex-col h-[260px] p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 group relative"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-200 shrink-0">
                                            {college.logo ? (
                                                <img src={college.logo} alt={college.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            ) : (
                                                <GraduationCap className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Rating Badge */}
                                        {college.rating?.overall ? (
                                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 mt-1">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-[11px] font-bold text-yellow-700">{college.rating.overall}</span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <h4 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-[#9f3562] transition-colors">
                                        {college.name || "College Name"}
                                    </h4>

                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{college.location || 'Location Not Available'}</span>
                                    </div>

                                    {/* Tags Row */}
                                    <div className="flex items-center flex-wrap gap-2 mb-3">
                                        {college.type && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 flex items-center gap-1 w-fit">
                                                <Building className="w-3 h-3" />
                                                {college.type}
                                            </span>
                                        )}
                                        {college.establishedYear && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-100 w-fit">
                                                Est. {college.establishedYear}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-50 w-full overflow-hidden">
                                        {college.package?.average ? (
                                            <div className="flex items-center justify-between gap-2 overflow-hidden w-full">
                                                <span className="text-[11px] text-gray-500 font-medium shrink-0">Avg Package</span>
                                                <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100 truncate">
                                                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{college.package.average}</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-400 flex items-center justify-center p-1 bg-gray-50 rounded-lg border border-gray-100 truncate">
                                                Placement info unavailable
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className="flex justify-center mt-4">
                    <Link to="/colleges">
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

export default CollegeSuggestionSwiper;
