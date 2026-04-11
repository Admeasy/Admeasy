import React, { useEffect, useState, useRef } from"react";
import { useNavigate, Link } from"react-router-dom";
import { Swiper, SwiperSlide } from"swiper/react";
import { Navigation, Autoplay } from"swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from"react-icons/io";
import CustomButton from"../HomeComponents/3d-btn";
import { motion } from"framer-motion";
import { GraduationCap, MapPin, Star, Building, TrendingUp } from"lucide-react";
import"swiper/css";
import"swiper/css/navigation";
import"swiper/css/autoplay";

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
 <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-5 relative overflow-hidden">
 <div className="flex items-center justify-between mb-4 px-1">
 <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
 Top Colleges
 </h3>
 <Link 
 to="/colleges"
 className="text-xs font-semibold text-[#9f3562] hover:underline transition-colors"
 >
 See all
 </Link>
 </div>

 <div className="hidden md:block absolute left-2 top-1/2 z-10 -translate-y-1/2">
 <CustomButton ref={prevRef} className="!w-8 !h-8 !px-0 !min-w-0">
 <IoIosArrowBack size={14} />
 </CustomButton>
 </div>

 <div className="hidden md:block absolute right-2 top-1/2 z-10 -translate-y-1/2">
 <CustomButton ref={nextRef} className="!w-8 !h-8 !px-0 !min-w-0">
 <IoIosArrowForward size={14} />
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
 0: { slidesPerView: 3.2, spaceBetween: 8 },
 480: { slidesPerView: 4.2, spaceBetween: 10 },
 768: { slidesPerView: 5.2, spaceBetween: 12 },
 1024: { slidesPerView: 6.5, spaceBetween: 14 },
 }}
 className="pb-0.5"
 >
 {colleges.map((college, index) => (
 <SwiperSlide key={college._id || index} className="h-auto">
 <Link to={`/colleges/${college._id}`} className="block h-full">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.3, delay: index * 0.05 }}
 className="flex flex-col items-center justify-between h-[110px] sm:h-[135px] p-2 bg-white rounded-lg border border-gray-100 hover:border-pink-50 transition-all relative"
 >
 <div className="relative mb-1">
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
 {college.logo ? (
 <img src={college.logo} alt={college.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
 ) : (
 <GraduationCap className="w-4 h-4 text-gray-300"/>
 )}
 </div>
 </div>

 <div className="flex-1 flex flex-col items-center justify-center text-center w-full px-0.5 mt-0.5">
 <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">
 {college.name ||"College"}
 </h4>
 </div>

 <div className="w-full mt-1.5 pt-1.5 border-t border-gray-50">
 <div className="flex items-center justify-center gap-1">
 <button className="w-full py-1 px-1 rounded-md text-[8px] sm:text-[9px] font-bold bg-[#9f3562] text-white transition-all hover:bg-[#862b52]">
 View
 </button>
 </div>
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

export default CollegeSuggestionSwiper;
