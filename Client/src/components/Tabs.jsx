import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { FaCheckCircle, FaDotCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/3d-btn';
import Contact from '../components/CollegeContactCard'
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import Institute from '../assets/Others/Institute.webp'
import Building from '../assets/Others/Building.webp'
import BoyWithLaptop from '../assets/Others/BoyWithLaptop.webp'
import Boy from '../assets/Others/BoyPointingSideways.webp'
import Star from '../assets/Others/Star.webp'
import { FaArrowRight } from 'react-icons/fa6';
import ButtonIcon from '../components/ButtonIcon';
import { useUser } from '../context/UserContext'
import { useMentor } from '../context/MentorContext'
import { GraduationCap } from 'lucide-react'
import LogIn from '../Pages/LogIn';
import { toast } from 'react-toastify';
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
  if (rating >= 3.5) return 'from-brand-light to-brand-dark';
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
            ratingValue >= 3.5 ? 'text-[#9f3562]' :
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

export default function Tabs({college = {} }) {
  // Tabs component initialization
  const { user } = useUser();
  const { mentor } = useMentor();
  const [selectedTab, setSelectedTab] = useState(0);
  const [recruitersWithLogos, setRecruitersWithLogos] = useState([]);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const loggedInAccount = user || mentor;
  const studentImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });

  let [categories] = useState({
    Overview: [],
    Courses: [],
    Mentors: [],
    Rating: [],
    Contact: [],
  });

  // Safely access nested package data with defaults
  const packageData = {
    highest: safeGet(college, 'package.highest', 'Not Available'),
    average: safeGet(college, 'package.average', 'Not Available')
  };

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

  // Fetch mentors from API for this college
  useEffect(() => {
    const fetchMentors = async () => {
      // Get the college ID from the prop (handle both _id and id)
      const currentCollegeId = college?._id || college?.id;
      if (!currentCollegeId) {
        setIsLoadingMentors(false);
        setMentors([]);
        return;
      }

      setIsLoadingMentors(true);
      try {
        // Fetch all mentors from API
        const mentorsResponse = await fetch('/api/mentors/');
        if (!mentorsResponse.ok) {
          throw new Error('Failed to fetch mentors');
        }

        const mentorsFromDB = await mentorsResponse.json();
        
        // Filter mentors by college ID - only show mentors from the same college
        const collegeMentors = mentorsFromDB.filter((mentor) => {
          // Parse mentor's college data
          let mentorCollege = null;
          if (typeof mentor.college === 'object' && mentor.college !== null) {
            mentorCollege = mentor.college;
          } else if (mentor.college) {
            try {
              mentorCollege = JSON.parse(mentor.college);
            } catch {
              // If parsing fails, try to use it as a string ID
              mentorCollege = { id: mentor.college, _id: mentor.college };
            }
          }
          
          if (!mentorCollege) return false;
          
          // Get mentor's college ID (handle both id and _id)
          const mentorCollegeId = mentorCollege.id || mentorCollege._id;
          
          // Convert both to strings for reliable comparison
          const currentIdStr = String(currentCollegeId);
          const mentorIdStr = String(mentorCollegeId);
          
          // Only include mentors whose college ID exactly matches
          return mentorIdStr === currentIdStr;
        });

        // Process and fetch images for mentors
        const processedMentors = await Promise.all(
          collegeMentors.map(async (mentor) => {
            const mentorCollege = typeof mentor.college === 'object' && mentor.college !== null
              ? mentor.college
              : (mentor.college ? (() => {
                  try {
                    return JSON.parse(mentor.college);
                  } catch {
                    return null;
                  }
                })() : null);
            
            const course = typeof mentor.course === 'object' && mentor.course !== null
              ? mentor.course
              : (mentor.course ? (() => {
                  try {
                    return typeof mentor.course === 'string' && mentor.course.startsWith('{') 
                      ? JSON.parse(mentor.course) 
                      : { name: mentor.course };
                  } catch {
                    return { name: mentor.course };
                  }
                })() : null);

            // Fetch mentor image
            let imageUrl = fallbackImage;
            if (mentor._id) {
              try {
                const imageRes = await fetch(`/api/mentors/${mentor._id}/pic`);
                if (imageRes.ok) {
                  const url = await imageRes.json();
                  if (url) imageUrl = url;
                }
              } catch (err) {
                console.error('Error fetching mentor image:', err);
              }
            }

            return {
              ...mentor,
              image: imageUrl,
              college: mentorCollege?.name || mentor.college || '',
              collegeId: mentorCollege?.id || mentorCollege?._id || '',
              course: course?.name || course?.title || mentor.course || '',
            };
          })
        );

        setMentors(processedMentors);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        // Don't fallback to legacy students - only show mentors from API
        setMentors([]);
      } finally {
        setIsLoadingMentors(false);
      }
    };

    fetchMentors();
  }, [college?._id, college?.id])

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

  const navigate = useNavigate()
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
          <TabList className="w-full sm:w-4/5 mx-auto flex justify-around space-x-[calc(0.25rem/4)] sm:space-x-1 rounded-xl sm:rounded-2xl bg-brand-light/20 p-1 overflow-x-auto">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-xl sm:rounded-2xl px-1 py-1 sm:py-2.5 text-[14px] sm:text-[20px] font-medium',
                    'ring-white/60 ring-offset-2 ring-offset-[#9f3562] focus:outline-none focus:ring-2 cursor-pointer',
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

            {college?.vidReview && <motion.section
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
                  <iframe src={`https://www.youtube.com/embed/${college?.vidReview.replace('shorts/', '')}?rel=0&showinfo=0&modestbranding=1`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className='max-[380px]:w-full max-[380px]:h-120 w-fit h-135 mx-auto aspect-auto rounded-xl'></iframe> :
                  <iframe src={`https://www.youtube.com/embed/${college?.vidReview}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; web-share" referrerPolicy="strict-origin-when-cross-origin" className='w-full sm:w-fit h-115 sm:h-100 mx-auto aspect-auto rounded-xl'></iframe>) :
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
            </motion.section>}

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

            {college?.moreInfo == null && <motion.section
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
            </motion.section>}

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
              
              {isLoadingMentors ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light"></div>
                </div>
              ) : mentors && mentors.length > 0 ? (
                <div className="w-full p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mentors.map((mentorCard) => (
                    <motion.div
                      variants={fadeUpVariant}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      key={mentorCard._id}
                      className={`group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300 flex flex-col min-h-[320px] ${mentorCard.username ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (mentorCard.username) {
                          navigate(`/${mentorCard.username}`);
                        }
                      }}
                    >
                      {/* Card Header with Image */}
                      <div className="relative p-6 pb-4 flex-1">
                        {/* Profile Image */}
                        <div className="relative w-24 h-24 mx-auto mb-4 flex-shrink-0">
                          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-[#9f3562]/20 transition-all duration-300">
                            <img
                              src={mentorCard.image || fallbackImage}
                              className="w-full h-full object-cover object-center"
                              style={{ aspectRatio: '1 / 1' }}
                              onError={(e) => {
                                e.target.src = fallbackImage;
                              }}
                              alt={mentorCard.name || 'Mentor'}
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Mentor Info */}
                        <div className="text-center space-y-2">
                          {/* Username */}
                          {mentorCard.username && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[#9f3562] font-bold text-sm">@{mentorCard.username}</span>
                            </div>
                          )}

                          {/* Name */}
                          <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                            {mentorCard.name}
                          </h3>

                          {/* Tagline */}
                          {mentorCard.tagline && (
                            <p className="text-xs text-gray-600 line-clamp-2 px-2">
                              {mentorCard.tagline}
                            </p>
                          )}

                          {/* College */}
                          {mentorCard.college && (
                            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                              <GraduationCap className="w-3.5 h-3.5 text-[#9f3562] flex-shrink-0" />
                              <p className="text-xs font-medium text-gray-700 line-clamp-1">
                                {mentorCard.college}
                              </p>
                            </div>
                          )}

                          {/* Course Badge */}
                          {mentorCard.course && (
                            <div className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                              {mentorCard.course}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer with CTA */}
                      <div className="px-6 pb-6 pt-2 flex justify-center items-center">
                        <div className='cursor-pointer w-full flex justify-center' onClick={(e) => {
                          e.stopPropagation();
                          if (loggedInAccount) {
                            const mentorIdentifier = mentorCard._id || mentorCard.username;
                            if (mentorIdentifier) {
                              if (user) {
                                navigate(`/chats/${mentorIdentifier}`);
                              } else if (mentor) {
                                navigate(`/mentor/chats/${mentorIdentifier}`);
                              }
                            } else {
                              toast.error('Unable to start chat. Mentor information is missing.', {
                                position: 'top-center',
                              });
                            }
                          } else {
                            navigate('/login');
                            toast.info('Please Login before talking to Mentors', {
                              position: 'top-center',
                            });
                          }
                        }}>
                          <ButtonIcon text={'Chat Now'} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <h4 className='text-xl text-center text-gray-600'>No Mentors found...</h4>
                  <p className="text-sm text-gray-500 mt-2">Check back later for mentors from this college</p>
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
      {showLogin && <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />}
    </section >
  );
}