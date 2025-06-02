import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CollegeCards from '../assets/CollegeData/CollegeCard.json'
import ExploreBtn from './ExploreBtn'
import Institute from '../assets/Icons/Institute.webp'
import { Link } from 'react-router-dom'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const CollegeCard = () => {
  // State to hold the list of colleges
  const [Colleges, setColleges] = useState([])

  // Fetching colleges from the server
  useEffect(() => {
  async function fetchColleges() {
    try {
      const response = await fetch('/api/colleges');
      const data = await response.json();

      // Select 4 random colleges from the fetched data
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);
      setColleges(selected);

    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  }

  fetchColleges();
}, []);

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      id='collegebg'
      className=" text-tprimary my-5">
      <div className="pt-4">
        <div className="w-full mb-8 flex items-center justify-center gap-3">
          <img src={Institute} alt="" className="w-14" />
          <h1 className="text-2xl md:text-4xl m-0 mt-1 p-0 font-semibold text-center">
            Discover the Best Colleges Near You
          </h1>
        </div>

        <div className="flex flex-wrap justify-around p-0 md:p-2 md:m-2">
          {Colleges.map(
            // Function here
            (college) => (
              <Link to='/' key={college._id}>
                <div className="w-max h-9/10 bg-primary cursor-pointer m-2.5 rounded-3xl shadow-3d transition-shadow duration-300 p-2 md:p-1 lg:p-2 flex">
                  <div className='w-18 md:w-25 m-0 md:mr-2'>
                    <img src={college.logo} alt={college.name} draggable="false" className="md:h-20 md:w-20 h-10 w-10 object-fill" />
                    <p className="text-yellow-500 text-[10px] m-1">⭐ {college.rating}</p>
                  </div>
                  <div className="relative flex flex-col w-30 md:w-50 gap-1 pb-12 justify-center">
                    <h2 className=" text-[14px] md:text-xl font-bold">
                      {college.name}
                    </h2>
                    <p className="text-[12px] md:text-sm text-tsecondary">{college.location}</p>
                    {/* <p className="text-sm text-gray-700 line-clamp-3">cd
            {college.description}
          </p> */}
                      <ExploreBtn/>
                  </div>

                </div>
              </Link>
            ))}
        </div>
        <div className='text-center'>
          {/* <a href="/colleges">View More</a> */}
          <ExploreBtn text='View More' isSticky ={false} />
        </div>

      </div>
    </motion.section>

  )
}

export default CollegeCard