import { Link, NavLink } from 'react-router-dom'
import CollegesData from '../assets/CollegeData/CollegesData.json'
const Colleges = () => {
  return (
    <div className='p-3 flex flex-wrap gap-4'>
      {CollegesData.map(
        // Function Here Bro!
        (college,index)=>(
      <Link to='/' key={index}>
  <div className="bg-primary rounded-2xl p-6 shadow-3d w-80 hover:-translate-y-1 transition-transform h-[420px] flex flex-col justify-between">
    <img src={college.image} alt={college.name} className="h-16 mx-auto" />
    
    <div className="text-[#2C2E3E] text-lg font-bold mt-4 text-center">
      {college.name}
    </div>
    
    <div className="text-[#5A5C6C] text-sm text-center">
      {college.location}
    </div>
    
    <div className="text-[#FFB400] font-semibold text-sm text-center mt-1">
      ⭐ {college.rating}
    </div>
    
    <div className="text-sm text-[#5A5C6C] mt-4 space-y-1 overflow-hidden">
      <p>
        <span className="font-semibold text-[#2C2E3E]">Established:</span> {college.established}
      </p>
      <p>
        <span className="font-semibold text-[#2C2E3E]">Type:</span> {college.type}
      </p>
      <p>
        <span className="font-semibold text-[#2C2E3E]">Courses:</span> {college.courses}
      </p>
      <p>
        <span className="font-semibold line-clamp-3 text-[#2C2E3E]">Description:</span> {college.description}
      </p>
    </div>
  </div>
</Link>

      ))}
    </div>
  )
}

export default Colleges