import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt } from "react-icons/fa";
import { FaBriefcase, FaBuilding, FaLocationDot, FaStar } from "react-icons/fa6";
import Tabs from '../components/Tabs';


const InfoPod = ({ Icon, value }) => {
  // Format the value if it's a number
  const displayValue = typeof value === 'number' ? value.toFixed(1) : value;

  return (
    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d">
      <span className="text-thead1 text-[10px] sm:text-[12px] md:text-[16px]">
        <Icon />
      </span>
      <span className="text-[10px] sm:text-[12px] md:text-[16px] text-gray-700 whitespace-nowrap">
        {displayValue}
      </span>
    </div>
  );
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

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

  const infoPods = [
    { Icon: FaLocationDot, key: 'location' },
    { Icon: FaCalendarAlt, key: 'establishedYear', prefix: 'Est. ' },
    { Icon: FaBuilding, key: 'type' },
    { Icon: FaStar, key: 'rating.overall', suffix: '/5' },
    { Icon: FaBriefcase, key: 'placementRate', suffix: '' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.header
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}>
        <div className="w-full h-fit relative">
          <div
            className="w-fit h-fit mx-auto py-10 sm:py-20 bg-cover bg-center transition-transform duration-300"
          >
            <div className="container mx-auto w-fit h-full flex flex-col sm:flex-row items-center justify-center gap-8">
              <img
                src={college.logo}
                alt={college.name}
                className="w-25 h-25 sm:h-32 sm:w-32 object-contain bg-white rounded-2xl transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  console.log('Error loading logo:', e);
                }}
              />
              <h1 className="w-fit mx-auto text-3xl sm:text-5xl text-center text-tprimary font-bold">{college.name}</h1>
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
      <main className="w-full mx-auto px-1 sm:px-4 py-8">
        <Tabs college={college} />
      </main>
    </div>
  );
};

export default CollegeDetailed;