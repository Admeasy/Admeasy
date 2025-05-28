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
import CollegeCard from '../components/CollegeCard';
import Tabs from '../components/Tabs';
const CollegeDetailed = () => {
  return (
 
    <div className='pb-4 w-full bg-rgba(0, 0, 0, 0.08)'>

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
    <Tabs/>
   <div>
<CollegeCard/>
   </div>
    </div>
  )
}

export default CollegeDetailed