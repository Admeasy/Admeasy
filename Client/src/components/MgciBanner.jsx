import React, { useState } from 'react'
import { AiOutlineCloseCircle } from "react-icons/ai";
import StudentInfoModal from './StudentInfoModel';
const MgciBanner = ({ onClose, imgSrc, imgWidth,brochure}) => {
  const [enrollForm,setEnrollForm] = useState(false)
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = brochure;
    link.download = "MGCI-Brochure.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm"// overlay click closes
    >
      <div
        className="relative rounded-xl flex flex-col gap-4 p-6 shadow-3d-4 bg-primary max-w-md text-center"
        onClick={(e) => e.stopPropagation()} // stop close on inner click
      >
        {/* Headlines */}
      <div className="space-y-2 text-center">
  <h2 className="text-[22px] font-admeasy-extrabold text-red-800">
    Crack JEE, NEET & CUET — Join MGCI Indore Today!
  </h2>
  <p className="text-lg font-admeasy text-gray-700">Expert-led Online Classes</p>
  <p className="text-lg font-admeasy text-gray-700">Dedicated Offline Programs in Indore</p>
</div>

        {/* Banner Image */}
        <img
        draggable='false'
          src={imgSrc}
          style={{ width: imgWidth}}
          className={`rounded-2xl mx-auto`}
        />

        {/*Enroll Now Button */}
        <div className="w-full text-center flex flex-col gap-2 lg:flex-row justify-between px-4">
          <button
          onClick={()=>setEnrollForm(true)}
          className="cursor-pointer transition-all bg-blue-500 text-white px-4 py-1.5 rounded-lg border-blue-600 w-full sm:w-max border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
            Enroll Now
          </button>
          {/* Download prospectus btn */}
          <button
          onClick={handleDownload}
     className="cursor-pointer flex justify-center items-center gap-2 px-6 py-2.5 
            bg-blue-600 text-white font-semibold rounded-full text-base
            shadow-md border border-blue-700/20

            transition-all duration-200
            hover:bg-blue-700 hover:shadow-lg hover:-translate-y-[1px]
            active:bg-blue-800 active:shadow-sm active:translate-y-[1px]"

    >
      <svg
        className="w-6 h-6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="none" d="M0 0h24v24H0z" stroke="none"></path>
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
        <path d="M7 11l5 5l5 -5"></path>
        <path d="M12 4l0 12"></path>
      </svg>
      <span>Prospectus</span>
    </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="cursor-pointer text-[20px] lg:text-2xl text-gray-600 absolute top-2 right-2"
        >
          <AiOutlineCloseCircle className="font-admeasy-extrabold" />
        </button>
      </div>
       <StudentInfoModal onClose={onClose} isOpen={enrollForm} onX={()=> setEnrollForm(false)} />
        
    </div>
    </>
  )
}

export default MgciBanner