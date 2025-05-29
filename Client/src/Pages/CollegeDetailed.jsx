import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png"
import { FaLocationDot, FaStar } from "react-icons/fa6";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { BsBookmarkStarFill } from "react-icons/bs";
import CollegeCard from '../components/CollegeCard';
import Tabs from '../components/Tabs';


const CollegeDetailed = () => {
  const [college, setCollege] = useState({});

  const { id } = useParams(); // Get the college ID from the URL

  useEffect(() => {
  fetch(`/api/colleges/${id}`)
    .then(res => res.json())
    .then(data => {
      setCollege(data);
      console.log(data)
  });
}, [id]);

  return (
    <div className='pb-4 w-[95%] m-auto'>
      <div className='p-3 pb-0 mt-4 mx-auto bg-primary flex justify-center rounded-2xl flex-col shadow-3d'>
        <div className='w-full h-full'>
          <div className='w-full h-[60vh] bg-cover rounded-2xl' style={{ backgroundImage: `url(${medicaps})` }}>
            <div className="w-full h-full bg-linear-to-b from-black/20 to-black/60 flex items-center justify-center gap-8">
              <img className='h-30 aspect-square rounded-2xl' src={college.logo} />
              <h1 className='text-5xl text-white font-admeasy-extrabold'>{college.name}</h1>
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center justify-around bg-primary p-4 rounded-xl">
          {/* Item 1 */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
            <span className="text-icon font-semibold"><FaLocationDot /></span>
            <span>{college.location}</span>
          </div>

          {/* Item 2 */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
            <span className="text-icon font-semibold"><HiMiniAcademicCap /></span>
            <span>NIRF - 10(MP)</span>
          </div>

          {/* Item 3 */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-sm text-gray-700">
            <span className="text-icon font-semibold"><FaStar /></span>
            <span>{college.rating}</span>
          </div>
        </div>
      </div>
      <Tabs data={college} />
      <CollegeCard data={college} />
    </div>
  )
}

export default CollegeDetailed