import React from 'react'
import Colleges from "../assets/CollegeData/CollegesData.json"
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png"
import { FaLocationDot } from "react-icons/fa6";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { BsBookmarkStarFill } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/CustomButton';
import StudentSwiper from '../components/StudentSwiper';
import Courses from '../components/Courses';
const CollegeDetailed = () => {
  return (
 
    <div className='w-full bg-rgba(0, 0, 0, 0.08)'>

  <div className='p-3 mt-4 ml-auto mr-auto flex justify-center rounded-2xl flex-col shadow-3d'>
<div className='relative w-full h-full'>
    <img className='h-[60vh] object-cover w-full rounded-2xl' src={medicaps}/>
    <img className='absolute h-20 w-20 rounded-2xl left-11 top-7' src={MediLogo}/>
    <h1 className='absolute bottom-4 left-7  text-2xl text-[#575dff]'>Medi-Caps University</h1>
</div>
 <div className="flex gap-4 justify-around bg-[#E7EBF3] p-4 rounded-xl">
      {/* Item 1 */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] font-semibold"><FaLocationDot /></span>
        <span>1.7 Km Away</span>
      </div>

      {/* Item 2 */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] font-semibold"><HiMiniAcademicCap/></span>
        <span>NIRF - 10(MP)</span>
      </div>

      {/* Item 3 */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
        <span className="text-[#575CFF] font-semibold"><BsBookmarkStarFill/></span>
        <span>98% Placement</span>
      </div>
    </div>
    </div>
  <div className="flex flex-col mx-auto mt-10 w-[90%] bg-[#E7EBF3] rounded-2xl shadow-3d p-6 space-y-6">
  {/* Title Section */}
  <h2 className="font-admeasy-extrabold text-center text-2xl sm:text-3xl text-[#575CFF]">
    Campus Video Review
  </h2>

  {/* Content Section */}
  <div className="flex flex-col md:flex-row items-center justify-center md:space-x-6 space-y-6 md:space-y-0">
    {/* Video Section */}
    <div className="flex items-center justify-center w-full md:w-1/3 aspect-video bg-white rounded-xl shadow-3d">
      <span className="text-gray-500">[Video]</span>
    </div>

    {/* Questions Section */}
    <div className=" flex flex-col max-w-max md:w-2/3 bg-white rounded-xl shadow-3d px-20 py-11 p-4">
      <ul className="text-sm font-bold text-gray-700 space-y-2">
        <li>Q. How is Campus life?</li>
        <li>Q. Do they get easy Scholarship?</li>
        <li>Q. What is the process to apply for Scholarship?</li>
        <li>Q. How many students in B.Tech?</li>
        <li>Q. Do they accept CUET marks?</li>
      </ul>
    </div>
  </div>

  {/* Button Section */}
  <div className="flex justify-center">
    <CustomButton>View More<span className="text-lg font-admeasy-extrabold">→</span></CustomButton>
      
  </div>
</div>
    <div className="mt-20 mr-auto ml-auto w-[90%] relative justify-center flex flex-col md:flex-row bg-white rounded-2xl shadow-3d p-6 md:space-x-6 space-y-6 md:space-y-0">
      {/* Left Section: Text Content */}
      <div className="w-full md:w-1/2 flex flex-col justify-between bg-[#E7EBF3] rounded-xl shadow-3d p-6  transition-shadow">
        <div>
          <h2 className="text-xl font-semibold text-[#575CFF] mb-4">Why Choose Medi-Caps?</h2>
          <ul className="space-y-4 text-gray-700 text-sm">
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#575CFF] w-5 h-5" />
              100% Placement Opportunities
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#575CFF] w-5 h-5" />
              52 LPA Highest Package (B.Tech)
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#575CFF] w-5 h-5" />
              Premium and Best Facilities
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#575CFF] w-5 h-5" />
              Collaborations with Top Companies
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#575CFF] w-5 h-5" />
              Excellent Infrastructure and Labs
            </li>
          </ul>
        </div>

        {/* Button */}
        <div className="mt-6">
         <CustomButton>Explore More</CustomButton>
        </div>
      </div>

      {/* Right Section: Illustration */}
      {/* <div className="w-full md:w-1/2 h-64 md:h-auto flex items-center justify-center bg-white rounded-xl shadow-[6px_6px_15px_rgba(0,0,0,0.1)]">
        <img
          src="https://via.placeholder.com/150x150.png?text=Illustration"
          alt="Illustration Placeholder"
          className="w-2/3 md:w-1/2 object-contain"
        />
      </div> */}
    </div>
    <div className='mt-20'>
<StudentSwiper></StudentSwiper>
    </div>
    <div className="bg-[#F2F4F9] py-10 px-4 flex justify-center">
      <div className="bg-white rounded-2xl p-6 w-[90%] shadow-3d">
        {/* Title */}
        <h2 className="text-center text-xl sm:text-2xl font-bold text-[#5A4BFF] mb-6">
          Authentic Student Video Reviews
        </h2>

        {/* Main Content Box */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-[#EDF1F8] p-4 rounded-2xl shadow-inner">
          {/* Video Preview or Placeholder */}
          <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/477/477292.png"
              alt="Student with Camera"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Questions Section */}
          <div className="text-gray-800 text-sm space-y-1 w-full">
            <p className="text-[#5A4BFF] font-semibold text-base">
              Ravi Kumar
            </p>
            <p className="text-gray-600 text-xs mb-2">B.Tech CSE Student</p>
          <ul className="list-none space-y-1 text-sm text-gray-800">
  <li>Q. Is admission to B.Tech accepted through CUET scores?</li>
  <li className="font-semibold">Q. What was your JEE or CUET percentile?</li>
  <li><span className="font-semibold">Q. Could you share</span> your experience regarding ragging policies?</li>
  <li>Q. How are the hostel facilities on campus?</li>
  <li>Q. Are placement opportunities provided, or do students need to find them independently?</li>
</ul>

          </div>
        </div>

        {/* Button */}
        <div className="flex justify-center mt-6">
         <CustomButton>View More <span className="text-lg">→</span></CustomButton>
        </div>
      </div>
    </div>
<Courses></Courses>
    </div>
  )
}

export default CollegeDetailed