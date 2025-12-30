import { Swiper, SwiperSlide } from "swiper/react";
import useWindowSize from "../components/useWindowSize";
import { Navigation, Autoplay } from "swiper/modules";
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
import { useMentor } from "../context/MentorContext";
import ButtonIcon from "../components/ButtonIcon";
import { toast } from "react-toastify";
import { MessageCircle, GraduationCap, Sparkles } from "lucide-react";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const floatVariant = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

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
  const { mentor } = useMentor()

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
        const res = await fetch('/api/colleges?page=1&limit=9999');
        const data = await res.json();
        const colleges = data.colleges || [];
        let allStudents = [];
        let dustudents = [];

        colleges.forEach(college => {
          if (college.students && college.students.length > 0) {
            college.students.forEach(student => {
              if (
                college.affiliation === 'Delhi University' ||
                college.name.includes('Delhi University') ||
                college.name.includes('DU')
              ) {
                dustudents.push({
                  ...student,
                  college: college.name,
                  collegeLogo: college.logo || '',
                  university: college.affiliation || 'Delhi University',
                });
              } else {
                allStudents.push({
                  ...student,
                  college: college.name,
                  collegeLogo: college.logo || '',
                  university: college.affiliation,
                });
              }
            });
          }
        });

        const shuffledAllStudents = shuffleArray(allStudents).slice(0, 5);
        const shuffledDUStudents = shuffleArray(dustudents);

        shuffledDUStudents.forEach(student => {
          shuffledAllStudents.unshift(student);
        });

        setStudents(shuffledAllStudents);
      } catch (error) {
        console.error(error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    getStudents();
  }, []);

  return (
    <>
      <motion.section
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="my-12 cursor-grab active:cursor-grabbing relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60 pointer-events-none" />
        <motion.div
          className="absolute top-10 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl w-[92%] mx-auto border border-white/50">
          {/* Enhanced Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50"
            >
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Connect with Experts</span>
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3"
            >
              Talk to UGs/Alumni
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto"
            >
              Get real insights from students who've been there. Connect directly with current students and alumni for authentic college experiences.
            </motion.p>
          </div>

          {loading && (
            <div className="w-full flex flex-col justify-center items-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
              <span className="text-lg text-gray-600 mt-4">Loading amazing mentors...</span>
            </div>
          )}
          
          {error && (
            <div className="w-full flex justify-center items-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
                <span className="text-red-600">Unable to load mentors. Please try again.</span>
              </div>
            </div>
          )}
          
          {!loading && !students.length && (
            <div className="w-full flex justify-center items-center py-16">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
                <span className="text-gray-600">No students found at the moment</span>
              </div>
            </div>
          )}

          {/* Custom Arrow Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:inline-block absolute left-4 top-1/2 z-10 -translate-y-1/2"
          >
            <CustomButton ref={prevRef}>
              <IoIosArrowBack size={24} />
            </CustomButton>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:inline-block absolute right-4 top-1/2 z-10 -translate-y-1/2"
          >
            <CustomButton ref={nextRef}>
              <IoIosArrowForward size={24} />
            </CustomButton>
          </motion.div>

          {/* Swiper Carousel */}
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={3.8}
            loop={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            breakpoints={{
              0: { slidesPerView: 1.2, spaceBetween: 16 },
              640: { slidesPerView: 2.2, spaceBetween: 20 },
              1024: { slidesPerView: 3.8, spaceBetween: 24 },
            }}
            className="pb-2"
          >
            {students.map((student, index) => (
              <SwiperSlide key={student.name + index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="h-auto mt-6"
                >
                  <div className="relative group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-5 border border-gray-100 overflow-hidden">
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* University badge with enhanced styling */}
                    {student.university && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-3 right-3 z-20"
                      >
                        <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-[9px] sm:text-[10px] md:text-[11px] px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider shadow-lg backdrop-blur-sm border border-white/20">
                          {student.university}
                        </span>
                      </motion.div>
                    )}

                    <div className="relative flex flex-col items-center space-y-3">
                      {/* Enhanced Image Section */}
                      <div className="relative">
                        <motion.div
                          variants={floatVariant}
                          animate="animate"
                          className="relative"
                        >
                          {/* Glowing ring effect */}
                          <motion.div
                            className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300"
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          
                          <div className="relative">
                            <img
                              src={getStudentImageUrl(student.image)}
                              className="relative aspect-square w-24 h-24 rounded-full object-cover shadow-xl ring-4 ring-white group-hover:ring-blue-200 transition-all duration-300"
                              onError={(e) => {
                                if (e.target.src !== fallbackImage) e.target.src = fallbackImage;
                              }}
                            />
                            
                            {/* College Logo with better positioning */}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="absolute -bottom-2 -right-2"
                            >
                              <div className="bg-white p-1.5 rounded-full shadow-lg ring-2 ring-gray-100">
                                <img
                                  draggable="false"
                                  src={student.collegeLogo}
                                  alt="College Logo"
                                  className="w-10 h-10 object-contain rounded-full"
                                />
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Enhanced Text Content */}
                      <div className="relative text-center space-y-2 w-full px-2">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                          {student.name}
                        </h3>
                        
                        <p
                          onClick={() => {
                            window.location.href = `/colleges/${student.college._id}`
                          }}
                          className={`${student.college.length > 30 ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[13px]'} font-semibold text-gray-600 hover:text-blue-600 cursor-pointer transition-colors line-clamp-2`}
                        >
                          {student.college}
                        </p>
                        
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold rounded-full shadow-sm border border-blue-100"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          {student.course}
                        </motion.span>
                      </div>

                      {/* Enhanced CTA Button */}
                      <div className="w-full pt-2">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user || mentor) {
                                const sender = user || mentor;
                                const message = `Hey Team Admeasy!\nI'm ${sender.name}, ${sender.course ? `a ${sender.course} student` : "a mentor"} from ${sender.institute || "Admeasy"}. I'd love to connect with ${student.name} from ${student.college} to gain some real insights!`;
                                const encodedMessage = encodeURIComponent(message);
                                window.open(`https://wa.me/919243299145?text=${encodedMessage}`, "_blank");
                                return;
                              }
                              navigate("/login");
                              setTimeout(() => {
                                if (!user && !mentor) {
                                  toast.dark("Login to get real insights from alumni", {
                                    position: "top-center",
                                  });
                                }
                              }, 1);
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                          >
                            <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            <span>Chat Now</span>
                          </button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* View All Button with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-fit mx-auto mt-8"
          >
            <Link to='/mentors'>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <CustomButton>
                  <span className="flex items-center gap-2">
                    View All Mentors
                    <IoIosArrowForward />
                  </span>
                </CustomButton>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}