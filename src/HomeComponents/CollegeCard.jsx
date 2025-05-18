import React from 'react'
import CollegeCards from '../assets/CollegeData/CollegeCard.json'
import ExploreBtn from './ExploreBtn'
import instituteImg from "../assets/Others/institute.png"
const CollegeCard = () => {
  return (


   <div id='collegebg' className="bg-gray-500">
        <div className="bgcollegeshade">

  <h1 className="text-2xl md:text-3xl pt-3 font-semibold  text-center text-white mb-2 mt-1 flex items-center justify-center">
  <span><img draggable='false' className='w-10' src={instituteImg}/></span> &nbsp;
 Discover the Best Colleges Near You
  </h1>

  <div className="flex flex-wrap justify-around p-0 md:p-2">
    {CollegeCards.map(
      // Function here
      (college, index) => (
      
      <a key={index} href='/colleges'>
      <div className="bg-red-100 cursor-pointer m-2.5 rounded-3xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden p-2 md:p-1 lg:p-2 flex w-max">
        <div className='w-18 md:w-25 m-0 md:mr-2'>
        <img src={college.image} alt={college.name} draggable="false" className="md:h-20 md:w-20 h-10 w-10 object-fill"/>
       <p className="text-yellow-500 text-[10px] m-1">⭐ {college.rating}</p>
        <p className="text-[12px] md:text-sm text-gray-500">{college.location}</p>
        </div>
        <div className="flex flex-col w-30 md:w-50 gap-3 justify-center">
          <h2 className=" text-[14px] md:text-xl mb-2 font-bold text-gray-900">
            {college.name}
          </h2>
          {/* <p className="text-sm text-gray-700 line-clamp-3">cd
            {college.description}
          </p> */}
          <div className='text-center'> 
       <ExploreBtn/>
          </div>
        </div>
        
      </div>
      </a>
    ))}
  </div>
  <div className='text-center'>
{/* <a href="/colleges">View More</a> */}
<ExploreBtn text='View More'/>
  </div>
  
</div>
</div>

  )
}

export default CollegeCard