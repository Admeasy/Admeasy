// StudentSwiper.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useRef } from "react";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { RiMessage2Fill } from "react-icons/ri";
const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
const collegeLogoMap = {
  "Medicaps": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSonOCk8kowuJudbSorlssnFY-PHFDMZ1NjA&s",
  "Sri Aurobindo Institute of Pharmacy": "https://www.saip.ac.in/hubfs/Untitled%20design%20(58).png.webp",
  "Sri Aurobindo Institute of Management & Studies": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwsm_PitGWwCEjKSCfDnC9gH9hld4Iu8k-Cw&s",
  "SGITS": "https://upload.wikimedia.org/wikipedia/en/4/4b/SGSITS_Indore.png",
  "IIT Indore": "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/IITI_Logo.svg/250px-IITI_Logo.svg.png",
  "IIM Indore": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/IIM_Indore_Logo.svg/150px-IIM_Indore_Logo.svg.png",
};

const students = [
  {
    name: "Utkarsh Mishra",
    college: "Medicaps",
    course: "B.Tech CSE 4th Year",
    img: fallbackImage,
  },
  {
    name: "Sagar",
    college: "Sri Aurobindo Institute of Pharmacy",
    course: "Diploma in Pharmacy",
    img: fallbackImage,
  },
  {
    name: "Sheetal Pandey",
    college: "Sri Aurobindo Institute of Management & Studies",
    course: "BBA Plain",
    img: fallbackImage,
  },
  {
    name: "Tanushka Jha",
    college: "SGITS",
    course: "BE in Electronics & Instrumentation Engineering",
    img: fallbackImage,
  },
  {
    name: "Avdhoot Kasture",
    college: "IIT Indore",
    course: "B.Tech in Metallurgical Engg. and Material Sciences",
    img: fallbackImage,
  },
  {
    name: "Shiva Manoj",
    college: "IIM Indore",
    course: "IPM",
    img: fallbackImage,
  },
  {
    name: "Prem Pratik",
    college: "IIT Indore",
    course: "B.Tech in Space Science and Engineering",
    img: fallbackImage,
  },
];


export default function StudentSwiper({ SwiperHeading = "Talk To Students", college }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className="relative mt-15 p-6 rounded-2xl shadow-md w-[90%] mx-auto">
      <h2 className="text-center text-xl sm:text-2xl lg:text-4xl font-admeasy-extrabold text-[#080522] mb-4 flex justify-center items-center gap-2">
        {SwiperHeading} <RiMessage2Fill className="w-7 h-7 text-[#080711]" />
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
        {students.map((student, index) => {
          const collegeLogo = collegeLogoMap[student.college] || "/logos/default-logo.png";
          return (
            <SwiperSlide key={index}>
              <div className="relative flex flex-col items-center bg-white rounded-xl shadow-md p-4 group hover:shadow-xl transition duration-300 ease-in-out">

                {/* Image with College Logo Overlay */}
                <div className="">
                  <img
                    src={student.img}
                    alt={student.name}
                    className="w-24 h-24 rounded-full object-cover shadow-md"
                    onError={(e) => {
                      e.target.src = fallbackImage;
                    }}
                  />
                  <img
                    src={collegeLogo}
                    alt="College Logo"
                    className="w-10 h-10 md:w-14 md:h-14 absolute top-0 left-3 rounded-full border-2 border-white shadow-md bg-white"
                  />
                </div>

                {/* Text Content */}
                <div className="mt-4 text-center">
                  {/* Student Name */}
                  <p className="text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>

                  {/* Highlighted College Name */}
                  <p className="text-sm font-medium text-[#39365c] mt-1">{student.college}</p>

                  {/* Course Badge */}
                  <span className="inline-block mt-1 px-3 py-1 text-xs bg-gray-100 text-[#39365c] font-semibold rounded-full shadow-sm">
                    {student.course}
                  </span>
                </div>
              </div>
            </SwiperSlide>

          );
        })}
      </Swiper>


      <div className="flex justify-center mt-4">
        <CustomButton>
          View More <span className="text-lg">→</span>
        </CustomButton>
      </div>
    </div>
  );
}
