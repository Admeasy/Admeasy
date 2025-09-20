import { Swiper, SwiperSlide } from "swiper/react";
import useWindowSize from "../components/useWindowSize";
import { Navigation,Autoplay } from "swiper/modules";
import Boy from "../assets/Others/Student.webp"
// import WA from "../assets/Icons/wa2.webp"
import { useRef, useEffect, useState } from "react";
import CustomButton from "./3d-btn";
import "swiper/css";
import "swiper/css/autoplay"
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from "../context/UserContext";
import ButtonIcon from "../components/ButtonIcon";
import { toast } from "react-toastify";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
export default function StudentSwiper() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const size = useWindowSize();
  const navigate = useNavigate();
  const isMobile = size.width && size.width < 768;
  const studentImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const { user } = useUser();
  const [showLogin, setShowLogin] = useState(false);
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
      <motion.section
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="my-8 cursor-grab active:cursor-grabbing relative bg-primary p-6 rounded-2xl shadow-3d w-[90%] mx-auto">
        <h2 className="w-fit mx-auto text-center text-xl sm:text-2xl lg:text-4xl font-admeasy-extrabold text-tprimary mb-4 flex justify-evenly items-center">
          <img src={Boy} alt="WhatsApp" className="w-14 mr-0 sm:mr-4" />
          Talk to UGs/Alumnis
        </h2>
        {loading && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">Loading students...</span></div>}
        {error && <div className="w-full flex justify-center items-center py-10 text-red-500"><span className="text-2xl">{'An error occurred'}</span></div>}
        {!loading && !students.length && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">No students found</span></div>}
        {/* Custom Arrow Buttons */}
        <div
          ref={prevRef}
          className="hidden md:inline-block absolute left-2 top-1/2 sm:top-3/5 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
        >
          <CustomButton><IoIosArrowBack /></CustomButton>
        </div>
        <div
          ref={nextRef}
          className="hidden md:inline-block absolute right-2 top-1/2 sm:top-3/5 z-10 -translate-y-1/2 text-thead2 hover:text-[#3F37C9] cursor-pointer text-2xl font-bold"
        >
          <CustomButton><IoIosArrowForward /></CustomButton>
        </div>
        <Swiper
          modules={[Navigation,Autoplay]}
          spaceBetween={20}
          slidesPerView={3.8}
          loop={true}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3.8 },
          }}
          className="pb-1"
        >
          {students.map((student) => (
            <SwiperSlide key={student.name} className="h-60">
              <div
                className="h-64 mt-4 relative flex flex-col items-center bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition duration-300 ease-in-out border-none w-full">
                <div className="flex flex-col space-y-1">
                  {/* Image with College Logo Overlay */}
                  <div>
                    <img
                      src={getStudentImageUrl(student.image)}
                      className="aspect-square size-20 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                      onError={(e) => {
                        if (e.target.src !== fallbackImage) e.target.src = fallbackImage;
                      }} />
                    <div className="">
                      <img
                        draggable="false"
                        src={student.collegeLogo}
                        alt="College Logo"
                        className="aspect-square absolute top-3 left-3 size-12 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                    </div>
                    {student.university && (
                      <div className="">
                        <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[12px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                          {student.university}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Text Content */}
                  <div className="mt-1 text-center flex flex-col space-y-1.5">
                    {/* Student Name */}
                    <p className="text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>
                    {/* Highlighted College Name */}
                    <p onClick={()=>{
                      window.location.href = `/colleges/${college._id}`
                    }} 
                    className={`${student.college.length>30? 'text-[10px] md:text-[12px]':'text-[12px]'} font-admeasy-bold text-[#39365c]`}>{student.college}</p>
                    {/* Course Badge */}
                    <span className="w-fit mx-auto inline-block px-2 py-0.5 text-xs bg-gray-100 text-[#39365c] font-semibold rounded-full shadow-sm">
                      {student.course}
                    </span>
                    <div className='cursor-pointer absolute bottom-2 left-1/2 -translate-x-1/2'>
                      <ButtonIcon text={'Chat Now'} onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          const message = `Hey Team Admeasy!\n I'm ${user.name}, a ${user.course} student from ${user.institute}. I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective!`;
                          const encodedMessage = encodeURIComponent(message);
                          window.open(`https://wa.me/919243299145?text=${encodedMessage}`, "_blank");
                        } else {
                          navigate('/login')
                          setTimeout(() => {
                            if(!user){
                            toast.dark('Login to get real insights from alumni',{
                              position: 'top-center'
                            })}
                          }, 1);
                        }
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
          <div className="w-fit h-fit mt-5 mb-1.5 mx-auto">
            <Link to='/mentors'>
              <CustomButton>
                View All
              </CustomButton>
            </Link>
          </div>
        </Swiper>
      </motion.section >
    </>
  );
}