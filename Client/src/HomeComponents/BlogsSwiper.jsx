import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No blogs available right now.
      </div>
    );
  }

  return (
    <section className="py-14 px-6 bg-gradient-to-br from-white to-blue-50 relative">
      {/* Section Heading */}
      <div className="relative flex flex-col sm:flex-row justify-center items-center mb-10">
        <h2 title="Admeasy Blogs" className="text-xl text-center md:text-2xl lg:text-3xl font-admeasy-extrabold text-gray-900">
          Latest from our <span className="text-blue-600">Blog</span>
        </h2>
      </div>

      {/* Custom Navigation Buttons */}
      <div className="absolute top-1/2 left-2 z-10 transform -translate-y-1/2 cursor-pointer text-blue-600 hover:text-blue-800 transition">
        <CustomButton ref={prevRef}>
          <IoIosArrowBack size={28} />
        </CustomButton>
      </div>
      <div className="absolute top-1/2 right-2 z-10 transform -translate-y-1/2 cursor-pointer text-blue-600 hover:text-blue-800 transition">
        <CustomButton ref={nextRef}>
          <IoIosArrowForward size={28} />
        </CustomButton>
      </div>

      {/* Swiper Carousel */}
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={7}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        className=" hover:cursor-grab active:cursor-grabbing"
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
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {blogs.map((blog) => (
          <SwiperSlide key={blog._id}>
            <div
              onClick={() => handleClick(blog._id)}
              className="group mb-8 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 flex flex-col overflow-hidden max-w-sm mx-auto h-max "
            >
              {/* Image */}
              <div className="h-56 flex items-center justify-center bg-gray-50 overflow-hidden">
                <img
                  draggable="false"
                  src={`https://admeasy.in${blog.Thumbnail}`}
                  alt={blog.Title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x250?text=No+Image";
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
                  {blog.Title}
                </h3>
                <p
                  className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                ></p>

                {/* Meta Info */}
                <div className="mt-auto flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    ✍️ {blog.Author}
                  </span>
                  <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-medium">
                    {blog.category}
                  </span>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default BlogSwiper;