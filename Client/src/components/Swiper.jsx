import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useState, useEffect, useRef } from "react";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { motion } from "framer-motion";


const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const duStudents = [
    {
        name: "Gaurav Yadav",
        college: "Ramanujan College",
        course: "B.Com Hons.",
        img: fallbackImage,
        showMobile: true,
        showUniversity: true,
        university: "Delhi University",

    },
    {
        name: "Ritesh Kumar",
        college: "Shaheed Bhagat Singh College",
        course: "B.Com Prog.",
        img: fallbackImage,
        showMobile: true,
        showUniversity: true,
        university: "Delhi University",

    },
]

const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
}

export default function StudentSwiper({ college }) {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const [students, setStudents] = useState([])
    const studentImages = import.meta.glob('../assets/Students/*', { eager: true, query: '?url', import: 'default' });

    useEffect(() => {
        setStudents(college.students);
    }, [college])


    if (!college || college.length === 0 || !students || students.length === 0) {
        return (
            <h2 className="text-2xl">
                No students found
            </h2>
        );
    }

    return (
        <motion.section
            variants={fadeUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative p-6 rounded-2xl w-full mx-auto">
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
                {students.map((student, index) => {
                    const Wmessage = `Hey there! I'd love to connect with ${student.name} from ${college.name} who is pursuing ${student.course} to gain some real insights and perspective!`
                    const encodedWmessage = encodeURIComponent(Wmessage)
                    console.log(student.image)
                    return (

                        <SwiperSlide key={index}>
                            <a
                                href={`https://wa.me/919243299145?text=${encodedWmessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex flex-col items-evenly bg-white rounded-xl shadow-md p-4 m-3 group hover:shadow-xl transition duration-300 ease-in-out">
                                {/* Image */}
                                <div>

                                    <img
                                        src={studentImages[`../assets/Students/${student.image}`] || fallbackImage}
                                        className="w-24 h-24 m-0 mx-auto rounded-full object-cover shadow-md" onError={(e) => { e.target.src = fallbackImage }} />
                                </div>

                                {/* Text Content */}
                                <div className="mt-4 text-center">
                                    {/* Student Name */}
                                    <p className="text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>

                                    {/* Course Badge */}
                                    <span className="inline-block mt-2 px-3 text-md text-[#39365c] font-semibold">
                                        {student.course}
                                    </span>
                                </div>
                            </a>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

        </motion.section>
    );
}