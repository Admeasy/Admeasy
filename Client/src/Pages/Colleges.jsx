import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Colleges = () => {
  const [colleges, setColleges] = useState([])
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearchQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Helper function to safely convert any value to string
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };

  // Helper function to check if any search term matches any field
  const matchesSearchTerms = (college, searchTerms) => {
    // Safely extract course information
    const courseInfo = (college.courses || []).map(course => [
      course?.title,
      course?.duration
    ]).flat();

    // Create array of searchable fields
    const fieldsToSearch = [
      college.name,
      college.location,
      college.type,
      college.desc,
      college.establishedYear,
      ...courseInfo,
      ...(college.keywords || [])
    ]
    .filter(Boolean) // Remove null/undefined values
    .map(safeToString); // Convert all values to lowercase strings

    // Check if all search terms match at least one field
    return searchTerms.every(term =>
      fieldsToSearch.some(field => field.includes(term))
    );
  };

  // Fetching colleges from the server
  useEffect(() => {
    async function fetchColleges() {
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();
        
        // If there's a search query, filter the results
        if (searchQuery) {
          // Split the search query into terms and remove empty strings
          const searchTerms = String(searchQuery)
            .toLowerCase()
            .split(/[\s,]+/)
            .filter(term => term.length > 0);
          
          const filteredColleges = data.filter(college => 
            matchesSearchTerms(college, searchTerms)
          );
          setColleges(filteredColleges);
        } else {
          setColleges(data);
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    }
    fetchColleges();
  }, [searchQuery]);

  const handleSearch = (e) => {
const query = e.target.value;
    setSearchQuery(query);
    }

  return (
    <>
      <div className="w-full m-0 my-4 p-4 flex items-center justify-center">
        <input 
          name='search' 
          value={searchQuery}
          onChange={handleSearch}
          className='pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-10 md:h-9 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]' 
          type="text" 
          placeholder='Search Best B.Tech colleges near me...' 
        />
        <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-8 w-10'>
          <img draggable="false" src={SearchLogo} alt="Search" />
        </button>
      </div>
      <div className='w-full p-3 flex justify-evenly flex-wrap gap-10'>
        {colleges.map(
          (college) => (
            <Link to={`/colleges/${college._id}`} key={college._id}>
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-primary rounded-2xl p-4 shadow-3d w-70 hover:scale-105 transition-transform duration-200 h-[500px] flex flex-col justify-between">
                <img src={college.logo} alt={college.name} className="h-16 mx-auto" />

                <div className="text-tprimary text-lg font-bold mt-4 text-center">
                  {college.name}
                </div>

                <div className="text-tsecondary text-sm text-center">
                  {college.location}
                </div>

                <div className="text-rating font-semibold text-sm text-center mt-1">
                  ⭐ {college.rating?.overall || 'N/A'}
                </div>

                <div className="text-sm text-tsecondary mt-4 space-y-1 overflow-hidden">
                  <p>
                    <span className="font-semibold text-tprimary">Established:</span> {college.establishedYear}
                  </p>
                  <p>
                    <span className="font-semibold text-tprimary">Type:</span> {college.type}
                  </p>
                  <p>
                    <span className="font-semibold line-clamp-3 text-tprimary">Description:</span> {college.desc.split(' ').slice(0, 20).join(' ')}...
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
      </div>
    </>
  )
}

export default Colleges