import { motion } from 'framer-motion'
import CollegeCards from '../assets/CollegeData/CollegeCard.json'
import ExploreBtn from './ExploreBtn'
import { Link } from 'react-router-dom'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const CollegeCard = () => {
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

        <h1 className="text-2xl md:text-3xl font-semibold  text-center mb-2">
          Discover the Best Colleges Near You
        </h1>

        <div className="flex flex-wrap justify-around p-0 md:p-2 md:m-2">
          {CollegeCards.map(
            // Function here
            (college, index) => (

              <Link key={index} to={`/about`}>
                <div className="w-max h-9/10 bg-primary cursor-pointer m-2.5 rounded-3xl shadow-3d transition-shadow duration-300 p-2 md:p-1 lg:p-2 flex">
                  <div className='w-18 md:w-25 m-0 md:mr-2'>
                    <img src={college.image} alt={college.name} draggable="false" className="md:h-20 md:w-20 h-10 w-10 object-fill" />
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
                      <ExploreBtn linkbtn='/' />
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