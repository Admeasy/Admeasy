import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {Autoplay,EffectFade  } from "swiper/modules";
import './Carousel.css'
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import SearchLogo from "../assets/Others/Search-logo.webp"
const Carousel = () => {
  return (
    <div className="relative w-full h-[30rem]">
    <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
    
    <div className="home-main flex justify-center items-center">


<div className='bg-shade w-full'>

      <div id='college-contain' className="flex flex-col text-center w-full md:w-1/2 xl:gap-5 gap-4 sm:gap-8 pr-0 lg:gap-6">
        <h1 id='CollegeHeading' className='xl:text-7xl lg:text-6xl text-2xl sm:text-3xl md:text-4xl font-bold text-white'>
          Find the <span className="text-orange-400">Best</span><br /> 
          <span className="text-orange-400">College</span> in INDORE</h1>
          <p id='college-para' className='text-[14px] md:text-[18px] text-gray-300'>Discover top-rated colleges near you and connect with alumni to make the right choice for your future.</p>
          <div className="college-search  flex items-center w-full flex-row">
          {/* <i className="fa-solid fa-magnifying-glass text-[12px] lg:text-[16px] xl:text-[17px] absolute opacity-50" style={{padding:"15px"}}></i> */}
          <button className='text-[12px] lg:text-[16px] pl-2 xl:text-[17px] absolute w-10'><img src={SearchLogo}/></button>&nbsp;
          <input style={{paddingLeft:'37px'}} className='max-[300px]:placeholder-transparent placeholder-none placeholder-opacity-50 md:pl-9 outline-0 bg-white rounded-3xl h-12 w-full text-[12px] sm:text-[14px] lg:text-[18px]' type="text" placeholder='Search Best B.Tech colleges near me...' />
          </div>
          </div>

<div className="girl-bg md:h-100 md:w-96"></div>
</div>

      </div>
    </div>

      <Swiper
        modules={[ EffectFade ,Autoplay]}
        effect="fade"
  fadeEffect={{ crossFade: true }}
        spaceBetween={30}
        slidesPerView={1}
//These are for the dots i'll recommend to remove them
        // pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
        className="h-full" >
        <SwiperSlide>
          <div className="img0 w-full h-full"></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="img1 w-full h-full"></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="img2 w-full h-full"></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="img3 w-full h-full"></div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default Carousel;
