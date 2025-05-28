import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
// import CollegesData from '../assets/CollegeData/CollegesData.json'
import { motion } from 'framer-motion'


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Colleges = () => {
  const [Colleges, setColleges] = useState([])

  // Fetching colleges from the server
  useEffect(() => {
    async function fetchColleges() {
      fetch('/api/colleges').then(response => response.json()).then(data => {
        setColleges(data)
      }).catch(error => console.error('Error fetching colleges:', error))
    }
    fetchColleges()
  }, [])

  return (
    <div className='p-3 flex justify-evenly flex-wrap gap-10'>
      {Colleges.map(
        // Function Here Bro!
        (college) => (
          <Link to='/' key={college._id}>
            <motion.div
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-primary rounded-2xl p-6 shadow-3d w-80 hover:scale-105 transition-transform duration-200 h-[420px] flex flex-col justify-between">
              <img src={college.logo} alt={college.name} className="h-16 mx-auto" />

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
                  <span className="font-semibold text-[#2C2E3E]">Established:</span> {college.establishedYear}
                </p>
                <p>
                  <span className="font-semibold text-[#2C2E3E]">Type:</span> {college.type}
                </p>
                <p>
                  <span className="font-semibold text-[#2C2E3E]">Courses:</span> {college.coursesOffered}
                </p>
                <p>
                  <span className="font-semibold line-clamp-3 text-[#2C2E3E]">Description:</span> {college.desc}
                </p>
              </div>
            </motion.div>
          </Link>

        ))}
    </div>
  )
}

export default Colleges