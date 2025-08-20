import React, { useEffect } from 'react'
import slap from "../assets/Others/slaphard.png"
import FooterBtn from '../HomeComponents/FooterBtn'
import { useState } from 'react';
import MobileBtn from '../HomeComponents/3d-btn';
import { useNavigate } from 'react-router-dom';
export const NotFound = () => {
  const [windowWidth, setWindowWidth] =useState(window.innerWidth);
  useEffect(()=>{
    const WindowSize = ()=>{
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize",WindowSize);
    return () => {  
      window.removeEventListener("resize", WindowSize);
    }
  })
  const navigate = useNavigate();
  return (
 <div className="relative w-full h-screen">

      {/* Overlay */}
      <div className="w-full h-full flex flex-col items-center mt-10 text-black  text-center p-4">
        <img src={slap} className='w-30' alt="404 page not found" />
        <h1 className=" text-6xl font-admeasy-extrabold drop-shadow-lg animate-pulse text-blue-500">
          404-Not Found
        </h1>
        <p className="font-admeasy-bold text-lg sm:text-2xl mt-4 max-w-xl">
          Oops! You just slapped yourself into a page that doesn’t exist.  
          <span className="block mt-2"></span>
        </p>

        {/* Button*/}
        <div>
      {/* {windowWidth < 1024 ? (
        <FooterBtn text="Go Back" ShowIcon={false}/>
      ) : (
       <p>Go Home</p>
      )}
       */}
      {windowWidth > 1024 ? (
        <FooterBtn text="Go Back" ShowIcon={false}/>  
      ) : (
        <div onClick={()=>navigate("/")}>
       <MobileBtn>
        Go Home
       </MobileBtn>
       </div>
      )}
      </div>
      </div>
    </div>  )
}
