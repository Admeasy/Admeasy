import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import medicaps from '../assets/CollegesImg/medicapsimage.jpg';
import MediLogo from "../assets/CollegesImg/MediCapsUniversityLogo.png";
import { FaCalendarAlt } from "react-icons/fa";
import { FaBriefcase, FaBuilding, FaLocationDot, FaStar } from "react-icons/fa6";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { BsBookmarkStarFill } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import CustomButton from '../HomeComponents/3d-btn';
import StudentSwiper from '../components/StudentSwiper';
import Courses from '../components/Courses';
import CollegeCard from '../components/CollegeInfoCard';
import Tabs from '../components/Tabs';
const CollegeDetailed = () => {
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  },);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const response = await fetch(`/api/colleges/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch college data (${response.status})`);
        }
        const data = await response.json();
        setCollege(data);
      } catch (err) {
        console.error('Error fetching college data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollege();
  }, [id]);

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
          <h1 className="text-2xl font-bold text-red-500 mb-4">Unable to Load College Data</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-700">No College Data Available</h1>
        </div>
      </div>
    );
  }

  // Helper function to safely get nested object values
  const getValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || 'N/A';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.header
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}>
        <div className="w-full h-[60vh] relative">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-300"
            style={{ backgroundImage: `url(${medicaps})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60">
              <div className="container mx-auto h-full flex flex-col sm:flex-row items-center justify-center gap-8">
                <img
                  src={college.logo || MediLogo}
                  alt={college.name}
                  className="w-25 h-25 sm:h-32 sm:w-32 object-contain bg-white rounded-2xl transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.target.src = MediLogo;
                  }}
                />
                <h1 className="w-fit mx-auto text-3xl sm:text-5xl text-center text-white font-bold">{college.name}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Info Pods */}
        <div className="w-full bg-primary -mt-8 relative rounded-b-2xl">
          <div className="w-full mx-auto">
            <div className="w-full flex flex-wrap gap-4 sm:gap-0 justify-evenly py-6">
              {infoPods.map(({ Icon, key, prefix = '', suffix = '' }) => (
                <InfoPod
                  key={key}
                  Icon={Icon}
                  value={`${prefix}${getValue(college, key)}${suffix}`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tabs Section */}
      <section className="container mx-auto px-2 sm:px-4 py-8">
        <Tabs college={college} />
      </section>

      {/* College Card Section */}
      <section className="container mx-auto px-4 py-8">
        <CollegeCard data={college} />
      </section>
    </div>
  );
};

export default CollegeDetailed;