import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import medicaps from '../assets/CollegesImg/medicapsimage.jpg'
import { FaBuilding, FaDochub, FaLocationDot, FaPage4, FaPager, FaStar } from "react-icons/fa6";
import CollegeCard from '../components/CollegeCard';
import Tabs from '../components/Tabs';
import { FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLocation } from "react-router-dom";


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const CollegeDetailed = () => {
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  const { id } = useParams(); // Get the college ID from the URL
  console.log('component mounted with: ' + id);

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname])

  useEffect(() => {
    setLoading(true);
    fetch(`/api/colleges/${id}`).then(res => res.json()).then((data) => {
      setCollege(data);
      setLoading(false);
      console.log('College fetched...');
    }).catch(err => {
      console.error('Error: ' + err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!college) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-xl text-red-500">Failed to load college data</div>
    </div>;
  }

  return (
    <>
      <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: 'easeOut' }} className='pb-4 w-[95%] m-auto'>
        <div className='p-3 mt-4 mx-auto bg-primary flex justify-center rounded-2xl flex-col shadow-3d-4'>
          <div className='w-full h-full'>
            <div className='w-full h-[60vh] bg-cover rounded-2xl' style={{ backgroundImage: `url(${medicaps})` }}>
              <div className="w-full h-full bg-linear-to-b from-black/20 to-black/60 flex items-center justify-center gap-8 rounded-2xl">
                <img className='h-30 aspect-square rounded-2xl' src={college.logo} alt={college.name} />
                <h1 className='text-5xl text-white font-admeasy-extrabold'>{college.name}</h1>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center justify-around bg-primary p-4 rounded-xl">
            {/* Item 1 */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-md text-thead2">
              <span className="text-icon font-semibold"><FaLocationDot /></span>
              <span>{college.location}</span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-md text-thead2">
              <span className="text-icon font-semibold"><FaCalendarAlt /></span>
              <span>{college.establishedYear}</span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-md text-thead2">
              <span className="text-icon font-semibold"><FaBuilding /></span>
              <span>{college.type}</span>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-3d text-md text-thead2">
              <span className="text-icon font-semibold"><FaStar /></span>
              <span>{college?.rating?.overall}</span>
            </div>
          </div>
        </div>
      </motion.div>
      <Tabs college={college} />
      <CollegeCard data={college} />
    </>
  )
}

export default CollegeDetailed