import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { BookOpen, Calendar, User, ArrowRight, Sparkles } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const floatVariant = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const BlogSwiper = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("/api/blog");
        const data = await response.json();
        const latestBlogs = data.slice(0, data.length);
        setBlogs(latestBlogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleClick = (id) => {
    navigate(`/blog/${id}`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-center items-center min-h-[300px] py-14"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"
        />
        <p className="text-lg text-gray-600 font-semibold">Loading Insightful Blogs...</p>
      </motion.div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16 px-6">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg">No blogs available right now.</p>
      </div>
    );
  }

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="py-16 px-6 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-50 pointer-events-none" />
      <motion.div
        className="absolute top-20 right-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Section Heading */}
        <div className="relative flex flex-col items-center justify-center mb-12 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200/50 shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Knowledge Hub</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </motion.div>
          
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            title="Admeasy Blogs"
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3"
          >
            Latest from our{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blog
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-sm md:text-base max-w-2xl"
          >
            Insights, tips, and stories to help you navigate your college journey
          </motion.p>
        </div>

        {/* Custom Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute top-1/2 left-0 sm:-left-4 z-10 transform -translate-y-1/2"
        >
          <CustomButton ref={prevRef}>
            <IoIosArrowBack size={28} />
          </CustomButton>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute top-1/2 right-0 sm:-right-4 z-10 transform -translate-y-1/2"
        >
          <CustomButton ref={nextRef}>
            <IoIosArrowForward size={28} />
          </CustomButton>
        </motion.div>

        {/* Swiper Carousel */}
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          className="hover:cursor-grab active:cursor-grabbing"
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
            640: { slidesPerView: 1, spaceBetween: 16 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
        >
          {blogs.map((blog, index) => (
            <SwiperSlide key={blog._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => handleClick(blog._id)}
                className="cursor-pointer h-full"
              >
                <div className="group relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col overflow-hidden h-full">
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Floating decorative element */}
                  <motion.div
                    variants={floatVariant}
                    animate="animate"
                    className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl"
                  />

                  {/* Image Container */}
                  <div className="relative h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full"
                    >
                      <img
                        draggable="false"
                        src={blog.Thumbnail}
                        alt={blog.Title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/400x300/e0e7ff/4f46e5?text=Blog+Post";
                        }}
                      />
                    </motion.div>
                    
                    {/* Category badge */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm border border-white/20">
                        {blog.category}
                      </span>
                    </motion.div>
                  </div>

                  {/* Content Section */}
                  <div className="relative flex-1 flex flex-col p-6 space-y-3">
                    <motion.h3
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="text-xl font-black text-gray-900 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300"
                    >
                      {blog.Title}
                    </motion.h3>
                    
                    <div
                      className="text-sm text-gray-600 line-clamp-3 flex-1"
                      dangerouslySetInnerHTML={{ __html: blog.content }}
                    />

                    {/* Meta Info */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="font-semibold">{blog.Author}</span>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 text-gray-500 group/read"
                      >
                        <span className="font-medium">Read More</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/read:translate-x-1 transition-transform" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
};

export default BlogSwiper;