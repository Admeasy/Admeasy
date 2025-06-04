import { motion } from 'framer-motion';
import SearchLogo from '../assets/Others/Search-logo.webp';
import Girl from '../assets/Others/Girl.webp';
import UpGirl from '../assets/Others/UpGirl.webp'
const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const FrontHome = () => {
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="w-full flex justify-center items-center bg-primary shadow-3d">
        {/* Main container with two columns */}
        <div className="hidden md:flex flex-row w-full items-center">
          
          {/* Text content */}
          <div className="w-1/2 flex flex-col justify-center text-center gap-6 px-6">
            <h1 className="text-4xl lg:text-5xl xl:text-7xl font-bold text-tprimary leading-tight">
              Find the <span className="text-orange-400">Best</span><br />
              <span className="text-orange-400">College</span> in INDORE
            </h1>
            <h3 className="text-base lg:text-lg xl:text-2xl text-tsecondary">
              Discover top-rated colleges near you and connect with alumni to make the right choice for your future.
            </h3>

            {/* Search Bar */}
            <div className="relative flex items-center w-full mt-4">
              <input
                name="search"
                className="pl-4 pr-14 bg-white rounded-3xl h-12 w-full text-sm lg:text-base placeholder:text-tsecondary placeholder:text-xs lg:placeholder:text-base shadow-inset-6"
                type="text"
                placeholder="Search Best B.Tech colleges near me..."
              />
              <button className="absolute right-4">
                <img
                  draggable="false"
                  className="h-8 w-8"
                  src={SearchLogo}
                  alt="Search"
                />
              </button>
            </div>
          </div>

          {/* Girl Image */}
          <div className="w-1/2 flex justify-center items-end relative">
            <img
              src={Girl}
              className="max-w-[80%] h-auto object-contain drop-shadow-[8px_0px_16px_#d1d9e6]"
              alt="Girl"
            />
          </div>
        </div>
        {/* Tablet Div ends here */}

{/* Mobile div starts here */}
<div className='md:hidden px-8'>
  <div className="w-full flex flex-col items-center text-center gap-3">
          <h1 className="text-3xl sm:text-4xl mt-4 font-bold text-tprimary leading-snug">
            Find the <span className="text-orange-400">Best</span><br />
            <span className="text-orange-400">College</span> in INDORE
          </h1>
          <h3 className="text-[12px] sm:text-base text-tsecondary max-w-md">
            Discover top-rated colleges near you and connect with alumni to make the right choice for your future.
          </h3>

          {/* Search Bar */}
          <div className="relative flex items-center w-full max-w-md mt-4">
            <input
              name="search"
              className="pl-4 pr-14 bg-white rounded-3xl h-11 w-full text-sm placeholder:text-xs sm:placeholder:text-sm text-gray-900 font-semibold font-admeasy shadow-inset-6"
              type="text"
              placeholder="Search Best B.Tech colleges near me..."
            />
            <button className="absolute right-4">
              <img
                draggable="false"
                className="h-7 w-7"
                src={SearchLogo}
                alt="Search"
              />
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full flex justify-center">
          <img
            src={UpGirl}
            className="w-[80%] max-w-xs h-auto object-contain drop-shadow-[8px_0px_16px_#d1d9e6]"
            alt="Girl"
          />
        </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FrontHome;
