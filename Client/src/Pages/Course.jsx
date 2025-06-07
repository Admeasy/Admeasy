import React, { useState, useEffect } from 'react'
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png"
import { FaLocationDot } from "react-icons/fa6";
import { FaClock } from "react-icons/fa";
import { LuDock } from "react-icons/lu";
import { FaStar } from "react-icons/fa";
import Section from '../components/Section'
import { motion } from 'framer-motion';
import { useParams, useLocation } from 'react-router-dom';


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Course = () => {
  const { collegeId, courseId } = useParams();
  const location = useLocation();
  const [college, setCollege] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Process URL parameters

    if (!collegeId || !courseId) {
      setError('Missing required parameters: collegeId or courseId');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch college data
        const collegeResponse = await fetch(`/api/colleges/${collegeId}`);
        if (!collegeResponse.ok) {
          throw new Error(`Failed to fetch college data (${collegeResponse.status})`);
        }
        const collegeData = await collegeResponse.json();
        setCollege(collegeData);

        // Fetch course data
        const courseResponse = await fetch(`/api/colleges/${collegeId}/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course data (${courseResponse.status})`);
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);

      } catch (err) {
        console.error('Error details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collegeId, courseId, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Data</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!college || !course) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-700">No Data Available</h1>
          <p className="text-gray-600">The requested college or course information could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen'>
      <motion.header
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className='p-2 sm:p-3 mt-2 sm:mt-4 mx-auto flex justify-center rounded-lg sm:rounded-2xl flex-col shadow-3d w-4/5'>
        <div className='relative w-full aspect-[2/1] bg-center bg-cover rounded-lg sm:rounded-2xl overflow-hidden' style={{ backgroundImage: `url(${college.image || medicaps})` }}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="!h-fit absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 !w-4/5 sm:!w-fit lg:w-fit flex flex-row items-center justify-center gap-2 sm:gap-6 p-2 sm:p-6 rounded-xl bg-white/60 backdrop-blur-xs shadow-md mx-auto">
            {/* Logo */}
            <img
              draggable="false"
              src={college.logo || MediLogo}
              alt="College Logo"
              className="size-14 sm:size-16 md:size-24 lg:size-28 rounded-lg sm:rounded-2xl object-cover"
            />

            {/* Text Content */}
            <div className="w-fit !text-center max-[400px]:text-left sm:text-left">
              <h1 className="!w-fit !mx-auto max-[400px]:!text-sm !text-lg sm:!text-lg md:!text-xl lg:!text-2xl !font-admeasy-bold sm:!font-admeasy-extrabold text-tprimary !mb-1 sm:!mb-2 md:!mb-3">
                {course.title}
              </h1>
              <h2 className="!w-fit !mx-auto max-[400px]:!hidden !text-base md:!text-lg lg:!text-xl text-tsecondary font-admeasy">
                {college.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-around bg-primary mt-2 p-2 sm:p-4 rounded-lg sm:rounded-xl">
          {/* Location */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-thead1 text-[10px] sm:text-[12px] md:text-[16px]"><FaLocationDot /></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700 whitespace-nowrap'>{college.location}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-thead1 text-[10px] sm:text-[12px] md:text-[16px]"><FaClock /></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>{course.duration} Years</span>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-thead1 text-[10px] sm:text-[12px] md:text-[16px]"><LuDock /></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>{college.type}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-3d">
            <span className="text-thead1 text-[10px] sm:text-[12px] md:text-[16px]"><FaStar /></span>
            <span className='text-[10px] sm:text-[12px] md:text-[16px] text-gray-700'>{typeof course.rating === 'number' ? course.rating.toFixed(1) : "N/A"}</span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="w-full !mt-10 px-3 sm:px-6 md:px-12 lg:px-28 py-5 sm:py-10 flex flex-col items-center gap-10 sm:gap-20 relative z-40">
        {/* About Section */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">About {course.title}</h2>
          <p className="text-sm sm:text-base md:text-xl text-gray-700 px-2 sm:px-4">
            {course.desc || "Description not available"}
          </p>
        </Section>

        {/* Fee Structure */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">Fee Structure</h2>
          <div className="w-full overflow-x-auto rounded-lg sm:rounded-2xl shadow-3d bg-white">
            <table className="w-full text-xs sm:text-sm text-center border-separate border-spacing-0">
              <thead className="bg-gray-300 text-gray-700 font-semibold">
                <tr>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Fee Type</th>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Per Year</th>
                  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 bg-white">
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">Tuition Fee</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">₹{course.feeStructure?.feePerSemester * 2}</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">₹{(course.feeStructure?.feePerSemester * 2 * course.duration)?.toLocaleString()}</td>
                </tr>
                {course.feeStructure?.additionals && Object.entries(course.feeStructure.additionals)
                  .filter(([key, value]) => 
                    value && 
                    value > 0 && 
                    typeof key === 'string' && 
                    isNaN(key)
                  )
                  .map(([key, value]) => {
                  const isOneTime = key.toLowerCase().includes('one time');
                  return (
                    <tr key={key} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">{key}</td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">
                        {isOneTime ? '-' : `₹${value}`}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">
                        ₹{isOneTime ? value : ((value * course.duration).toLocaleString())}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className='bg-gray-300 text-gray-700 font-semibold'>
                <tr>
                  <td colSpan={2} className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">Total</td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 text-center">
                    ₹{(() => {
                      const tuitionTotal = (course.feeStructure?.feePerSemester * 2 * course.duration) || 0;
                      const additionalsTotal = course.feeStructure?.additionals
                        ? Object.entries(course.feeStructure.additionals)
                            .filter(([key, value]) => 
                              value && 
                              value > 0 && 
                              typeof key === 'string' && 
                              isNaN(key)
                            )
                            .reduce((sum, [key, value]) => {
                              const isOneTime = key.toLowerCase().includes('one time');
                              return sum + (isOneTime ? value : value * course.duration);
                            }, 0)
                        : 0;
                      return (tuitionTotal + additionalsTotal).toLocaleString();
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>

        {/* Scholarships */}
        <Section>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4">Scholarships</h2>
          <div className="w-full overflow-x-auto rounded-lg sm:rounded-2xl shadow-3d bg-white">
            <table className="w-full min-w-[300px] text-xs sm:text-sm md:text-base text-center border-separate border-spacing-0">
              <thead className="bg-gray-300 text-gray-700 font-semibold">
                <tr>
                  <th scope="col" className="px1 text-[12px] sm:px-6 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Scholarship</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 py-1 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Eligibility</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 py-1 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">Benefit</th>
                  <th scope="col" className="px-1 text-[12px] sm:px-6 sm:py-4 border-b border-gray-200 whitespace-nowrap text-center">How to Apply</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-800">
                {course.scholarships?.map((scholarship, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200 text-center">{scholarship.name}</td>
                    <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200 text-center">{scholarship.eligibilityCriteria}</td>
                    <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200 text-center">{scholarship.benefit}</td>
                    <td className="px-2 sm:px-6 py-1 text-[12px] sm:text-[14px] md:text-[16px] sm:py-4 border-b border-gray-200 text-center">{scholarship.howToApply}</td>
                  </tr>
                )) || (
                    <tr>
                      <td colSpan="4" className="px-2 sm:px-6 py-4 text-center text-gray-500">No scholarship information available</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  )
}

export default Course