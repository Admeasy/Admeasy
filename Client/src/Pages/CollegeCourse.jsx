import React from 'react'
import Colleges from "../assets/CollegeData/CollegesData.json"
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png"
import { FaLocationDot } from "react-icons/fa6";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { FaCalendarAlt } from "react-icons/fa";
import { LuDock } from "react-icons/lu";
import { FaStar } from "react-icons/fa";
import Section from '../components/About-section'
import { BsBookmarkStarFill } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/3d-btn';
import StudentSwiper from '../components/StudentSwiper';
import Courses from '../components/Courses';
import CollegeCard from '../components/CollegeCard';
import Tabs from '../components/Tabs';
import { motion } from 'framer-motion';


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const CollegeCourse = () => {
  
  return (
    <motion.div 
      variants={fadeUpVariant} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, amount: 0.3 }} 
      transition={{ duration: 0.7, ease: 'easeOut' }} 
      className='w-full min-h-screen pb-3'
    >
      <div className='p-2 sm:p-3 mt-2 sm:mt-4 mx-auto flex justify-center rounded-lg sm:rounded-2xl flex-col shadow-3d max-w-7xl'>
        <div className='relative w-full'>
          {/* Background Image */}
          <img
            draggable='false'
            className='h-[30vh] sm:h-[40vh] md:h-[50vh] lg:h-[60vh] object-cover w-full rounded-lg sm:rounded-2xl'
            src={medicaps}
            alt='Medicaps Background'
          />

      
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4 sm:px-6 md:px-10">
  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-white/30 backdrop-blur-md shadow-md max-w-4xl mx-auto">
    
    {/* Logo */}
    <img
      draggable="false"
      src={MediLogo}
      alt="College Logo"
      className="h-10 w-10 sm:h-16 sm:w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-lg sm:rounded-2xl object-cover"
    />

    {/* Text Content */}
    <div className="text-center sm:text-left">
      <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-admeasy-extrabold text-gray-800 mb-1 sm:mb-3">
        B.Tech In Computer Science
      </h1>
      <h2 className="text-xs sm:text-sm md:text-lg lg:text-2xl text-gray-600">
        Medicaps University
      </h2>
    </div>
  </div>
</div>
        </div>

        {/* Info Cards */}
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-around bg-[#E7EBF3] mt-2 p-2 sm:p-4 rounded-lg sm:rounded-xl">
          {/* Location */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-[#575CFF] text-[10px] sm:text-[12px] md:text-[16px]"><FaLocationDot /></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700 whitespace-nowrap'>Indore,MP</span>
          </div>

          {/* Year */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-[#575CFF] text-[10px] sm:text-[12px] md:text-[16px]"><FaCalendarAlt/></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>2003</span>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-[#575CFF] text-[10px] sm:text-[12px] md:text-[16px]"><LuDock/></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>Private</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-[#575CFF] text-[10px] sm:text-[12px] md:text-[16px]"><FaStar/></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>4.2</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-6 md:px-12 lg:px-28 py-5 sm:py-10 flex flex-col items-center gap-10 sm:gap-20 relative z-40 bg-white">
        {/* About Section */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">About B.Tech</h2>
          <p className="text-sm sm:text-base md:text-xl text-gray-700 px-2 sm:px-4">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Porro facilis voluptatum iste ducimus impedit voluptates natus nihil delectus dignissimos quo atque, blanditiis dolores. Quo, exercitationem sapiente ab dolorem iste laboriosam?
          </p>
        </Section>

        {/* Fee Structure */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">Fee Structure</h2>
          <div className="w-full overflow-x-auto rounded-lg sm:rounded-2xl shadow-3d bg-white">
            <table className="w-full text-xs sm:text-sm text-left border-separate border-spacing-0">
              <thead className="bg-[#f3f4f6] text-gray-700 font-semibold">
                <tr>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap">Course</th>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap">Duration</th>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap">Fee/Year</th>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 bg-white">
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">B.Tech (CSE)</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">4 Years</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹95,000</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹3,80,000</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">BBA</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">3 Years</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹60,000</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹1,80,000</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">MBA</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">2 Years</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹1,20,000</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹2,40,000</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">B.Sc (CS)</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">3 Years</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹55,000</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200">₹1,65,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Scholarships */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">Scholarships</h2>
          <div className="w-full overflow-x-auto rounded-lg sm:rounded-2xl shadow-3d bg-white">
            <table className="w-full min-w-[300px] text-xs sm:text-sm md:text-base text-left border-separate border-spacing-0">
              <thead className="bg-[#f3f4f6] text-gray-700 font-semibold">
                <tr>
                  <th scope="col" className="px1 text-[12px] sm:px-6 sm:py-4 border-b border-gray-200 whitespace-nowrap">Scholarship</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 py-1 sm:py-4 border-b border-gray-200 whitespace-nowrap">Eligibility</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 py-1 sm:py-4 border-b border-gray-200 whitespace-nowrap">Benefit</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 sm:py-4 border-b border-gray-200 whitespace-nowrap">How to Apply</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-800">
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-1 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200">Merit-Based</td>
                  <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200">90%+ in 12th</td>
                  <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200">100% waiver</td>
                  <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px]  sm:py-4 border-b border-gray-200">At admission</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Sports Quota</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">State/National</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">25-50% off</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">With certificates</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Need-Based</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Income &lt; 2.5L</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">70% support</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Income proof</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Girl Child</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">All females</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">₹10k/year</td>
                  <td className="px-2 sm:px-6 py-1 sm:py-4 text-[12px] sm:text-[14px] md:text-[16px]  border-b border-gray-200">Automatic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </motion.div>
  )
}

export default CollegeCourse