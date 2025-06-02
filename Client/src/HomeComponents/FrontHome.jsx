import { motion } from 'framer-motion'
import SearchLogo from '../assets/Others/Search-logo.webp'
import Girl from '../assets/Others/Girl.webp'
import UpGirl from '../assets/Others/UpGirl.webp'


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
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className='w-full h-2/3'>
        {/* Main div*/}
        <div className="home-main h-full flex justify-center items-center">
          {/* div for background */}
          <div className='h-full bgshade items-center justify-evenly flex md:flex-row flex-col bg-primary w-full shadow-3d'>
            {/* Div of finding colleges in indore */}
            <div id='college-contain' className="flex flex-col text-center justify-center w-full md:w-1/2 h-3/5 md:h-full xl:gap-6 gap-4 md:gap-3 sm:gap-8 lg:gap-6">
              <h1 id='CollegeHeading' className='xl:text-6xl lg:text-[2.5rem] text-2xl sm:text-3xl md:text-[1.6rem] font-bold text-tprimary'>
                Find the <span className="text-orange-400">Best</span><br />
                <span className="text-orange-400">College</span> in INDORE</h1>
              <h3 className='text-[14px] xl:text-2xl md:text-[16px] text-tsecondary'>Discover top-rated colleges near you and connect with alumni to make the right choice for your future.</h3>
              <div className="college-search flex items-center w-full flex-row">
                <input name='search' className='pl-2 sm:pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-9 md:h-10 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-4 sm:shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]' type="text" placeholder='Search Best B.Tech colleges near me...' />
                <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-4 sm:right-8 w-7 sm:w-10'><img draggable="false" src={SearchLogo} /></button>
              </div>
            </div>
            {/* girl-img */}
            <div className="w-1/3 h-full relative flex m-0 p-0 justify-center">
              <img src={Girl} className=" max-w-full hidden md:block max-h-full object-contain drop-shadow-[8px_0px_16px_#d1d9e6]" />
              <img src={UpGirl} className="w-full block md:hidden h-2/5 object-contain drop-shadow-[8px_0px_16px_#d1d9e6]" />
            </div>
          </div>
          {/* Front Page */}
        </div>
    </motion.section>
  )
}

export default FrontHome