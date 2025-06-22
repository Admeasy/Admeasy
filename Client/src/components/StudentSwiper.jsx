import { Swiper, SwiperSlide } from "swiper/react";
import useWindowSize from "./useWindowSize";
import { Navigation } from "swiper/modules";
import Boy from "../assets/Others/Student.webp"
import WA from "../assets/Icons/wa2.webp"
import { useRef } from "react";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { motion } from "framer-motion";


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";const collegeLogoMap = {
  "Medicaps": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSonOCk8kowuJudbSorlssnFY-PHFDMZ1NjA&s",
  "Sri Aurobindo Institute of Pharmacy": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt-cRd6s4RCPALLINBHWMEC1_dvFCB7SSLkw&s",
  "Sri Aurobindo Institute of Management & Studies": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwsm_PitGWwCEjKSCfDnC9gH9hld4Iu8k-Cw&s",
  "SGSITS": "https://upload.wikimedia.org/wikipedia/en/4/4b/SGSITS_Indore.png",
  "IIT Indore": "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/IITI_Logo.svg/250px-IITI_Logo.svg.png",
  "IIM Indore": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/IIM_Indore_Logo.svg/150px-IIM_Indore_Logo.svg.png",
  "IIST":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScea8JfcJLacmRtR2Ah0pQBwDHYcWKOCVsVw&s",
  "Ramanujan College": "https://ramanujancollege.ac.in/media/images/Logo_RCDU_8oecNot.original.png",
  "Shaheed Bhagat Singh College":"https://sbsc.in/wp-content/uploads/elementor/thumbs/cropped-cropped-40-INCH-X-40-INCH-FILAM-copy-2-qreld0squn1ptm38sxaqh22111vo110lip7ujxyya0.png",
  "IIPS, DAVV":"https://media.licdn.com/dms/image/v2/C4E0BAQHPCA7Yx1le7A/company-logo_200_200/company-logo_200_200/0/1630629646361/iips_davv_logo?e=2147483647&v=beta&t=xljAoXK27ElUMXqiaPyBAZwcwb55EenqpPQ7TrM9vL8",
  "DAVV":"https://media.licdn.com/dms/image/v2/C4E0BAQHPCA7Yx1le7A/company-logo_200_200/company-logo_200_200/0/1630629646361/iips_davv_logo?e=2147483647&v=beta&t=xljAoXK27ElUMXqiaPyBAZwcwb55EenqpPQ7TrM9vL8",
  "Sage University":"https://cdn.universitykart.com//Content/upload/admin/gjmrzjqu.jr1.jpg"
};
const students = [
  {
    name: "Gaurav Yadav",
    college: "Ramanujan College",
    course: "B.com Hons.",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"Delhi University",
  
  },
    {
    name: "Ritesh Kumar",
    college: "Shaheed Bhagat Singh College",
    course: "B.com prog.",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"Delhi University",
  
  },
  {  
    name: "Utkarsh Mishra",
    college: "Medicaps",
    course: "B.Tech CSE 4th Year",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"Medicaps",
  },
  {
    name: "Sagar",
    college: "Sri Aurobindo Institute of Pharmacy",
    course: "Diploma in Pharmacy",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"Sri Aurobindo Uni.",
  },
  {
    name: "Sheetal Pandey",
    college: "Sri Aurobindo Institute of Management & Studies",
    course: "BBA Plain",
    img: fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"Sri Aurobindo Uni.",
  },
  {
    name: "Tanushka Jha",
    college: "SGSITS",
    course: "BE in Electronics & Instrumentation Engineering",
    img: fallbackImage,
    showMobile:false,
    showUniversity:false,
    university:"Sri Aurobindo Uni.",
  },
  {
    name: "Avdhoot Kasture",
    college: "IIT Indore",
    course: "B.Tech in Metallurgical Engg. and Material Sciences",
    img: fallbackImage,
    showMobile:false,
    showUniversity:false,
    university:"",
  },
  {
    name: "Shiva Manoj",
    college: "IIM Indore",
    course: "IPM",
    img: fallbackImage,
    showMobile:false,
    showUniversity:false,
    university:"",
  },
  {
    name:"Vikram Singh",
    college:"IIST",
    course:" B.tech CSE",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"Aff.DAVV",
  },
  {
    name:"Vinay Yadav",
    college:"IIST",
    course:"B.tech CSE",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"Aff.DAVV",
  },
    {
    name:"Atiharsh Bhatt",
    college:"IIT Indore",
    course:"Civil Engineering",
    img:fallbackImage,
    showMobile:false,
    showUniversity:false,
    university:"",
   
  }, {
    name:"Prakash Gupta",
    college:"Sage University",
    course:"B.Tech",
    img:fallbackImage,
    showMobile:false,
    showUniversity:false,
    university:"",
  },
   {
    name:"Mohit Parmar",
    college:"DAVV",
    course:"",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
     {
    name:"Rajnish",
    college:"IIPS, DAVV",
    course:"B.Tech IT",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
];



const altWmessage = 'Hey there! I want to connect with a UG student to gain some real insights and perspective!'

const encodedAltWmessage = encodeURIComponent(altWmessage)


export default function StudentSwiper({ SwiperHeading = `Talk to UGs/Alumnis`, college }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const size = useWindowSize();
  const isMobile = size.width && size.width < 768;

  const visibleStudents = students.filter((student) =>
    isMobile ? student.showMobile : true);
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="my-5 relative bg-bg p-6 rounded-2xl shadow-md w-[90%] mx-auto">
      <h2 className="w-fit mx-auto text-center text-xl sm:text-2xl lg:text-4xl font-admeasy-extrabold text-tprimary mb-4 flex justify-evenly items-center">
        <img src={Boy} alt="WhatsApp" className="w-14 mr-0 sm:mr-4" />
        {SwiperHeading}
      </h2>

      {/* Custom Arrow Buttons */}
      <div
        ref={prevRef}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
      >
        <CustomButton><IoIosArrowBack /></CustomButton>
      </div>
      <div
        ref={nextRef}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
      >
        <CustomButton><IoIosArrowForward /></CustomButton>
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
        className="pb-2"
      >
        {visibleStudents.map((student, index) => {
          const collegeLogo = collegeLogoMap[student.college] || { fallbackImage };
          const Wmessage = `Hey there! I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective!`
          const encodedWmessage = encodeURIComponent(Wmessage)
          return (

            <SwiperSlide key={index}>
              <a
                href={`https://wa.me/919243299145?text=${encodedWmessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 relative flex flex-col items-center bg-white rounded-xl shadow-md p-4 group hover:shadow-xl transition duration-300 ease-in-out">
                <div className="">

                  {/* Image with College Logo Overlay */}
                  <div>

                    <img
                      src={student.img}
                      alt={student.name}
                      className="w-24 h-24 m-0 mx-auto rounded-full object-cover shadow-md"
                      onError={(e) => {
                        e.target.src = fallbackImage;
                      }} />
                    <div className="">
                      <img
                        draggable="false"
                        src={collegeLogo}
                        alt="College Logo"
                        className="absolute top-3 left-3 size-12 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                    </div>
                    
{/* University Show */}
{student.showUniversity ?
<div className="">
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[12px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                   {student.university}
                  </span>
     </div>
                 :""}




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
              </a>
            </SwiperSlide>

          );
        })}
        <a href={`https://wa.me/919243299145/?text=${encodedAltWmessage}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex justify-center items-center gap-2">
          {isMobile ? (
            <h3 className="text-tprimary text-center text-lg font-admeasy-bold">
              No Right Mentor Yet? WhatsApp Us for One!
            </h3>
          ) : (
            <h3 className="text-tprimary text-center text-xl font-admeasy-bold">
              Can’t find a relatable UG student to guide you?
              WhatsApp us — we’ll connect you with one
            </h3>
          )}
          <img src={WA} className="size-10" />
        </a>
      </Swiper>

    </motion.section >
  );
}