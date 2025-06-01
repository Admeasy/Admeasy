import { useState, useEffect } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { FaCheckCircle, FaDotCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/3d-btn';
import StudentSwiper from '../components/StudentSwiper';
import Courses from '../components/Courses';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Institute from '../assets/Others/Institute.webp'
import Building from '../assets/Others/Building.webp'
import BoyWithLaptop from '../assets/Others/BoyWithLaptop.webp'
import Boy from '../assets/Others/BoyPointingSideways.webp'
import Star from '../assets/Others/Star.webp'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

// Helper function to safely access nested objects
const safeGet = (obj, path, defaultValue = '') => {
  try {
    return path.split('.').reduce((acc, part) => acc[part], obj) ?? defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// Add this color determination function after imports
const getRatingColor = (rating) => {
  if (!rating) return 'from-gray-300 to-gray-400';
  if (rating >= 4.5) return 'from-green-400 to-green-600';
  if (rating >= 4.0) return 'from-teal-400 to-teal-600';
  if (rating >= 3.5) return 'from-blue-400 to-blue-600';
  if (rating >= 3.0) return 'from-yellow-400 to-yellow-600';
  if (rating >= 2.0) return 'from-orange-400 to-orange-600';
  return 'from-red-400 to-red-600';
};

const RatingBar = ({ rating, label }) => {
  // Convert rating to percentage (assuming rating is out of 5)
  const percentage = ((rating || 0) / 5) * 100;
  const colorClass = getRatingColor(rating);
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-thead1 text-lg">{label}</span>
        <span className={`font-medium ${rating >= 4.5 ? 'text-green-600' : 
          rating >= 4.0 ? 'text-teal-600' : 
          rating >= 3.5 ? 'text-blue-600' : 
          rating >= 3.0 ? 'text-yellow-600' : 
          rating >= 2.0 ? 'text-orange-600' : 
          'text-red-600'}`}>
          {rating || 'N/A'}/5
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 ease-out`}
          style={{ 
            width: `${percentage}%`,
            opacity: rating ? '1' : '0.3'
          }}
        />
      </div>
    </div>
  );
};

export default function Tabs({ college = {} }) {
  const [gallery, setGallery] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(null);

  let [categories] = useState({
    Overview: [],
    Courses: [],
    Gallery: [],
    Reviews: [],
  });

  // Safely access nested package data with defaults
  const packageData = {
    highest: safeGet(college, 'package.highest', 'Not Available'),
    average: safeGet(college, 'package.average', 'Not Available')
  };

  const infoItems = [
    { label: "Course Duration", value: "4 Years (2026 July - 2029 May) (8 Semesters)" },
    { label: "Scholarship", value: "MUSAT – Application Open ", linkText: "apply now", link: "#" },
    { label: "Fee Structure", value: "1,20,000 per annum" },
    { label: "Highest Package", value: "18 Lakh rupees (2024)" },
    { label: "Seats offered", value: "1020 (B.Tech CSE)" },
    { label: "Recruiters", value: "78 (includes TCS, Infosys)" },
    { label: "Median Package", value: "7.8 Lakh LPA" },
    { label: "Accepted Exams", value: "MU SAT, JEE, CUET" },
    { label: "Cut Off", value: "", linkText: "Click here", link: "#" },
    { label: "Eligibility", value: "55% – 10+2" },
  ];

  const relatedCourses = [
    "B.Tech in Civil Engineering",
    "B.Tech in Computer Engineering",
    "B.Tech in CS & Engineering (AI)",
  ];

  useEffect(() => {
    if (!college?._id) return;

    setIsGalleryLoading(true);
    setGalleryError(null);
    const files = [];
    const baseURL = `http://localhost:9000/images/${college._id}/`;

    fetch(`/api/colleges/gallery/${college._id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch gallery');
        }
        return res.json();
      })
      .then(data => {
        if (!data || data.length === 0) {
          setGalleryError('No images available');
          return;
        }
        files.push(...data);
        setGallery(files.map(name => baseURL + name));
      })
      .catch(err => {
        console.error('Gallery fetch error:', err);
        setGalleryError('Failed to load gallery');
      })
      .finally(() => {
        setIsGalleryLoading(false);
      });
  }, [college?._id])


  return (
    <section className="w-full flex justify-center items-center px-2 py-16">
      <TabGroup className='w-full'>
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <TabList className="w-4/5 mx-auto flex justify-around space-x-1 rounded-2xl bg-blue-900/20 p-1">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-2xl py-2.5 text-[18px] font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 cursor-pointer ',
                    selected
                      ? 'bg-white text-link shadow'
                      : 'text-black hover:bg-white/[0.12] hover:text-link'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </TabList>
        </motion.div>

        <TabPanels className="mt-2">
          <TabPanel className='flex flex-col gap-8'>
            {/* Overview */}
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[70%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-2xl text-thead1">
                About {college?.name || 'College'}
              </h2>
              <div className="w-full flex justify-evenly items-center">
                <img src={Institute} alt="Institute" className="w-1/4 hidden sm:block object-contain" />
                <p className="m-auto text-lg text-tprimary">
                  {college?.desc || 'Description not available'}
                </p>
              </div>
            </motion.section>

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[70%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-2xl text-thead1">
                Facilities
              </h2>
              <div className="w-full flex sm:justify-evenly items-center">
                <ul className='space-y-4 text-tprimary text-center text-md sm:text-lg'>
                  {Array.isArray(college?.facilities) && college.facilities.length > 0 ? (
                    college.facilities.map((facility, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FaDotCircle className='w-4 h-4 text-thead2' />
                        {facility}
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-lg">No facilities information available</li>
                  )}
                </ul>
                <img src={Building} alt="Building" className="w-1/4 hidden sm:block object-contain" />
              </div>
            </motion.section>

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[70%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6">
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-2xl text-thead1">
                Placements
              </h2>
              <div className="w-full flex items-center justify-evenly">
                <ul className="flex flex-col gap-10">
                  <li className="w-full rounded-2xl shadow-3d p-4">
                    <h3 className="text-lg sm:text-xl text-thead2">Highest Package: <span className="text-lg sm:text-xl text-tprimary">{packageData.highest}</span></h3>
                  </li>
                  <li className="w-full rounded-2xl shadow-3d p-4">
                    <h3 className="text-lg sm:text-xl text-thead2">Average Package: <span className="text-lg sm:text-xl text-tprimary">{packageData.average}</span></h3>
                  </li>
                  <li className="w-full rounded-2xl shadow-3d p-4">
                    <h3 className="text-lg sm:text-xl text-thead2">Placement Rate: <span className="text-lg sm:text-xl text-tprimary">{college?.placementRate || 'Not Available'}</span></h3>
                  </li>
                </ul>
                <img src={BoyWithLaptop} alt="Student with Laptop" className="w-1/2 hidden sm:block object-contain" />
              </div>
            </motion.section>
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[70%] relative justify-evenly flex md:flex-row bg-primary rounded-2xl shadow-3d p-8 md:space-x-6 space-y-6 md:space-y-0"
            >
              <img src={Boy} alt="Student" className="w-1/2 md:w-1/4 h-1/2 lg:h-1/4 hidden sm:block object-cover" />
              {/* Left Section: Text Content */}
              <div className="md:w-3/4 bg-primary rounded-xl shadow-3d p-6 transition-shadow">
                <h2 className="text-xl sm:text-2xl text-center font-admeasy-extrabold text-thead1 mb-4">Why Choose {college?.name || 'this College'}?</h2>
                <ul className="space-y-4 text-tsecondary text-sm">
                  {Array.isArray(college?.whyChoose) && college.whyChoose.length > 0 ? (
                    college.whyChoose.map((reason, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FaCheckCircle className="text-thead1 w-5 h-5" />
                        {reason}
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-lg">No information available</li>
                  )}
                </ul>

                {/* Button */}
                {/* <div className="mt-6 mx-auto">
                  <CustomButton>Explore More</CustomButton>
                </div> */}
              </div>
            </motion.section>

            {/* <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}>
              <StudentSwiper SwiperHeading="College Portraits" college={college}></StudentSwiper>
            </motion.section> */}
          </TabPanel>

          <TabPanel>
            {/* Courses */}
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className='flex flex-col mx-auto mt-10 w-[90%] bg-primary rounded-2xl shadow-3d p-6 space-y-6'>
              <h2 className='font-admeasy-extrabold text-center text-2xl sm:text-3xl text-thead1'>Courses Offered</h2>
              <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Array.isArray(college?.courses) && college.courses.length > 0 ? (
                  college.courses.map((course, index) => (
                    <li key={index} className='bg-primary p-4 text-lg sm:text-xl text-center text-tprimary rounded-2xl shadow-3d-4 cursor-pointer hover:scale-105 transition-transform duration-300'>
                      <Link to={`/colleges/${college._id}/courses/${course._id}`} className='block w-full h-full space-y-2'>
                        <h4 className='text-thead2 text-xl sm:text-2xl font-admeasy-bold'>{course?.title || 'Course Title'}</h4>
                        <p>{course?.desc || 'Course description not available'}</p>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className='text-center text-lg col-span-full'>No courses found</li>
                )}
              </ul>
            </motion.section>
          </TabPanel>

          <TabPanel>
            {/* Gallery */}
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-10 w-[90%] mx-auto"
            >
              <h2 className='font-admeasy-extrabold text-center text-2xl sm:text-3xl text-thead1 mb-8'>Gallery</h2>
              {isGalleryLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : galleryError ? (
                <div className="text-center py-8 bg-primary rounded-2xl shadow-3d">
                  <p className="text-lg text-tsecondary">{galleryError}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {gallery.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`${college?.name || 'College'} Gallery Image ${idx + 1}`}
                      className='w-full h-64 object-cover rounded-xl shadow-3d hover:scale-105 transition-transform duration-300'
                      onError={(e) => {
                        e.target.src = 'fallback-image-url'; // Add a fallback image URL
                        e.target.alt = 'Image not available';
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          </TabPanel>

          <TabPanel>
            {/* Reviews */}

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex flex-col gap-12 mx-auto mt-10 w-[80%] bg-primary rounded-2xl shadow-3d p-6 space-y-6">
              <h1 className="m-0 p-0 text-2xl sm:text-3xl text-center text-thead1 font-admeasy-extrabold">
                Rating
              </h1>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-white/50 rounded-xl">
                  <h4 className="mb-2 text-thead1 text-lg">Overall Rating</h4>
                  <div className="text-8xl flex items-center justify-evenly">
                    <h1 className="m-0 p-0 text-thead1 leading-6 font-admeasy-extrabold">{college?.rating?.overall || 'N/A'}</h1>
                    <img src={Star} alt="Rating Star" className="w-26" />
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col gap-6">
                  <RatingBar 
                    label="Educational Quality" 
                    rating={college?.rating?.educationalQuality} 
                  />
                  <RatingBar 
                    label="Faculty" 
                    rating={college?.rating?.faculty} 
                  />
                  <RatingBar 
                    label="Infrastructure" 
                    rating={college?.rating?.infrastructure} 
                  />
                  <RatingBar 
                    label="Placements" 
                    rating={college?.rating?.placements} 
                  />
                  <RatingBar 
                    label="Facilities" 
                    rating={college?.rating?.facilities} 
                  />
                </div>
              </div>
            </motion.section>

            
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </section>
  )
}