import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { Autoplay, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import { Award, BookOpen, Download, Sparkles } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";

import StudentInfoModal from "./StudentInfoModel";

// Banners
import MGCIBannerTwo from "../assets/Banner/MGCI-Banner-Neet.webp";
import Bannerimg from "../assets/Banner/NEET.webp";
import MGCIBrochure from "../assets/Banner/MGCIbrochure.pdf";
import UdaanBannerJee from "../assets/Banner/UDAAN-Banner-JEE.webp";
import UdaanBannerNeet from "../assets/Banner/UDAAN-Banner-NEET.webp";
import UdaanBanner from "../assets/Banner/UDAAN-Banner.webp";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const floatVariant = {
  animate: {
    y: [-6, 6, -6],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const CollabBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const Banners = [
    {
      Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
      Subheadline: "Expert-led Online Classes",
      SubheadlineO: "Dedicated Offline Programs in Indore",
      imgSrc: Bannerimg,
      brochure: MGCIBrochure,
      bannerName: "MGCI",
    },
    {
      Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
      Subheadline: "Expert-led Online Classes",
      SubheadlineO: "Dedicated Offline Programs in Indore",
      imgSrc: MGCIBannerTwo,
      brochure: MGCIBrochure,
      bannerName: "MGCI",
    },
    {
      Headline: "Crack JEE & NEET with Udaan Your Success, Our Mission",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today!!",
      imgSrc: UdaanBanner,
      brochure: false,
      bannerName: "UDAAN",
    },
    {
      Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today!!",
      imgSrc: UdaanBannerJee,
      brochure: false,
      bannerName: "UDAAN",
    },
    {
      Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today Where Aspirations Take Flight",
      imgSrc: UdaanBannerNeet,
      brochure: false,
      bannerName: "UDAAN",
    },
  ];

  const handleEnroll = (banner) => {
    setActiveBanner(banner);
    setIsOpen(true);
  };

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="py-16 px-6 relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto">

        {/* Title */}
        <div className="relative flex flex-col sm:flex-row justify-center items-center mb-14 gap-4">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-white/80 rounded-full border border-orange-200 shadow-lg">
              <Award className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">Featured Partners</span>
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Some{" "}
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                Best Picks
              </span>
              ✨
            </h2>
          </div>
        </div>

        {/* Nav Buttons */}
        <div className="absolute top-1/2 left-0 sm:-left-4 z-10 -translate-y-1/2">
          <CustomButton ref={prevRef}>
            <IoIosArrowBack size={24} className="text-gray-800" />
          </CustomButton>
        </div>

        <div className="absolute top-1/2 right-0 sm:-right-4 z-10 -translate-y-1/2">
          <CustomButton ref={nextRef}>
            <IoIosArrowForward size={24} className="text-gray-800" />
          </CustomButton>
        </div>

        {/* Swiper */}
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          className="hover:cursor-grab active:cursor-grabbing py-4"
          onSwiper={(swiper) => {
            setTimeout(() => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            });
          }}
          breakpoints={{
            640: { slidesPerView: 1, spaceBetween: 16 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
        >
          {Banners.map((banner, index) => (
            <SwiperSlide key={index}>

              {/* ⭐ FIX → SAFE SPACING TO AVOID HOVER CLIPPING */}
              <div className="py-4 px-1 h-full">

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="h-full"
                >

                  {/* CARD */}
                  <div className="relative group bg-white rounded-2xl shadow-lg hover:shadow-xl 
                  transition-all duration-300 border border-gray-200 overflow-hidden 
                  flex flex-col h-full">

                    {/* IMAGE */}
                    <div className="relative p-5 md:p-6 h-40 md:h-44 flex items-center justify-center 
                    bg-gray-50 border-b border-gray-100 overflow-hidden">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <img
                          src={banner.imgSrc}
                          alt={banner.bannerName}
                          className="rounded-xl max-h-32 md:max-h-36 w-auto object-contain"
                        />
                      </motion.div>
                    </div>

                    {/* TEXT */}
                    <div className="relative flex-1 flex flex-col px-5 py-5 text-center space-y-2">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                        {banner.Headline}
                      </h3>

                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-semibold">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        <span>{banner.Subheadline}</span>
                      </div>

                      <p className="text-xs text-gray-600 italic">{banner.SubheadlineO}</p>

                      {/* BUTTONS */}
                      <div className="mt-auto pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          onClick={() => handleEnroll(banner)}
                          className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-600 
                          text-white px-6 py-3 rounded-xl font-bold shadow-md"
                        >
                          Enroll Now →
                        </button>

                        {banner.brochure && (
                          <a
                            href={banner.brochure}
                            download
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border 
                            border-orange-300 text-orange-600 font-bold shadow-sm"
                          >
                            Prospectus
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>

              </div>
              {/* END SAFE SPACING */}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Modal */}
      {isOpen && activeBanner && (
        <StudentInfoModal
          isOpen={isOpen}
          onX={() => setIsOpen(false)}
          bannerName={activeBanner.bannerName}
        />
      )}
    </motion.section>
  );
};

export default CollabBanner;
