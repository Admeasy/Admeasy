import React, { useEffect, useState, useRef } from"react";
import { useNavigate, Link } from"react-router-dom";
import { Swiper, SwiperSlide } from"swiper/react";
import { Navigation, Autoplay } from"swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from"react-icons/io";
import CustomButton from"../HomeComponents/3d-btn";
import { motion } from"framer-motion";
import { Users, Loader2, UserCheck } from"lucide-react";
import { toast } from"react-toastify";
import { useUser } from"../context/UserContext";
import { useMentor } from"../context/MentorContext";
import"swiper/css";
import"swiper/css/navigation";
import"swiper/css/autoplay";

const SpaceSuggestionSwiper = () => {
 const [spaces, setSpaces] = useState([]);
 const [loading, setLoading] = useState(true);
 const [joiningSpaces, setJoiningSpaces] = useState({});
 const navigate = useNavigate();
 const prevRef = useRef(null);
 const nextRef = useRef(null);
 const { user } = useUser();
 const { mentor } = useMentor();
 const isAuthed = Boolean(user || mentor);

 useEffect(() => {
 const fetchSpaces = async () => {
 try {
 setLoading(true);
 const response = await fetch("/api/spaces/discover", {
 credentials:"include",
 });
 if (!response.ok) throw new Error("Failed to fetch spaces");

 const data = await response.json();

 if (!data.success) {
 throw new Error(data.message ||"Failed to fetch spaces");
 }

 // Filter out spaces user is already a member of
 let filteredSpaces = data.spaces || [];

 // Filter to only show non-member spaces
 filteredSpaces = filteredSpaces.filter(space => !space.isMember);

 // Limit to 10 spaces
 filteredSpaces = filteredSpaces.slice(0, 10);

 setSpaces(filteredSpaces);
 } catch (error) {
 console.error("Error fetching spaces:", error);
 } finally {
 setLoading(false);
 }
 };

 fetchSpaces();
 }, [isAuthed]);

 const handleJoin = async (e, spaceId) => {
 e.stopPropagation();

 if (!isAuthed) {
 toast.info("Log in to join spaces");
 navigate("/login");
 return;
 }

 if (joiningSpaces[spaceId]) return;

 setJoiningSpaces((prev) => ({ ...prev, [spaceId]: true }));

 try {
 const response = await fetch(`/api/spaces/${spaceId}/join`, {
 method:"POST",
 credentials:"include",
 });

 const data = await response.json();

 if (data.success) {
 toast.success("Joined space");
 // Update the space to show as joined
 setSpaces((prev) =>
 prev.map((s) =>
 s._id === spaceId ? { ...s, isMember: true, membersCount: (s.membersCount || 0) + 1 } : s
 )
 );
 // Navigate to the space
 navigate(`/spaces/${spaceId}`);
 } else {
 throw new Error(data.message ||"Failed to join space");
 }
 } catch (error) {
 console.error("Error joining space:", error);
 toast.error(error.message ||"Failed to join space");
 } finally {
 setJoiningSpaces((prev) => ({ ...prev, [spaceId]: false }));
 }
 };

 if (loading) {
 return (
 <div className="flex justify-center items-center py-8">
 <Loader2 className="w-6 h-6 animate-spin text-[#9f3562]"/>
 </div>
 );
 }

 if (spaces.length === 0) {
 return null;
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="my-8 relative"
 >
 <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-5 relative">
 <div className="flex items-center justify-between mb-4 px-1">
 <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
 Suggested Spaces
 </h3>
 <Link 
 to="/spaces"
 className="text-xs font-semibold text-[#9f3562] hover:underline transition-all"
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
 0: { slidesPerView: 3.2, spaceBetween: 8 },
 480: { slidesPerView: 4.2, spaceBetween: 10 },
 768: { slidesPerView: 5.2, spaceBetween: 12 },
 1024: { slidesPerView: 6.5, spaceBetween: 14 },
 }}
 className="pb-0.5"
 >
 {spaces.map((space, index) => {
 const isLoading = joiningSpaces[space._id] || false;
 const isMember = space.isMember || false;

 return (
 <SwiperSlide key={space._id || index} className="h-auto">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.3, delay: index * 0.05 }}
 className="flex flex-col items-center justify-between h-[105px] sm:h-[130px] p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-50 transition-all relative"
 >
 {/* Space Logo - Clickable to navigate */}
 <Link
 to={`/spaces/${space._id}`}
 className="flex-shrink-0 cursor-pointer"
 >
 <div className="relative mb-1">
 {space.logo ? (
 <img
 src={space.logo}
 alt={space.name ||"Space"}
 className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-100 shadow-sm"
 onError={(e) => {
 e.target.style.display ="none";
 e.target.nextSibling.style.display ="flex";
 }}
 />
 ) : null}
 <div
 className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 ${space.logo ?"hidden":""
 }`}
 >
 <span className="text-[10px] font-bold text-slate-400">
 {space.name?.[0]?.toUpperCase() ||"S"}
 </span>
 </div>
 </div>
 </Link>

 {/* Name and Members Count - Clickable to navigate */}
 <Link
 to={`/spaces/${space._id}`}
 className="flex-1 flex flex-col items-center justify-center text-center w-full"
 >
 <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-800 line-clamp-1">
 {space.name ||"Space"}
 </h4>
 </Link>

 {/* Join Button */}
 <button
 onClick={(e) => handleJoin(e, space._id)}
 disabled={isLoading || isMember}
 className={`w-full py-1 px-1 rounded-md text-[8px] sm:text-[9px] font-bold transition-all disabled:opacity-50 ${isMember
 ?"bg-gray-100 text-gray-400"
 :"bg-[#9f3562] text-white hover:bg-[#862b52]"
 }`}
 >
 {isLoading ? (
 <Loader2 className="w-2 h-2 animate-spin mx-auto"/>
 ) : (
 <span>{isMember ?'Joined':'Join'}</span>
 )}
 </button>
 </motion.div>
 </SwiperSlide>
 );
 })}
 </Swiper>


 </div>
 </motion.div>
 );
};

export default SpaceSuggestionSwiper;
