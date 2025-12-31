import { useState, useEffect, useRef } from 'react'
import { BsThreeDotsVertical } from "react-icons/bs";
import { useLocation, useNavigate } from 'react-router-dom'
import ReactPaginate from 'react-paginate';
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'
import { FaShareAlt } from "react-icons/fa";
import { GraduationCap, MapPin, Award, Building2, TrendingUp } from 'lucide-react';
import SharePopUp from '../components/SharePopUp';
import SEO from '../components/SEO';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

// Skeleton Loader Component
const CollegeCardSkeleton = () => (
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 animate-pulse h-full flex flex-col">
    {/* Badges Skeleton */}
    <div className="flex gap-2 mb-3 flex-shrink-0">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </div>
    {/* Logo Skeleton */}
    <div className="flex justify-center mb-3 flex-shrink-0">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl"></div>
    </div>
    {/* Name Skeleton */}
    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2 min-h-[2.5rem] flex-shrink-0"></div>
    {/* Location Skeleton */}
    <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-3 min-h-[1.25rem] flex-shrink-0"></div>
    {/* Spacer */}
    <div className="flex-1"></div>
    {/* Rating Skeleton */}
    <div className="h-6 bg-gray-200 rounded-lg w-24 mx-auto mb-2 flex-shrink-0"></div>
    {/* Package placeholder */}
    <div className="h-[2.25rem] flex-shrink-0"></div>
  </div>
);

// Badge Component for Progressive Disclosure
const InfoBadge = ({ icon: Icon, label, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-50 text-gray-700 border-gray-200',
    primary: 'bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 text-[#9f3562] border-[#9f3562]/20',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
};

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sharePopupCollege, setSharePopupCollege] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);
  const limit = 23;

  const location = useLocation();
  const navigate = useNavigate();
  const menuRefs = useRef({});
  
  const searchParams = new URLSearchParams(location.search);
  const initialSearchQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId].contains(e.target)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchColleges = async (page = 1, query = '') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/colleges?page=${page}&limit=${limit}&search=${query}`);
      const data = await response.json();
      setColleges(data.colleges || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalColleges(data.total || 0);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMenu = (collegeId, e) => {
    e.stopPropagation();
    setOpenMenuId(collegeId);
  };

  const handleViewCollege = (collegeId, e) => {
    e.preventDefault();
    setOpenMenuId(null);
    navigate(`/colleges/${collegeId}`);
  };

  const handleShareCollege = (college, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setSharePopupCollege(college);
  };

  const [placeholder, setPlaceholder] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const placeholders = [
    "Search IIT Indore...",
    "Search IIM Ahmedabad",
    "Search Shri Ram College of Commerce",
    "Search Delhi University...",
    "Find Your Dream College..."
  ];

  useEffect(() => {
    const currentText = placeholders[textIndex];
    
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setIsDeleting(true);
        return;
      }
      
      if (!isDeleting && charIndex < currentText.length) {
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (!isDeleting && charIndex === currentText.length) {
        setIsPaused(true);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setTextIndex((textIndex + 1) % placeholders.length);
      }
    }, isPaused ? 2000 : isDeleting ? 40 : 20);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, isPaused]);

  return (
    <>
      <SEO
        title="Colleges in India - Search & Compare | Admeasy"
        description="Search and compare top colleges in India. Find detailed information about IITs, IIMs, DU colleges, engineering colleges, medical colleges and more."
        keywords="colleges in India, IIT colleges, IIM colleges, DU colleges, engineering colleges, medical colleges, college search, college comparison"
        url="https://admeasy.in/colleges"
      />
      <div className="transition-all duration-300 min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        {/* Enhanced Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>
        {/* Search bar */}
        <div className="w-full max-w-4xl mx-auto m-0 my-8 p-4 flex items-center justify-center relative z-10">
          <div className="relative w-full">
          <input
            name='search'
            value={searchQuery}
            onChange={handleSearch}
              className='pl-12 pr-4 py-4 w-full bg-white rounded-2xl text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base lg:text-lg' 
            type="text" 
            placeholder={placeholder} 
          />
            <button className='cursor-pointer absolute left-4 top-1/2 -translate-y-1/2'>
              <img draggable="false" src={SearchLogo} alt="Search" className='w-5 h-5 sm:w-6 sm:h-6' />
          </button>
          </div>
        </div>

        {/* Share popup */}
        {sharePopupCollege && (
          <SharePopUp 
            isOpen={true} 
            college={`https://admeasy.in/colleges/${sharePopupCollege._id}`} 
            CollegeName={sharePopupCollege.name} 
            onClose={() => setSharePopupCollege(null)} 
          />
        )}

        {/* Cards - Mobile-first with scroll snapping */}
        <div className='w-full max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 min-h-[400px] relative z-10 snap-y snap-mandatory sm:snap-none'>
          {loading ? (
            <>
              {[...Array(10)].map((_, index) => (
                <CollegeCardSkeleton key={index} />
              ))}
            </>
          ) : colleges.length > 0 ? (
            colleges.map((college, index) => {
              const rating = college.rating?.overall || 0;
              const isTopRated = rating >= 4.0;
              const currentYear = new Date().getFullYear();
              const establishedYear = typeof college.establishedYear === 'number' ? college.establishedYear : parseInt(college.establishedYear);
              const isEstablished = establishedYear && !isNaN(establishedYear) && (currentYear - establishedYear) >= 50;
              
              return (
                <motion.div
                  key={college._id}
                  variants={fadeUpVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
                  className="relative snap-start h-full"
                >
                  <motion.div
                  onClick={(e) => handleViewCollege(college._id, e)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 hover:shadow-xl hover:border-[#9f3562]/30 transition-all duration-300 cursor-pointer group active:scale-[0.98] h-full flex flex-col"
                  >
                    {/* Top Badges Row - Progressive Disclosure */}
                    <div className="flex items-start justify-between mb-3 gap-2 flex-shrink-0">
                      <div className="flex flex-wrap gap-1.5 flex-1 min-h-[1.75rem]">
                        {/* Type Badge */}
                        {college.type && (
                          <InfoBadge 
                            icon={Building2} 
                            label={college.type} 
                            variant={college.type === 'Public' ? 'primary' : 'default'}
                          />
                        )}
                        {/* Top Rated Badge */}
                        {isTopRated && (
                          <InfoBadge 
                            icon={Award} 
                            label="Top Rated" 
                            variant="success"
                          />
                        )}
                        {/* Established Badge */}
                        {isEstablished && college.establishedYear && (
                          <InfoBadge 
                            icon={TrendingUp} 
                            label={`Est. ${college.establishedYear}`} 
                            variant="warning"
                          />
                        )}
                  </div>

                      {/* Menu Button - Thumb-friendly position */}
                  <button
                    onClick={(e) => toggleMenu(college._id, e)}
                        className='flex-shrink-0 hover:bg-gray-100 active:bg-gray-200 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#9f3562] touch-manipulation'
                    title="More options"
                        aria-label="More options"
                  >
                        <BsThreeDotsVertical size={16} />
                  </button>
                    </div>

                    {/* College Logo - Optimized for mobile */}
                    <div className="flex justify-center mb-3 flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-100 group-hover:border-[#9f3562]/20 transition-colors"
                      >
                        <img 
                          src={college.logo} 
                          alt={college.name} 
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/96x96/EEE/AAA?text=Logo';
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* College Name - Clear hierarchy */}
                    <h3 className={`${college.name.length > 30 ? 'text-sm' : 'text-base'} font-admeasy-bold text-gray-900 text-center line-clamp-2 mb-2 group-hover:text-[#9f3562] transition-colors min-h-[2.5rem] flex items-center justify-center flex-shrink-0`}>
                      {college.name}
                    </h3>

                    {/* Location - Icon-based for clarity */}
                    <div className="flex items-center justify-center gap-1.5 mb-3 text-gray-600 text-xs sm:text-sm flex-shrink-0 min-h-[1.25rem]">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-1 text-center">{college.location}</span>
                    </div>

                    {/* Spacer to push rating to bottom */}
                    <div className="flex-1"></div>

                    {/* Rating Badge - Prominent but not overwhelming */}
                    <div className="flex items-center justify-center mb-2 flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 rounded-lg border border-[#9f3562]/20"
                      >
                        <GraduationCap className="w-4 h-4 text-[#9f3562]" />
                        <span className="text-[#9f3562] font-semibold text-sm">
                          {rating > 0 ? rating.toFixed(1) : 'N/A'}
                        </span>
                        {rating > 0 && (
                          <span className="text-[#9f3562]/70 text-xs">/5.0</span>
                        )}
                      </motion.div>
                    </div>

                    {/* Quick Info Hint - Progressive Disclosure */}
                    {college.package?.average ? (
                      <div className="mt-auto pt-3 border-t border-gray-100 text-center flex-shrink-0">
                        <p className="text-xs text-gray-500">
                          Avg. Package: <span className="font-semibold text-gray-700">{college.package.average}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="h-[2.25rem] flex-shrink-0"></div>
                    )}
                </motion.div>

                  {/* Dropdown Menu */}
                {openMenuId === college._id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    ref={(el) => menuRefs.current[college._id] = el}
                      className='absolute top-20 right-3 bg-white rounded-xl shadow-xl z-50 w-44 border border-gray-100 overflow-hidden'
                  >
                    <button
                      onClick={(e) => handleViewCollege(college._id, e)}
                        className='w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-[#9f3562]/10 hover:to-[#b14270]/10 transition-colors text-gray-800 font-medium text-sm active:bg-[#9f3562]/20'
                    >
                      View College
                    </button>
                      <div className='border-t border-gray-100'></div>
                    <button
                      onClick={(e) => handleShareCollege(college, e)}
                        className='w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-[#9f3562]/10 hover:to-[#b14270]/10 transition-colors text-gray-800 font-medium text-sm flex items-center gap-2 active:bg-[#9f3562]/20'
                    >
                        <FaShareAlt size={14} className="text-[#9f3562]" /> Share College
                    </button>
                    </motion.div>
                )}
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col justify-center items-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No colleges found</p>
              {searchQuery && (
                <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
              )}
            </div>
          )}
        </div>

        {/* Pagination with ReactPaginate */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="flex justify-center mt-10 mb-12 relative z-10"
          >
            <ReactPaginate
              breakLabel="..."
              nextLabel={
                <span className="flex items-center gap-1 font-medium">
                  Next <span className="text-lg">→</span>
                </span>
              }
              previousLabel={
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-lg">←</span> Prev
                </span>
              }
              onPageChange={handlePageClick}
              pageRangeDisplayed={5}
              marginPagesDisplayed={0}
              pageCount={totalPages}
              forcePage={currentPage - 1} // Adjust for 0-based index
              renderOnZeroPageCount={null}
              containerClassName="
                flex flex-wrap items-center justify-center gap-3
                bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm
                px-5 py-3 rounded-2xl shadow-md border
                border-gray-200/60 dark:border-gray-700/50
              "
              pageLinkClassName="
                flex items-center justify-center w-10 h-10
                rounded-xl font-medium text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-gray-600
                cursor-pointer transition-all duration-300
                hover:-translate-y-0.5 hover:bg-[#9f3562]/10 dark:hover:bg-[#9f3562]/20
                hover:text-[#9f3562] dark:hover:text-[#9f3562]
              "
              activeLinkClassName="
                bg-gradient-to-r from-[#9f3562] to-[#b14270]
                text-white border-[#9f3562] shadow-[0_0_15px_-4px_rgba(159,53,98,0.5)]
                scale-105
              "
              previousLinkClassName="
                flex items-center justify-center px-4 h-10 rounded-xl
                font-semibold text-gray-700 dark:text-gray-200
                border border-gray-300 dark:border-gray-600 cursor-pointer
                transition-all duration-300 hover:-translate-y-0.5
                hover:bg-[#9f3562]/10 dark:hover:bg-[#9f3562]/20
                hover:text-[#9f3562] dark:hover:text-[#9f3562]
              "
              nextLinkClassName="
                flex items-center justify-center px-4 h-10 rounded-xl
                font-semibold text-gray-700 dark:text-gray-200
                border border-gray-300 dark:border-gray-600 cursor-pointer
                transition-all duration-300 hover:-translate-y-0.5
                hover:bg-[#9f3562]/10 dark:hover:bg-[#9f3562]/20
                hover:text-[#9f3562] dark:hover:text-[#9f3562]
              "
              disabledClassName="
                opacity-40 cursor-not-allowed
                hover:translate-y-0 hover:bg-transparent hover:text-gray-400
              "
              breakLinkClassName="flex items-center justify-center w-8 h-10 text-gray-400 select-none"
            />
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Colleges;