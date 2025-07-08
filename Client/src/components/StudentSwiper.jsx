import { Swiper, SwiperSlide } from "swiper/react";
import useWindowSize from "./useWindowSize";
import { Navigation } from "swiper/modules";
import Boy from "../assets/Others/Student.webp"
import WA from "../assets/Icons/wa2.webp"
import { useRef, useState } from "react";
import CustomButton from "../HomeComponents/3d-btn";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import "swiper/css/navigation";
import { motion } from "framer-motion";
import RohitBanoth from "../assets/UGS/RohitBanoth.jpg"
import AkshayPratap from "../assets/UGS/AkshayPratap.jpg"
import MridulVerma from "../assets/UGS/MridulVerma.jpg"
import Faizah from '../assets/UGS/Faizah.png'
import Rajnish from "../assets/UGS/Rajnish.jpg"
import Tanushka from "../assets/UGS/TanushkaJha.jpg"
import Mohit from "../assets/UGS/MohitPramar.jpg"
import Gaurav from "../assets/UGS/Gaurav.jpg"
import Naman from "../assets/UGS/Naman.jpg"
import JaiPatidar from "../assets/UGS/JaiPatidar.jpg"
import SJMCLogo from "../assets/Others/SJMCLogo.jpeg"
import GravitMathur from"../assets/UGS/GarvitMathur.jpg"
import SnehaSoni from "../assets/UGS/SnehaSoni.jpg"
import { FaWhatsapp } from "react-icons/fa";
import StudentInfoModal from "./StudentInfoModal";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}
// IF img not available
const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
// UG'S college logo Images
const collegeLogoMap = {
  "Medicaps University": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSonOCk8kowuJudbSorlssnFY-PHFDMZ1NjA&s",
  "Sri Aurobindo Institute of Pharmacy": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt-cRd6s4RCPALLINBHWMEC1_dvFCB7SSLkw&s",
  "Sri Aurobindo Inst. of Management & Studies": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwsm_PitGWwCEjKSCfDnC9gH9hld4Iu8k-Cw&s",
  "SGSITS": "https://upload.wikimedia.org/wikipedia/en/4/4b/SGSITS_Indore.png",
  "IIT Indore": "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/IITI_Logo.svg/250px-IITI_Logo.svg.png",
  "IIM Indore": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/IIM_Indore_Logo.svg/150px-IIM_Indore_Logo.svg.png",
  "IIST":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScea8JfcJLacmRtR2Ah0pQBwDHYcWKOCVsVw&s",
  "Ramanujan College": "https://ramanujancollege.ac.in/media/images/Logo_RCDU_8oecNot.original.png",
  "Indraprastha College For Women":"https://ipcollege-du.samarth.ac.in/uploads/uims/8de41cbd87b11be8b371f9066fc3b4fd114807ce8cf50547791ce8e9d1e366b11_1719477627_63882554_logo.png",
  "Shaheed Bhagat Singh College":"https://sbsc.in/wp-content/uploads/elementor/thumbs/cropped-cropped-40-INCH-X-40-INCH-FILAM-copy-2-qreld0squn1ptm38sxaqh22111vo110lip7ujxyya0.png",
  "IIPS, DAVV":"https://media.licdn.com/dms/image/v2/C4E0BAQHPCA7Yx1le7A/company-logo_200_200/company-logo_200_200/0/1630629646361/iips_davv_logo?e=2147483647&v=beta&t=xljAoXK27ElUMXqiaPyBAZwcwb55EenqpPQ7TrM9vL8",
  "DAVV":"https://pbs.twimg.com/profile_images/982502564385112065/ZrD_2xsk_400x400.jpg",
  "Institute of Engineering & Technology, DAVV":"https://pbs.twimg.com/profile_images/982502564385112065/ZrD_2xsk_400x400.jpg",
  "School of Commerce, DAVV":"https://pbs.twimg.com/profile_images/982502564385112065/ZrD_2xsk_400x400.jpg",
  "SATHM,DAVV":"https://pbs.twimg.com/profile_images/982502564385112065/ZrD_2xsk_400x400.jpg",
  "Sage University":"https://cdn.universitykart.com//Content/upload/admin/gjmrzjqu.jr1.jpg",
  "Institute of Home Economics,DU":"https://upload.wikimedia.org/wikipedia/en/f/f9/Institute_of_Home_Economics.jpg",
  "SJMC,DAVV":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDIZBqrCoYp7RKNvEr-VgyOx6zNp7w50ngRdDbrfVklhaYYFMPn2hHLLfnTHQ9Pg9dCs8&usqp=CAU",
  "Bherulal Patidar Gov. College":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiS-uBQlNJ_i7kjG-9r5osfYH8lxPgX5jJjA&s",
  "IIPS,DAVV":"https://media.licdn.com/dms/image/v2/C4E0BAQHPCA7Yx1le7A/company-logo_200_200/company-logo_200_200/0/1630629646361/iips_davv_logo?e=2147483647&v=beta&t=xljAoXK27ElUMXqiaPyBAZwcwb55EenqpPQ7TrM9vL8",
  "Sushila Devi Bansal College":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv2t0OWf0GyUXavEF8JW-Z8b4576fawW94tuP7AqYEf_kwIdFmM5xo8R4fqMOyNYsqdwU&usqp=CAU"
};
// So lazy to download ug's images so put img address
const BurraVenkata = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=1a091252-ac9f-445d-b8ce-3bf52656a071&isR=false";

const TanmayMathur ="https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=00957d86-15f6-4e29-ae8f-29954e8a83e6&isR=false";

const PulkitJaiswal = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=356d4822-e81c-4cfa-ac0f-51c5b22f0c3a&isR=false";

const VickyWankhede ="https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=ea83bd72-ff0a-42bf-945c-da6157deebaf&isR=false";

const KeshavKhadelwal = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=7918e608-15eb-451b-ad65-6a039aaa73c6&isR=false";

const SnehaArora = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=b9d89a53-ab45-41df-8776-be3df37edcf6&isR=false";

const IshuChouhan = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=695abd7c-f140-4320-b049-10bd150eeb39&isR=false"

const ParthTiwari ="https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=aeb2205e-5660-4d41-ad7a-3eb63a48ef8e&isR=false";

const ParidhiDutt ="https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=93d91e76-2f83-49c2-a0b6-663567fc5662&isR=false";

const Vikram = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=5778c73e-bbc1-4492-a8ed-02cb4667cc28&isR=false";

const VinayYadav ="https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=ab5fdaa3-554e-4647-b74e-958828199b6d&isR=false";
const GauravBatham = 'https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=2b5175df-d417-4b8e-b853-2a9c304688af&isR=false';
const PriyanshSinghRajput = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=e987ed8a-acde-4439-a740-17ceadba3a1a&isR=false";
const VedikaSisodiya = "https://sheet.zoho.in/sheet/mdisplayimageaction.do?d_n=oiluc29ac5434c72e46d0a819fc2e4239e98b&u_n=37e99f86-022c-4ecf-afa2-2067bcea1f3b&isR=false"
const students = [
  {
    name: "Gaurav Yadav",
    college: "Ramanujan College",
    course: "B.com Hons.",
    img: Gaurav,
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
    college: "Medicaps University",
    course: "B.Tech CSE 4th Year",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"Medicaps University",
  },
  {
    name: "Sagar",
    college: "Sri Aurobindo Institute of Pharmacy",
    course: "Diploma in Pharmacy",
    img: fallbackImage,
    showMobile:true,
    showUniversity:true,
    university:"RGVP affiliated",
  },
  {
    name: "Sheetal Pandey",
    college: "Sri Aurobindo Inst. of Management & Studies",
    course: "BBA Plain",
    img: fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"RGVP aff.",
  },
  {
    name: "Tanushka Jha",
    college: "SGSITS",
    course: "BE in Electronics & Instrumentation Engineering",
    img: Tanushka,
    showMobile:false,
    showUniversity:true,
    university:"SGSITS",
  },
  {
    name:"Vikram Singh",
    college:"IIST",
    course:" B.tech CSE",
    img:Vikram,
    showMobile:false,
    showUniversity:true,
    university:"RGVP Aff.",
  },
  {
    name:"Vinay Yadav",
    college:"IIST",
    course:"B.tech CSE",
    img:VinayYadav,
    showMobile:false,
    showUniversity:true,
    university:"RGVP Aff.",
  },
    {
    name:"Atiharsh Bhatt",
    college:"IIT Indore",
    course:"Civil Engineering",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"IIT Indore",
   
  },
   {
    name:"Mohit Parmar",
    college:"IIPS, DAVV",
    course:"BBA+MBA(5yr)",
    img:Mohit,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
     {
    name:"Rajnish",
    college:"IIPS, DAVV",
    course:"B.Tech IT",
    img:Rajnish,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
      {
    name:"Rohith Banoth",
    college:"IIT Indore",
    course:"B Tech Civil Engineering",
    img:RohitBanoth,
    showMobile:false,
    showUniversity:true,
    university:"IIT Indore",
  },
  {
    name:"Faizah Naqvi",
    college:"Institute of Home Economics,DU",
    course:"Journalism ",
    img:Faizah,
    showMobile:true,
    showUniversity:true,
    university:"Delhi University",
  },
  {
    name:"Akshay Pratap Singh",
    college:"Medicaps University",
    course:"B.Tech",
    img:AkshayPratap,
    showMobile:false,
    showUniversity:true,
    university:"Medicaps University",
  },
    {
    name:"Garvit Mathur",
    college:"IIT Indore",
    course:"Chemical Engineering",
    img:GravitMathur,
    showMobile:false,
    showUniversity:true,
    university:"IIT Indore",
  },
      {
    name:"Naman Vishwakarma",
    college:"IIST",
    course:"B.Tech ECE",
    img:Naman,
    showMobile:false,
    showUniversity:true,
    university:"IIST",
  },
        {
    name:"Tanvi Pillai",
    college:"SATHM,DAVV",
    course:"B.Com hons.",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
       {
    name:"Md Amaan",
    college:"SATHM,DAVV",
    course:"BBA Aviation Management",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
      {
    name:"Jai Patidar",
    college:"DAVV",
    course:"BBA+MBA Integrated",
    img:JaiPatidar,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
           {
    name:"Priyansh Singh Rajput",
    college:"IIST",
    course:"B.Tech ECE",
    img:PriyanshSinghRajput,
    showMobile:false,
    showUniversity:true,
    university:"RGVP AFF.",
  },
   {
    name:"Anshul Badole",
    college:"Sage University",
    course:"B PHARMA",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"Sage University",
  },
     {
    name:"Vedika Sisodiya",
    college:"School of Commerce, DAVV",
    course:"B.Com in Accounting & Finanace",
    img:VedikaSisodiya,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
    {
    name:"Paridhi Dutt",
    college:"Bherulal Patidar Gov. College",
    course:"BSc Biotech",
    img:ParidhiDutt,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
    {
    name:"Parth Tiwari",
    college:"School of Commerce, DAVV",
    course:"BBA (Foreign Trade)",
    img:ParthTiwari,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
      {
    name:"Sneha Soni",
    college:"SJMC,DAVV",
    course:"BA Journalism & Mass Communication",
    img:SnehaSoni,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
     {
    name:"Burra Venkata",
    college:"IIT Indore",
    course:"B TECH Space Science & Engineering",
    img:BurraVenkata,
    showMobile:false,
    showUniversity:true,
    university:"IIT",
  },
       {
    name:"Tanmay Mathur",
    college:"SGSITS",
    course:"B TECH ELECTRONIC & INSTRUMENT ENGG.",
    img:TanmayMathur,
    showMobile:false,
    showUniversity:true,
    university:"SGSITS",
  },
         {
    name:"Pulkit Jaiswal",
    college:"Sushila Devi Bansal College",
    course:"B Tech CSE",
    img:PulkitJaiswal,
    showMobile:false,
    showUniversity:true,
    university:"DAVV Aff.",
  },
    {
    name:"Vicky Wankhede",
    college:"IIPS,DAVV",
    course:"BBA+MBA Integrated",
    img:VickyWankhede,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
    {
    name:"Keshav Khadelwal",
    college:"School of Commerce, DAVV",
    course:"BBA+MBA Integrated",
    img:KeshavKhadelwal,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
    {
    name:"Sneha Arora",
    college:"Indraprastha College For Women",
    course:"BA in Philosophy",
    img:SnehaArora,
    showMobile:false,
    showUniversity:true,
    university:"DELHI UNIVERSITY",
  },
     {
    name:"Ishu Chouhan",
    college:"Institute of Engineering & Technology, DAVV",
    course:"B TECH CIVIL",
    img:IshuChouhan,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
      {
    name:"Gaurav Batham",
    college:"Medicaps University",
    course:"B TECH CSE",
    img:GauravBatham,
    showMobile:false,
    showUniversity:true,
    university:"Medicaps University",
  },
    {
    name:"Mridul Verma",
    college:"IIPS, DAVV",
    course:"BBA+MBA",
    img:MridulVerma,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
      {
    name:"Himalaya Silawat",
    college:"DAVV",
    course:"BBA(Foreign Trade)",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"DAVV",
  },
        {
    name:"Ritesh Wakode",
    college:"SGSITS",
    course:"B Tech IP",
    img:fallbackImage,
    showMobile:false,
    showUniversity:true,
    university:"SGSITS",
  },
];

const altWmessage = 'Hey there! I want to connect with a UG student to gain some real insights and perspective!';
const encodedAltWmessage = encodeURIComponent(altWmessage);

export default function StudentSwiper({ SwiperHeading = `Talk to UGs/Alumni Of DU,DAVV and many more...`, college }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const size = useWindowSize();
  const isMobile = size.width && size.width < 768;
  const [name, setName] = useState("");
  const [stream, setStream] = useState("");
  const [percentage, setPercentage] = useState("");
  const [redirect, setRedirect] = useState(null);

   const [showModal, setShowModal] = useState(false);
  //  Form Cancel Handler Function
const cancelHandler = () => {
  setShowModal(false);
  toast.success("Skipping Form!", {
      position: "top-center",
      autoClose: 2000,
      theme: "colored",
    });

  setTimeout(() => {
    setShowModal(false);
    window.open(`https://wa.me/919243299145?text=${redirect}`, "_blank");
  }, 1500); // give enough time for user to notice the toast
}
  const onXclick = ()=>{
    setShowModal(false)
  }
  return (
    <>
      <StudentInfoModal
        name={name}
        stream={stream}
        percentage={percentage}
        isOpen={showModal}
        redirect={redirect}
        onClose={cancelHandler}
        onX={onXclick}
        setShowModal={setShowModal}
        
        />
      <motion.section
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="my-5 relative bg-bg p-6 rounded-2xl shadow-md w-[90%] mx-auto"
      >
        <h2 className="w-fit mx-auto text-center text-xl sm:text-2xl lg:text-4xl font-admeasy-extrabold text-tprimary mb-4 flex justify-evenly items-center">
          <img src={Boy} alt="WhatsApp" className="w-14 mr-0 sm:mr-4" />
          {SwiperHeading}
        </h2>

        {/* Custom Navigation Arrows */}
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
          className="pb-2 "
        >
 
          {students.map((student, index) => {
            const collegeLogo = collegeLogoMap[student.college] || fallbackImage;

            // const Wmessage = `Hey there! I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective about ${student.course}! \n About Me -\n name = ${name} \n stream = ${stream} \n percentage in 12th = ${percentage}`;
            // const encodedWmessage = encodeURIComponent(Wmessage);

            return (
              <SwiperSlide key={index} className="" >
                     <button
                  className="cursor-pointer mt-4 relative flex flex-col items-center bg-white rounded-xl shadow-md p-4 group hover:shadow-xl transition duration-300 ease-in-out border-none w-full"
                  onClick={() => {
                    const message = `Hey there! I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective about ${student.course}!`;
                    setRedirect(message);
                    setShowModal(true);
                  }}
                >
                <div className="">

                  {/* Image with College Logo Overlay */}
                  <div>

                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden shadow-md bg-gray-100">
                        <img
                          src={student.img}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = fallbackImage;
                          }} />
                      </div>

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
                </button>
              </SwiperSlide>
            );
          })}

          {/* WhatsApp Us CTA */}
          <a
            href={`https://wa.me/919243299145/?text=${encodedAltWmessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex justify-center items-center gap-2"
          >
            {isMobile ? (
              <h3 className="text-tprimary text-center text-lg font-admeasy-bold">
                No Right Mentor Yet? WhatsApp Us for One!
              </h3>
            ) : (
              <h3 className="text-tprimary text-center text-xl font-admeasy-bold">
                Can’t find a relatable UG student to guide you? WhatsApp us — we’ll connect you with one
              </h3>
            )}
            <img src={WA} className="size-10" />
          </a>
        </Swiper>
      </motion.section>
    </>
  );
}