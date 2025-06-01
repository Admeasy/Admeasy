import React from 'react'
import Colleges from "../assets/CollegeData/CollegesData.json"
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png"
import { FaLocationDot } from "react-icons/fa6";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { FaCalendarAlt } from "react-icons/fa";
import { LuDock } from "react-icons/lu";
import { FaStar } from "react-icons/fa";

import { BsBookmarkStarFill } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/CustomButton';
import StudentSwiper from '../components/StudentSwiper';
import Courses from '../components/Courses';
import CollegeCard from '../components/CollegeCard';
import Tabs from '../components/Tabs';
import { motion } from 'framer-motion';
const CollegeDetailed = () => {
 const fadeUpVariant = {
   hidden: { opacity: 0, y: 60 },
   visible: { opacity: 1, y: 0 },
 }
  return (

    <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: 'easeOut' }} className='pb-3 w-full'>
  <div className='p-3 mt-4 ml-auto mr-auto flex justify-center rounded-2xl flex-col shadow-3d'>
<div className='relative w-full h-full'>
  {/* Background Image */}
  <img
    draggable='false'
    className='h-[60vh] object-cover w-full rounded-2xl'
    src={medicaps}
    alt='Medicaps Background'
  />

  {/* Centered Overlay Content */}
  <div
    id='co'
    className='absolute  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center'
  >
    <div className='flex items-center gap-3 p-3 rounded-xl shadow-sm'>
      {/* Logo */}
      <img
        draggable='false'
        className='h-12 w-12 md:h-20 md:w-20 lg:h-28 lg:w-28 rounded-2xl'
        src={MediLogo}
        alt='College Logo'
      />

      {/* Text */}
      <div className='ml-5'>
        <h1 className='text-base md:text-[28px] mb-5 text-center lg:text-3xl text-gray-800 font-admeasy-extrabold'>B.Tech In Computer Science</h1>
        <h2 className='text-sm md:text-[24px] lg:text-3xl text-gray-600'>Medicaps University</h2>
      </div>
    </div>
  </div>
</div>


 <div className="flex gap-1 sm:gap-2 md:gap-4 justify-around bg-[#E7EBF3] mt-2 md:p-4  rounded-xl">
      {/* Item 1 */}
      <div className="flex items-center gap-1 md:gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] text-[8px] md:text-[16px] font-semibold"><FaLocationDot /></span>
        <span className='text-[8px] md:text-[16px]'>Indore,Madhya Pradesh</span>
      </div>

      {/* Item 2 */}
      <div className="flex items-center gap-1 md:gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] text-[8px] md:text-[16px] font-semibold"><FaCalendarAlt/></span>
        <span className='text-[8px] md:text-[16px]'>2003</span>
      </div>

      {/* Item 3 */}
      <div className="flex items-center gap-1 md:gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] text-[8px]  md:text-[16px] font-semibold"><LuDock/></span>
        <span className='text-[8px] md:text-[16px]'>Private</span>
      </div>
      {/* Item 4 */}
          <div className="flex items-center gap-1 md:gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] text-[8px]  md:text-[16px] font-semibold"><FaStar/></span>
        <span className='text-[8px] sm:text-[10px] md:text-[16px]'>4.2</span>
      </div>
    </div>
    </div>
    <Tabs/>
   <div>
<CollegeCard/>
   </div>
    </motion.div>
  )
}

export default CollegeDetailed