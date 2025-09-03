import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ExploreBtn from './ExploreBtn'
import GradientText from './GradientText'
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

export default function CollegeCard() {
  // State to hold the list of colleges
  const [Colleges, setColleges] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetching colleges from the server
  useEffect(() => {
    async function fetchColleges() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();

        // Select 4 random colleges from the fetched data
        const selected = [...data].sort(() => 0.5 - Math.random()).slice(0, 4);
        setColleges(selected);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching colleges:', error);
      }
    }
    fetchColleges();
  }, []);
  const gAds = ()=>{
    useEffect(() => {
  const script = document.createElement("script");
  script.src = "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
  script.async = true;
  document.body.appendChild(script);

  (window.adsbygoogle = window.adsbygoogle || []).push({});
  gAds()
}, []);
  }
  return (

    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      id='collegebg'
      className=" text-tprimary my-5">
      {/* <amp-ad width="100vw" height="320"
        type="adsense"
        data-ad-client=""
        data-ad-slot=""
        data-auto-format=""
        data-full-width="">
        <div overflow=""></div>
      </amp-ad> */}
     <div className="pt-10 bg-gradient-to-b from-sky-50 to-white">
  {/* ===== Heading Section ===== */}
  <div className="w-full mb-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
    {/* Custom SVG instead of emoji */}

    <div>
 
{/* <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800">
  Discover the{" "}
  <span className="relative inline-block px-2">

    <span className="absolute inset-0 rounded-lg p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradientMove blur-sm"></span>
    

    <span className="relative bg-white rounded-lg px-3 py-1 text-gray-900">
      Best Colleges
    </span>
  </span>{" "}
  Near You
</h1> */}
    <h1 className="flex gap-2 text-xl sm:text-3xl md:text-4xl font-admeasy-extrabold text-gray-800">
      <GradientText
colors={["#6EE7B7", "#3B82F6", "#9333EA"]}
  animationSpeed={8}
  showBorder={false}
  className="font-admeasy-extrabold"
>Discover Top Colleges Trusted by Students</GradientText>
</h1>


      <p className="text-gray-500 text-sm md:text-base mt-1">
        Find top-rated institutions near your city with trusted reviews and details
      </p>
    </div>
  </div>

  {/* ===== Cards Section ===== */}
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-10">
    {isLoading ? (
      <h3 className="mb-5 text-lg md:text-2xl text-tsecondary text-center font-semibold col-span-full">
        Loading Colleges...
      </h3>
    ) : (
      Colleges.map((college, index) => (
        <Link key={index} to={`/colleges/${college._id}`}>
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
            {/* Top Section with Logo & Rating */}
            <div className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shadow-inner">
                <img
                  src={college.logo}
                  alt={college.name}
                  className="h-12 w-12 object-contain"
                  draggable="false"
                />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition">
                  {college.name}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {college.location}
                </p>
              </div>
            </div>

            {/* Rating Badge */}
  <div className="px-4">
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
      ${
        !college.rating || college.rating <= 3
          ? "bg-red-50 text-red-700"
          : college.rating < 4
          ? "bg-orange-50 text-orange-700"
          : "bg-green-50 text-green-700"
      }`}
  >
    ⭐ {college.rating ? formatRating(college.rating) : "N/A"}
  </span>
</div>






            {/* Explore Button */}
            <div className="p-4 mt-2">
              <button
                type="button"
                className="cursor-pointer w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl font-semibold transition-all hover:bg-blue-700 hover:gap-3"
              >
                Explore
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </button>
            </div>
          </div>
        </Link>
      ))
    )}
  </div>

  {/* View More Button */}
  <div className="text-center cursor-pointer mt-10">
    <ExploreBtn text="View More" linkbtn="/colleges" isSticky={false} />
  </div>
</div>

    </motion.section>

  )
}