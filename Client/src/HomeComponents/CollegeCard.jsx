import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ExploreBtn from './ExploreBtn'
import Institute from '../assets/Icons/Institute.webp'
import { Link } from 'react-router-dom'

// Helper function to format rating
const formatRating = (rating) => {
  if (typeof rating === 'number') return rating.toFixed(1);
  if (rating?.overall && typeof rating.overall === 'number') return rating.overall.toFixed(1);
  return 'N/A';
};

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

        <div className="flex my-4 flex-wrap justify-around p-0 md:p-2 md:m-2">
          {Colleges.map(
            // Function here
            (college, index) => (

              <Link key={index} to={`/colleges/${college._id}`}>
                <div className=' hidden md:flex '>
                  <div className="  w-max h-9/10 bg-primary cursor-pointer m-2.5 rounded-3xl shadow-3d transition-shadow duration-300 p-2 md:p-1 lg:p-3 flex">
                    <div className='w-18 md:w-25 m-0 md:mr-2'>
                      <img src={college.logo} alt={college.name} draggable="false" className="md:h-20 md:w-20 h-10 w-10 object-fill" />
                      <p className="text-yellow-500 text-[10px] m-1">⭐ {formatRating(college?.rating)}</p>
                    </div>
                    <div className="relative flex flex-col w-30 md:w-50 gap-1 pb-12 justify-center">
                      <h2 className="text-[18px] font-bold">
                        {college.name}
                      </h2>
                      <p className="text-[12px] md:text-sm text-tsecondary">{college.location}</p>
                      {/* <p className="text-sm text-gray-700 line-clamp-3">cd
            {college.description}
          </p> */}
                      <ExploreBtn linkbtn={(`/colleges/${college._id}`)} />
                    </div>

                  </div>
                </div>
                <div className="md:hidden w-[300px] h-[350px] bg-primary cursor-pointer m-2.5 rounded-3xl shadow-lg transition-shadow duration-300 p-4 flex flex-col items-center gap-2">

                  {/* Logo of College */}
                  <img
                    src={college.image}
                    alt={college.name}
                    draggable="false"
                    className="h-30 w-30 object-contain"
                  />

                  {/* College Name */}
                  <h2 className="text-lg font-bold text-center mt-2">
                    {college.name}
                  </h2>

                  {/* Rating & Address Row */}
                  <div className="flex justify-between w-full px-2 mt-2">
                    <p className="text-yellow-500 text-sm">⭐ {formatRating(college?.rating)}</p>
                    <p className="text-[12px] md:text-sm text-tsecondary text-right">{college.location}</p>
                  </div>

                  {/* Button at the bottom */}
                  <div className="relative h-full mt-4 w-full">
                    <button
                      type="submit"
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2
    cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg
    border-blue-600 w-full sm:w-max
    border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
    active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                    >
                      Explore
                    </button>
                  </div>


                </div>
              </Link>
            ))}
        </div>
        <div className='text-center'>
          {/* <a href="/colleges">View More</a> */}
          <ExploreBtn text='View More' isSticky={false} />
        </div>

      </div>
    </motion.section>

  )
}

export default CollegeCard