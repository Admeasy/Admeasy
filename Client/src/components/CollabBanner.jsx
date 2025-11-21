import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import StudentInfoModal from "./StudentInfoModel";

// Banners
import MGCIBannerTwo from "../assets/Banner/MGCI-Banner-Neet.webp";
import Bannerimg from "../assets/Banner/NEET.webp";
import MGCIBrochure from "../assets/Banner/MGCIbrochure.pdf";
import UdaanBannerJee from "../assets/Banner/UDAAN-Banner-JEE.webp";
import UdaanBannerNeet from "../assets/Banner/UDAAN-Banner-NEET.webp";
import UdaanBanner from "../assets/Banner/UDAAN-Banner.webp";

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
    <section className=" rounded-2xl py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50 to-blue-100 relative">
      {/* Section Heading */}
      <div className="relative flex flex-col sm:flex-row justify-center items-center mb-12 md:mb-14 max-w-7xl mx-auto">
        <h2 className="text-xl text-center md:text-2xl lg:text-3xl font-admeasy-extrabold text-gray-900">
          Some <span className="text-blue-600">Best Picks✨</span>
        </h2>
        <a
          href="https://forms.gle/zShtayAGBWxthf6z6"
          className="sm:absolute right-0 text-sm sm:text-base mt-4 sm:mt-0 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
        >
          Get Listed Here
        </a>
      </div>

      {/* Custom Navigation Buttons */}
      <div className="absolute top-1/2 left-2 sm:left-4 z-10 -translate-y-1/2">
        <CustomButton
          ref={prevRef}
          className="p-3 rounded-full bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg hover:scale-110 transition"
        >
          <IoIosArrowBack size={22} className="text-gray-800" />
        </CustomButton>
      </div>

      <div className="absolute top-1/2 right-2 sm:right-4 z-10 -translate-y-1/2">
        <CustomButton
          ref={nextRef}
          className="p-3 rounded-full bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg hover:scale-110 transition"
        >
          <IoIosArrowForward size={22} className="text-gray-800" />
        </CustomButton>
      </div>

      {/* Swiper Carousel */}
      <div className="mx-auto sm:p-4">
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          className="hover:cursor-grab active:cursor-grabbing py-4"
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
            1024: { slidesPerView: 4, spaceBetween: 24 },
          }}
        >
          {Banners.map((banner, index) => (
            <SwiperSlide key={index}>
              <div className="mb-6 group bg-white/90 backdrop-blur-md rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:-translate-y-2 flex flex-col overflow-hidden max-w-sm mx-auto h-full">
                {/* Image Section */}
                <div className="p-6 md:p-7 h-44 md:h-48 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
                  <img
                    src={banner.imgSrc}
                    alt={banner.bannerName}
                    className="rounded-xl max-h-40 md:max-h-44 w-auto object-cover transform group-hover:scale-110 transition duration-500"
                    draggable="false"
                  />
                </div>

                {/* Text Section */}
                <div className="flex-1 flex flex-col px-5 py-6 md:px-6 md:py-7 text-center">
                  <h3 className="text-lg md:text-xl font-extrabold text-gray-900 mb-3 md:mb-4 leading-snug">
                    {banner.Headline}
                  </h3>

                  <p className="text-sm md:text-base text-gray-600 font-medium tracking-wide mb-2">
                    {banner.Subheadline}
                  </p>

                  <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-7 italic">
                    {banner.SubheadlineO}
                  </p>

                  {/* Buttons Row */}
                  <div className="mt-auto flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    {/* Enroll Button */}
                    <button
                      onClick={() => handleEnroll(banner)}
                      className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-red-500 to-red-700 text-white px-6 md:px-7 py-2.5 md:py-3 rounded-xl font-semibold shadow-[0_4px_20px_rgba(255,0,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,0,0,0.4)] hover:scale-[1.04] active:scale-95 transition-all"
                    >
                      Enroll Now
                    </button>

                    {/* Prospectus Button */}
                    {banner.brochure && (
                      <a
                        href={banner.brochure}
                        download={`${banner.bannerName}-Brochure.pdf`}
                        className="w-full sm:w-auto cursor-pointer px-6 md:px-7 py-2.5 md:py-3 rounded-xl bg-white text-blue-700 font-semibold border border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition"
                      >
                        Prospectus
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
    </section>
  );
};

export default CollabBanner;