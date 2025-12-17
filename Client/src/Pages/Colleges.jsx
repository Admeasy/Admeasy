import { useState, useEffect, useRef } from 'react'
import { BsThreeDotsVertical } from "react-icons/bs";
import { useLocation, useNavigate } from 'react-router-dom'
import ReactPaginate from 'react-paginate';
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'
import { FaShareAlt } from "react-icons/fa";
import SharePopUp from '../components/SharePopUp';
import SEO from '../components/SEO';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

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
      {/* Updated Wrapper:
        - lg:ml-72: Pushed 288px right on desktop
        - ml-0: Full width on mobile/tablet
      */}
      <div className="lg:ml-72 ml-0 transition-all duration-300">
        {/* Search bar */}
        <div className="w-full m-0 my-4 p-4 flex items-center justify-center relative">
          <input
            name='search'
            value={searchQuery}
            onChange={handleSearch}
            className='pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-10 md:h-9 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]' 
            type="text" 
            placeholder={placeholder} 
          />
          <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-4 sm:right-8 w-10'>
            <img draggable="false" src={SearchLogo} alt="Search" className='size-8 sm:size-12' />
          </button>
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

        {/* Cards */}
        <div className='w-full p-3 px-5 flex justify-evenly flex-wrap gap-10 min-h-[400px]'>
          {loading ? (
            <div className="w-full flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 text-lg">Loading colleges...</p>
            </div>
          ) : colleges.length > 0 ? (
            colleges.map((college) => (
              <div key={college._id} className="relative">
                <motion.div
                  variants={fadeUpVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  onClick={(e) => handleViewCollege(college._id, e)}
                  className="bg-primary rounded-2xl mb-5 px-2 py-1 shadow-3d w-30 sm:w-50 hover:scale-105 transition-transform duration-200 h-[250px] md:h-[300px] flex flex-col gap-1 sm:justify-evenly cursor-pointer"
                >
                  <img src={college.logo} alt={college.name} className="mx-auto w-15 sm:w-20" />

                  <div className={`${college.name.length > 20 ? 'text-[12px] lg:text-[14px]' : 'text-[12px]'} text-tprimary font-bold mt-2 text-center`}>
                    {college.name}
                  </div>

                  <div className={`text-tsecondary ${college.location.length > 30 ? 'text-[8px] md:text-[10px] lg:text-[12px]' : 'text-[13px]'} text-center`}>
                    {college.location}
                  </div>

                  <div className="text-rating font-semibold text-sm text-center">
                    ⭐ {college.rating?.overall || 'N/A'}
                  </div>

                  <button
                    onClick={(e) => toggleMenu(college._id, e)}
                    className='absolute top-5 right-2 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors'
                    title="More options"
                  >
                    <BsThreeDotsVertical size={17} />
                  </button>
                </motion.div>

                {openMenuId === college._id && (
                  <div
                    ref={(el) => menuRefs.current[college._id] = el}
                    className='absolute top-12 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 w-40 border border-gray-200 dark:border-gray-700'
                  >
                    <button
                      onClick={(e) => handleViewCollege(college._id, e)}
                      className='w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors text-gray-800 dark:text-gray-200'
                    >
                      View College
                    </button>
                    <div className='border-t border-gray-200 dark:border-gray-700'></div>
                    <button
                      onClick={(e) => handleShareCollege(college, e)}
                      className='w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors text-gray-800 dark:text-gray-200 flex items-center gap-2'
                    >
                      <FaShareAlt size={14} /> Share College
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col justify-center items-center py-20">
              <p className="text-gray-500 text-xl mb-2">No colleges found</p>
              {searchQuery && (
                <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
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
            className="flex justify-center mt-10 mb-12"
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
                hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40
                hover:text-blue-600 dark:hover:text-blue-400
              "
              activeLinkClassName="
                bg-gradient-to-r from-blue-600 to-indigo-600
                text-white border-blue-600 shadow-[0_0_15px_-4px_rgba(59,130,246,0.5)]
                scale-105
              "
              previousLinkClassName="
                flex items-center justify-center px-4 h-10 rounded-xl
                font-semibold text-gray-700 dark:text-gray-200
                border border-gray-300 dark:border-gray-600 cursor-pointer
                transition-all duration-300 hover:-translate-y-0.5
                hover:bg-blue-50 dark:hover:bg-blue-950/40
                hover:text-blue-600 dark:hover:text-blue-400
              "
              nextLinkClassName="
                flex items-center justify-center px-4 h-10 rounded-xl
                font-semibold text-gray-700 dark:text-gray-200
                border border-gray-300 dark:border-gray-600 cursor-pointer
                transition-all duration-300 hover:-translate-y-0.5
                hover:bg-blue-50 dark:hover:bg-blue-950/40
                hover:text-blue-600 dark:hover:text-blue-400
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