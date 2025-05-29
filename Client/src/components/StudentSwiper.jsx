// StudentSwiper.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useRef, useEffect } from "react";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";

import "swiper/css/navigation";

const students = [
  {
    name: "Mohit Verma",
    img: "https://cdn.pixabay.com/photo/2024/03/15/19/51/ai-generated-8635685_960_720.png",
  },
  { name: "Ruchi Patidar", img: "/images/student2.jpg" },
  { name: "Riya Verma", img: "/images/student3.jpg" },
  { name: "Ankit Sharma", img: "/images/student4.jpg" },
  { name: "Megha Sinha", img: "/images/student5.jpg" },
  { name: "Yash Jain", img: "/images/student6.jpg" },
];

export default function StudentSwiper({ SwiperHeading = "Talk To Students" }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className="relative bg-[#F2F4F9] p-6 rounded-2xl shadow-md w-[90%] mx-auto">
      <h2 className="text-center text-xl sm:text-2xl font-bold text-[#5A4BFF] mb-4">
        {SwiperHeading}
      </h2>

      {/* Custom Arrow Buttons */}
      <div
        ref={prevRef}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-[#5A4BFF] hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
      >
        <CustomButton><IoIosArrowBack /></CustomButton>
      </div>
      <div
        ref={nextRef}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-[#5A4BFF] hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
      >
        <CustomButton> <IoIosArrowForward /> </CustomButton>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={20}
        slidesPerView={3}
        loop={true}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        breakpoints={{
          0: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="pb-6"
      >
        {students.map((student, index) => (
          <SwiperSlide key={index}>
            <div className="flex flex-col items-center bg-white rounded-xl shadow-lg p-4 cursor-pointer">
              <img
                src={student.img}
                alt={student.name}
                className="w-20 h-20 rounded-full object-cover shadow-md"
              />
              <p className="mt-2 text-sm font-medium text-gray-800">
                {student.name}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex justify-center mt-4">
        <CustomButton>
          View More <span className="text-lg">→</span>
        </CustomButton>
      </div>
    </div>
  );
}
