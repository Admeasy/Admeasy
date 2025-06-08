import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchLogo from '../assets/Others/Search-logo.webp';
import Girl from '../assets/Others/Girl.webp';
import Hero from '../assets/Others/hero.webp'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const FrontHome = () => {
  const navigate = useNavigate();
  
  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target.search.value.trim();
    if (searchQuery) {
      navigate(`/colleges?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full px-4 py-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-center bg-primary w-full shadow-3d rounded-xl overflow-hidden ">
        {/* Text Section */}
        <div className="w-full md:w-1/2 flex flex-col text-center justify-center gap-4 sm:gap-6 xl:gap-8 p-6 px-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-admeasy-extrabold text-tprimary leading-snug">
            Find the <span className="text-orange-400">Best</span><br />
            <span className="text-orange-400">College</span> in INDORE
          </h1>
          <p className="text-[14px] sm:text-base md:text-lg text-tsecondary px-2 md:px-6">
            Discover top-rated colleges near you and connect with alumni to make the right choice for your future.
          </p>
          <form onSubmit={handleSearch} className="relative w-9/10 sm:w-full max-w-xl mx-auto mt-4">
            <input
              name="search"
              type="text"
              placeholder="Search Best B.Tech colleges near me..."
              className="w-full h-12 sm:h-14 px-4  rounded-full bg-white text-sm sm:text-base placeholder:text-tsecondary placeholder:text-[12px] sm:placeholder:text-base shadow-inset-6 outline-none"
              aria-label="Search for colleges"/>
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              aria-label="Search">
              <img
                src={SearchLogo}
                alt="Search Icon"
                draggable="false"
                className="h-6 w-6 sm:h-8 sm:w-8"/>
            </button>
          </form>
        </div>

        {/* Girl Image Section */}
        <div className="md:pt-13 w-full md:w-fit h-full relative flex justify-center md:justify-left md:mt-10">
          <img
            src={Hero}
            alt="College search illustration"
            className="block md:hidden max-h-[280px] object-contain drop-shadow-[8px_0px_16px_#d1d9e6]"/>
          <img
            src={Girl}
            alt="College search illustration"
            className="hidden md:block mt-5 lg:mt-0 max-h-[420px] object-contain drop-shadow-[8px_0px_16px_#d1d9e6]"
          />
        </div>
      </div>
    </motion.section>
  );
};

export default FrontHome;
