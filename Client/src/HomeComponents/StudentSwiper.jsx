import { Swiper, SwiperSlide } from "swiper/react";
import useWindowSize from "../components/useWindowSize";
import { Navigation } from "swiper/modules";
import Boy from "../assets/Others/Student.webp"
// import WA from "../assets/Icons/wa2.webp"
import { useRef, useEffect, useState } from "react";
import CustomButton from "./3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { motion } from "framer-motion";
import StudentInfoModel from "../components/StudentInfoModel";
import { Link } from 'react-router-dom'


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
const altWmessage = 'Hey there! I am unable to find a relatable UG student to guide me! Can you please connect me with one?'
const encodedAltWmessage = encodeURIComponent(altWmessage)

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudentSwiper() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const size = useWindowSize();
  const isMobile = size.width && size.width < 768;
  const studentImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [stream, setStream] = useState("");
  const [percentage, setPercentage] = useState("");
  const [redirect, setRedirect] = useState(null);
  const [showModal, setShowModal] = useState(false);

  //  Form Cancel Handler Function
  const cancelHandler = () => {
    setShowModal(false);

    setTimeout(() => {
      window.open(`https://wa.me/919243299145?text=${redirect}`, "_blank");
    }, 10); // give enough time for user to notice the toast
  }
  const onXclick = () => {
    setShowModal(false)
  }

  function getStudentImageUrl(imageName) {
    if (imageName) {
      // Find the first key in studentImages that includes the imageName
      const entry = Object.entries(studentImages).find(([key]) =>
        key.includes(imageName)
      );
      return entry ? entry[1] : fallbackImage;
    } else {
      return fallbackImage
    }
  }

  useEffect(() => {
    async function getStudents() {
      try {
        setLoading(true);
        const res = await fetch('/api/colleges/');
        const colleges = await res.json();

        // Flatten all students, attaching college info
        let allStudents = [];
        let dustudents = []
        colleges.forEach(college => {
          if (college.students && college.students.length > 0) {
            college.students.forEach(student => {
              if (college.affiliation === 'Delhi University' || college.name.includes('Delhi University') || college.name.includes('DU')) {
                dustudents.push({
                  ...student,
                  college: college.name,
                  collegeLogo: college.logo || '',
                  university: college.affiliation || 'Delhi University'
                })
              } else {
                allStudents.push({
                  ...student,
                  college: college.name,
                  collegeLogo: college.logo || '',
                  university: college.affiliation
                });
              }
            });
          }
        });

        // Shuffle and pick 5 students
        let shuffledAllStudents = shuffleArray(allStudents).slice(0, 5);
        const shuffledDUStudents = shuffleArray(dustudents);

        // Add DU students to the beginning of shuffled array
        shuffledDUStudents.forEach(student => {
          shuffledAllStudents.unshift(student);
        })

        setStudents(shuffledAllStudents);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(error);
        console.log(error);
      }
    }

    getStudents()
  }, [])

  return (
    <>
      <StudentInfoModel
        isOpen={showModal}
        redirect={redirect}
        onClose={cancelHandler}
        onX={onXclick}
        setShowModal={setShowModal} />
      <motion.section
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="my-8 relative bg-primary p-6 rounded-2xl shadow-3d w-[90%] mx-auto">
        <h2 className="w-fit mx-auto text-center text-xl sm:text-2xl lg:text-4xl font-admeasy-extrabold text-tprimary mb-4 flex justify-evenly items-center">
          <img src={Boy} alt="WhatsApp" className="w-14 mr-0 sm:mr-4" />
          Talk to UGs/Alumni
        </h2>
        {loading && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">Loading students...</span></div>}
        {error && <div className="w-full flex justify-center items-center py-10 text-red-500"><span className="text-2xl">{'An error occurred'}</span></div>}
        {!loading && !students.length && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">No students found</span></div>}
        {/* Custom Arrow Buttons */}
        <div
          ref={prevRef}
          className="absolute left-2 top-1/2 sm:top-3/5 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
        >
          <CustomButton><IoIosArrowBack /></CustomButton>
        </div>
        <div
          ref={nextRef}
          className="absolute right-2 top-1/2 sm:top-3/5 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
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
          className="pb-1"
        >
          {students.map((student, index) => (
            <SwiperSlide key={index} className="h-60">
              <button
                className="h-58 cursor-pointer mt-4 relative flex flex-col items-center bg-white rounded-xl shadow-md p-4 group hover:shadow-xl transition duration-300 ease-in-out border-none w-full"
                onClick={() => {
                  const message = `Hey there! I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective about ${student.course}!`;
                  setRedirect(message);
                  setShowModal(true);
                }}
              >
                <div className="flex flex-col space-y-1">
                  {/* Image with College Logo Overlay */}
                  <div>
                    <img
                      src={getStudentImageUrl(student.image)}
                      className="size-24 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                      onError={(e) => {
                        e.target.src = fallbackImage;
                      }} />
                    <div className="">
                      <img
                        draggable="false"
                        src={student.collegeLogo}
                        alt="College Logo"
                        className="absolute top-3 left-3 size-12 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                    </div>
                    {student.university ? (
                      <div className="">
                        <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[12px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                          {student.university}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {/* Text Content */}
                  <div className="mt-4 text-center flex flex-col space-y-1.5">
                    {/* Student Name */}
                    <p className="text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>
                    {/* Highlighted College Name */}
                    <p className="text-sm font-medium text-[#39365c]">{student.college}</p>
                    {/* Course Badge */}
                    <span className="w-fit mx-auto inline-block px-2 py-0.5 text-xs bg-gray-100 text-[#39365c] font-semibold rounded-full shadow-sm">
                      {student.course}
                    </span>
                  </div>
                </div>
              </button>
            </SwiperSlide>
          ))}
          <div className="w-fit h-fit mt-5 mb-1.5 mx-auto">
            <Link to='/mentors'>
              <CustomButton>
                View All
              </CustomButton>
            </Link>
          </div>
          {/* <a href={`https://wa.me/919243299145/?text=${encodedAltWmessage}`} target="_blank" rel="noopener noreferrer" className="w-fit h-fit mx-auto mt-4 flex justify-center items-center gap-2">
            {isMobile ? (
              <h3 className="text-tprimary text-center text-lg font-admeasy-bold">
                No Right Mentor Yet? WhatsApp Us for One!
              </h3>
            ) : (
              <h3 className="text-tprimary text-center text-xl font-admeasy-bold">
                Can't find a relatable UG student to guide you?
                WhatsApp us — we'll connect you with one
              </h3>
            )}
            <img src={WA} className="size-10" />
          </a> */}
        </Swiper>
      </motion.section >
    </>
  );
}