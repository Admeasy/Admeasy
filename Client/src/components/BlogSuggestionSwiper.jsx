import React, { useEffect, useState, useRef } from"react";
import { useNavigate, Link } from"react-router-dom";
import { Swiper, SwiperSlide } from"swiper/react";
import { Navigation, Autoplay } from"swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from"react-icons/io";
import CustomButton from"../HomeComponents/3d-btn";
import { motion } from"framer-motion";
import { BookOpen, Loader2 } from"lucide-react";
import"swiper/css";
import"swiper/css/navigation";
import"swiper/css/autoplay";

const BlogSuggestionSwiper = () => {
 const [blogs, setBlogs] = useState([]);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();
 const prevRef = useRef(null);
 const nextRef = useRef(null);

 useEffect(() => {
 const fetchBlogs = async () => {
 try {
 setLoading(true);
 const response = await fetch("/api/blogs");
 if (!response.ok) throw new Error("Failed to fetch blogs");

 const data = await response.json();

 // Ensure data is an array (based on route which returns res.json(blogs))
 if (Array.isArray(data)) {
 // Limit to 10 blogs
 setBlogs(data.slice(0, 10));
 } else {
 setBlogs([]);
 }

 } catch (error) {
 console.error("Error fetching blogs:", error);
 } finally {
 setLoading(false);
 }
 };

 fetchBlogs();
 }, []);

 if (loading) {
 return null;
 }

 if (blogs.length === 0) {
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
 Latest Blogs
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
 {blogs.map((blog, index) => (
 <SwiperSlide key={blog._id || index} className="h-auto">
 <Link to={`/blogs/${blog._id}`} className="block h-full">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.3, delay: index * 0.05 }}
 className="flex flex-col h-[220px] bg-white rounded-xl hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
 >
 {/* Thumbnail */}
 <div className="h-32 w-full bg-gray-200 relative">
 {blog.Thumbnail ? (
 <img src={blog.Thumbnail} alt={blog.Title} className="w-full h-full object-cover"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
 <BookOpen className="w-8 h-8"/>
 </div>
 )}
 </div>

 <div className="p-3 flex flex-col flex-grow">
 <span className="text-[10px] font-semibold text-[#9f3562] uppercase tracking-wider mb-1">
 {blog.category ||'Blog'}
 </span>
 <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
 {blog.Title ||"Untitled Blog"}
 </h4>
 <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500">
 <span>{blog.readingTime ?`${blog.readingTime} min read`:'5 min read'}</span>
 </div>
 </div>
 </motion.div>
 </Link>
 </SwiperSlide>
 ))}
 </Swiper>

 <div className="flex justify-center mt-4">
 <Link to="/blogs">
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className="px-6 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#9f3562]/50 transition-all duration-300 flex items-center gap-2"
 >
 <span>View All</span>
 <IoIosArrowForward className="w-4 h-4"/>
 </motion.button>
 </Link>
 </div>
 </div>
 </motion.div>
 );
};

export default BlogSuggestionSwiper;
