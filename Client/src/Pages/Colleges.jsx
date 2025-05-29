import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SearchLogo from '../assets/Others/Search-logo.webp'
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

  const handleSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase();
    if (searchQuery) {
      const filteredColleges = Colleges.filter(college =>
        college.name.toLowerCase().includes(searchQuery) || college.location.toLowerCase().includes(searchQuery) || college.type.toLowerCase().includes(searchQuery) || college.coursesOffered.join(' ').toLowerCase().includes(searchQuery) || college.keywords.join(' ').toLowerCase().includes(searchQuery)
      );
      setColleges(filteredColleges);
    } else {
      // If search query is empty, reset to original list
      fetch('/api/colleges').then(response => response.json()).then(data => {
        setColleges(data);
      }).catch(error => console.error('Error fetching colleges:', error));
    }
  }

  return (
    <>
      <div className="w-full m-0 my-4 p-4 flex items-center justify-center">
        <input name='search' className='pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-10 md:h-9 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]' type="text" placeholder='Search Best B.Tech colleges near me...' onChange={handleSearch} />
        <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-8 w-10'><img draggable="false" src={SearchLogo} /></button>
      </div>
      <div className='w-full p-3 flex justify-evenly flex-wrap gap-10'>
        {Colleges.map(
          // Function Here Bro!
          (college) => (
            <Link to={`/colleges/${college._id}`} key={college._id}>
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
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
    </>
  )
}

export default Colleges