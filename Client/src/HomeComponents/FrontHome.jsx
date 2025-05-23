import { motion } from 'framer-motion'
import SearchLogo from '../assets/Others/Search-logo.webp'
import Girl from '../assets/Others/Girl.webp'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const FrontHome = () => {
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}>
      {/* Background image Div */}
      <div className="bg h-3/6">
        <div className="bgshadefronthome h-3/6">

          {/* Main div*/}
          <div className="home-main flex justify-center items-center">

            {/* div for background */}
            <div className='bgshade w-full shadow-[8px_8px_16px_#d1d9e6,_inset_8px_8px_16px_#ffffff]'>
              {/* Div of finding colleges in indore */}
              <div id='college-contain' className="flex flex-col text-center justify-center w-full md:w-1/2 xl:gap-5 gap-4 sm:gap-8 lg:gap-6">
                <h1 id='CollegeHeading' className='xl:text-7xl lg:text-[4rem] text-2xl sm:text-3xl md:text-[3rem] font-bold text-[#2C2E3E]'>
                  Find the <span className="text-orange-400">Best</span><br />
                  <span className="text-orange-400">College</span> in INDORE</h1>
                <h3 id='college-para' className='text-[14px] md:text-[18px] text-[#5A5C6C]'>Discover top-rated colleges near you and connect with alumni to make the right choice for your future.</h3>
                <div className="college-search  flex items-center w-full flex-row">
                  {/* <i className="fa-solid fa-magnifying-glass text-[12px] lg:text-[16px] xl:text-[17px] absolute opacity-50" style={{padding:"15px"}}></i> */}
                  <input name='search' className='md:pl-6 outline-0 bg-white rounded-3xl h-12 w-full placeholder:text-gray-800 shadow-[inset_4px_4px_8px_#d1d9e6] text-[12px] sm:text-[14px] lg:text-[18px]' type="text" placeholder='Search Best B.Tech colleges near me...' />
                  <button className='text-[12px] lg:text-[16px] xl:text-[17px] absolute right-8 w-10'><img src={SearchLogo} /></button>
                </div>
              </div>
              {/* girl-img */}
              <img src={Girl} className="md:h-100 md:w-96 drop-shadow-[8px_0px_16px_#00000070]" />
            </div>
            {/* Front Page */}
          </div>
        </div>{/* Background img div ends here*/}

      </div>
    </motion.section>
  )
}

export default FrontHome