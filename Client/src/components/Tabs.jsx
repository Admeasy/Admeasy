import { useState, useEffect } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { FaCheckCircle, FaDotCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/3d-btn';
import StudentInfoModel from './StudentInfoModel';
import Contact from '../components/CollegeContactCard'
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Institute from '../assets/Others/Institute.webp'
import Building from '../assets/Others/Building.webp'
import BoyWithLaptop from '../assets/Others/BoyWithLaptop.webp'
import Boy from '../assets/Others/BoyPointingSideways.webp'
import Star from '../assets/Others/Star.webp'
import { FaArrowRight } from 'react-icons/fa6';


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
  const ratingValue = typeof rating === 'number' ? rating : 0;
  const percentage = (ratingValue / 5) * 100;
  const colorClass = getRatingColor(ratingValue);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <h4 className="text-thead1 text-lg font-semibold">{label}</h4>
        <span className={`font-medium ${ratingValue >= 4.5 ? 'text-green-600' :
          ratingValue >= 4.0 ? 'text-teal-600' :
            ratingValue >= 3.5 ? 'text-blue-600' :
              ratingValue >= 3.0 ? 'text-yellow-600' :
                ratingValue >= 2.0 ? 'text-orange-600' :
                  'text-red-600'}`}>
          {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}/5
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${percentage}%`,
            opacity: typeof rating === 'number' ? '1' : '0.3'
          }}
        />
      </div>
    </div>
  );
};

export default function Tabs({ college = {} }) {
  // Tabs component initialization

  const [selectedTab, setSelectedTab] = useState(0);
  const [gallery, setGallery] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(null);
  const [lastGalleryFetch, setLastGalleryFetch] = useState(null);
  const [recruitersWithLogos, setRecruitersWithLogos] = useState([]);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [redirect, setRedirect] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mentors, setMentors] = useState([]);
  const studentImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });

  let [categories] = useState({
    Overview: [],
    Courses: [],
    Mentors: [],
    Gallery: [],
    Rating: [],
    Contact: [],
  });

  // Safely access nested package data with defaults
  const packageData = {
    highest: safeGet(college, 'package.highest', 'Not Available'),
    average: safeGet(college, 'package.average', 'Not Available')
  };

  //  Form Cancel Handler Function
  const cancelHandler = () => {
    setShowModal(false);

    setTimeout(() => {
      window.open(`https://wa.me/919243299145?text=${redirect}`, "_blank");
    }, 10); // give enough time for user to notice the toast
  }
  const onXclick = () => {
    setShowModal(false)
  }

  function getStudentImageUrl(imageName) {
    if (imageName) {
      // Find the first key in studentImages that includes the imageName
      const entry = Object.entries(studentImages).find(([key]) =>
        key.includes(imageName)
      );
      return entry ? entry[1] : fallbackImage;
    } else {
      return fallbackImage
    }
  }

  // Function to fetch gallery images
  const fetchGalleryImages = async () => {
    if (!college?._id) return;

    setIsGalleryLoading(true);
    setGalleryError(null);

    try {
      const res = await fetch(`/api/colleges/gallery/${college._id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch gallery: ${res.status} ${res.statusText}`);
      }

      const urls = await res.json();

      if (!urls || urls.length === 0) {
        throw new Error('No gallery images found');
      }

      setGallery(urls);
      setLastGalleryFetch(Date.now());
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setGalleryError(err.message || 'Failed to load gallery images');
      setGallery([]);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  useEffect(() => {
    const students = college.students;
    setMentors(students);
  }, [])

  // Fetch gallery images only when Gallery tab is selected
  useEffect(() => {
    if (selectedTab === 3) { // Gallery tab index is 3
      fetchGalleryImages();
    }
  }, [selectedTab, college?._id]);

  // Refresh gallery URLs every 59 minutes when Gallery tab is active
  useEffect(() => {
    if (selectedTab !== 3) return; // Only run when Gallery tab is active

    const refreshInterval = setInterval(fetchGalleryImages, 59 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [selectedTab, college?._id]);

  // Function to get company logo URL
  const getCompanyLogo = async (companyName) => {
    try {
      const response = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`);
      const data = await response.json();
      return data[0]?.logo || null;
    } catch (error) {
      console.error(`Error fetching logo for ${companyName}:`, error);
      return null;
    }
  };

  // Effect to fetch company logos
  useEffect(() => {
    const fetchRecruitersLogos = async () => {
      if (!college?.recruiters?.length) return;

      setIsLoadingLogos(true);
      try {
        const recruitersData = await Promise.all(
          college.recruiters.map(async (name) => ({
            name,
            logo: await getCompanyLogo(name)
          }))
        );
        setRecruitersWithLogos(recruitersData);
      } catch (error) {
        console.error('Error fetching recruiter logos:', error);
      } finally {
        setIsLoadingLogos(false);
      }
    };

    fetchRecruitersLogos();
  }, [college?.recruiters]);

  return (
    <section className="w-full flex justify-center items-center px-1 sm:px-2 py-16">
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab} className='w-full'>
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='w-full'
        >
          <TabList className="w-full sm:w-4/5 mx-auto flex justify-around space-x-[calc(0.25rem/4)] sm:space-x-1 rounded-xl sm:rounded-2xl bg-blue-900/20 p-1 overflow-x-auto">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-xl sm:rounded-2xl px-1 py-1 sm:py-2.5 text-[14px] sm:text-[20px] font-medium',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 cursor-pointer',
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
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                About {college?.name || 'College'}
              </h2>
              <div className="w-full flex justify-evenly items-center">
                <img src={Institute} alt="Institute" className="w-1/4 hidden sm:block object-contain" />
                <p className="m-auto text-lg sm:text-xl text-tprimary">
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
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 px-3 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                Video Review
              </h2>
              {college?.vidReview ?
                (college?.vidReview.includes('shorts/') ?
                  <iframe src={`https://www.youtube.com/embed/${college?.vidReview.replace('shorts/', '')}?rel=0&showinfo=0&modestbranding=1`} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; web-share" showinfo='0' referrerpolicy="strict-origin-when-cross-origin" allowFullScreen className='max-[380px]:w-full max-[380px]:h-120 w-fit h-135 mx-auto aspect-auto rounded-xl'></iframe> :
                  <iframe src={`https://www.youtube.com/embed/${college?.vidReview}`} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; web-share" referrerpolicy="strict-origin-when-cross-origin" className='w-full sm:w-fit h-115 sm:h-100 mx-auto aspect-auto rounded-xl'></iframe>) :
                <h4 className=''>No Video Review available</h4>}
              {/* {college?.vidReview &&
                college?.vidReview.includes('shorts/') ? <embed src={`https://www.youtube.com/embed/${college?.vidReview.replace('shorts/', '')}`}
                  type="video/mp4"
                  width="100%" height="100%"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen className='w-1/2 h-550'></embed> : <embed src={`https://www.youtube.com/embed/${college?.vidReview}`} wmode="transparent"
                  type="video/mp4"
                  width="100%" height="100%"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen className='w-full aspect-video'></embed>
              } */}
            </motion.section>

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                Facilities
              </h2>
              <div className="w-full flex sm:justify-evenly items-center">
                <ul className='space-y-4 text-tprimary text-center text-md sm:text-lg'>
                  {Array.isArray(college?.facilities) && college.facilities.length > 0 ? (
                    college.facilities.map((facility, index) => (
                      <li key={index} className="flex items-start md:items-center text-lg sm:text-xl gap-2">
                        <FaDotCircle className='min-w-4 min-h-4 mt-2 md:mt-1 text-thead2' />
                        <h6 className='m-0 p-0 text-start'>{facility}</h6>
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
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6">
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
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
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6">
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                Recruiters
              </h2>
              {isLoadingLogos ? (
                <div className="flex justify-center items-center h-40">
                  <h4 className="text-lg text-tsecondary">Loading...</h4>
                </div>
              ) : recruitersWithLogos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                  {recruitersWithLogos.map((recruiter, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center p-4 bg-primary rounded-xl shadow-3d-4 hover:shadow-lg transition-shadow duration-300"
                    >
                      {recruiter.logo ? (
                        <img
                          src={recruiter.logo}
                          alt={`${recruiter.name} logo`}
                          className="w-16 h-16 object-contain mb-2"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=' + encodeURIComponent(recruiter.name.charAt(0));
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-full mb-2 text-2xl font-bold text-gray-600">
                          {recruiter.name.charAt(0)}
                        </div>
                      )}
                      <p className="text-sm font-medium text-thead2 text-center line-clamp-2">
                        {recruiter.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg text-tsecondary">No recruiters information available</p>
              )}
            </motion.section>

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6">
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                More Info About {college.name}
              </h2>
              <ul className="text-tprimary text-center text-md sm:text-lg">
                {Array.isArray(college?.moreInfo) && college.moreInfo
                  .filter(info => info && info.title && info.content) // Filter out invalid entries
                  .map((info, index) => (
                    <li key={index} className="w-full flex items-start gap-2 p-2">
                      <FaArrowRight className='min-w-4 min-h-4 mt-1.5 text-thead2' />
                      <h3 className="w-full flex flex-col sm:flex-row">
                        <span className="text-thead2 text-left font-semibold">{info.title}:</span><br />
                        <span className="w-full text-tprimary">{info.content}</span>
                      </h3>
                    </li>
                  ))}
                {(!Array.isArray(college?.moreInfo) || college.moreInfo.length === 0 ||
                  !college.moreInfo.some(info => info && info.title && info.content)) && (
                    <li className="text-center text-lg">No additional information available</li>
                  )}
              </ul>
            </motion.section>

            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[80%] relative justify-evenly flex md:flex-row bg-primary rounded-2xl shadow-3d p-4 sm:p-8 md:space-x-6 space-y-6 md:space-y-0"
            >
              <img src={Boy} alt="Student" className="w-1/2 lg:w-1/3 h-1/2 lg:h-1/4 hidden sm:block object-contain" />
              {/* Left Section: Text Content */}
              <div className="bg-primary rounded-xl shadow-3d p-6 transition-shadow">
                <h2 className="text-xl sm:text-2xl text-center font-admeasy-extrabold text-thead1 mb-4">Why Choose {college?.name || 'this College'}?</h2>
                <ul className="space-y-4 text-tsecondary text-sm">
                  {Array.isArray(college?.whyChoose) && college.whyChoose.length > 0 ? (
                    college.whyChoose.map((reason, index) => (
                      <li key={index} className="flex items-start md:items-center gap-2 text-lg sm:text-xl">
                        <FaCheckCircle className="text-thead1 min-w-5 min-h-5 mt-2 md:mt-1" />
                        {reason}
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-lg">No information available</li>
                  )}
                </ul>
              </div>
            </motion.section>
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
                    <li key={index} className='bg-primary p-4 text-lg sm:text-xl text-center text-tprimary rounded-2xl shadow-3d cursor-pointer hover:scale-105 transition-transform duration-300'>
                      <Link to={`/colleges/${college._id}/courses/${course._id}`} className='block w-full h-full space-y-2'>
                        <h4 className='text-thead2 text-xl sm:text-2xl font-admeasy-bold'>{course?.title || 'Course Title'}</h4>
                        <p>{course?.introDesc || 'Course description not available'}</p>
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
            {/* Mentors */}
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 mx-auto w-[90%] md:w-[80%] text-center bg-primary rounded-2xl shadow-3d p-6 space-y-6"
            >
              <h2 className="font-admeasy-extrabold text-center text-xl sm:text-3xl text-thead1">
                Talk to UGs/Alumnis
              </h2>
              <div className="w-full p-3 flex justify-evenly flex-wrap gap-10">
                {mentors && mentors.length > 0 ? (mentors.map((student) => (
                  <motion.button
                    variants={fadeUpVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    key={student._id}
                    className="w-60 cursor-pointer mt-4 relative flex flex-col items-center bg-primary rounded-xl shadow-3d p-6 transform hover:scale-105 transition-transform duration-300 ease-in-out border-none"
                    onClick={() => {
                      const message = `Hey there! I'd love to connect with ${student.name} from ${college?.name} to gain some real insights and perspective about ${student.course}!`;
                      setRedirect(message);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex flex-col space-y-1">
                      {/* Image with College Logo Overlay */}
                      <div>
                        <img
                          src={getStudentImageUrl(student.image)}
                          className="size-24 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                          onError={(e) => {
                            e.target.src = fallbackImage;
                          }} />
                      </div>
                      {/* Text Content */}
                      <div className="mt-4 text-center flex flex-col space-y-1.5">
                        {/* Student Name */}
                        <p className="text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>
                        {/* Highlighted College Name */}
                        <p className="text-sm font-medium text-[#39365c]">{student.college}</p>
                        {/* Course Badge */}
                        <span className="w-fit mx-auto inline-block px-2 py-0.5 text-xs bg-gray-100 text-[#39365c] font-semibold rounded-full shadow-sm">
                          {student.course}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))) : (<h4 className='text-xl text-center'>No Mentors found...</h4>)}
              </div>
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
                  {gallery.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt={`${college?.name || 'College'} Gallery Image ${idx + 1}`}
                        className='w-full h-64 object-contain rounded-xl shadow-3d hover:scale-105 transition-transform duration-300'
                        onError={(e) => {
                          console.error(`Image ${idx + 1} failed to load:`, url);
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextSibling;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                          // Only try to refresh if it's been a while since the last attempt
                          if (Date.now() - lastGalleryFetch > 60 * 60 * 1000) { // 1 hour
                            fetchGalleryImages();
                          }
                        }}
                      />
                      <div
                        className="hidden w-full h-64 bg-gray-100 rounded-xl shadow-3d flex-col items-center justify-center text-gray-500 space-y-2"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium">Image not available</p>
                        <p className="text-sm text-gray-400">Unable to load image</p>
                      </div>
                    </div>
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
              className="flex flex-col gap-8 mx-auto mt-10 w-[80%] bg-primary rounded-2xl shadow-3d p-8 space-y-6">
              <h1 className="m-0 p-0 text-2xl sm:text-3xl text-center text-thead1 font-admeasy-extrabold">
                Rating
              </h1>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-3 sm:p-6 bg-white/50 rounded-xl">
                  <h4 className="mb-2 text-thead1 text-lg font-semibold">Overall Rating</h4>
                  <div className="text-8xl flex items-center justify-evenly">
                    <h1 className="m-0 p-0 text-thead1 font-admeasy-extrabold">
                      {typeof college?.rating?.overall === 'number' ? college.rating.overall.toFixed(1) : 'N/A'}
                    </h1>
                    <img src={Star} alt="Rating Star" className="w-13 sm:w-26" />
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

          <TabPanel>
            <motion.section
              variants={fadeUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}>
              <Contact data={college} />
            </motion.section>
          </TabPanel>
        </TabPanels>
      </TabGroup>
      
      {/* StudentInfoModel - rendered at root level for proper positioning */}
      <StudentInfoModel
        isOpen={showModal}
        redirect={redirect}
        onClose={cancelHandler}
        onX={onXclick}
        setShowModal={setShowModal}
      />
    </section>
  );
}