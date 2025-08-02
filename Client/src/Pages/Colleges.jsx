import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
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

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
          setColleges(shuffleArray(data));
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
          placeholder='B.Tech colleges...'
        />
        <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-8 w-10'>
          <img draggable="false" src={SearchLogo} alt="Search" />
        </button>
      </div>
      <div className='w-full lg:p-3 flex justify-evenly flex-wrap lg:gap-10'>
        {colleges.map(
          (college) => (
            <Link to={`/colleges/${college._id}`} key={college._id}>
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-primary rounded-2xl mb-5 px-2 py-1 shadow-3d w-30 sm:w-50 hover:scale-105 transition-transform duration-200 h-[250px] md:h-[300px] flex flex-col gap-1 sm:justify-evenly">
                <img src={college.logo} alt={college.name} className="mx-auto w-15 sm:w-20" />

                <div className = {`${college.name.length>20? 'text-[12px] lg:text-[14px]':'text-[12px]'} text-tprimary  font-bold mt-2 text-center`}>
                  {college.name}
                </div>

                <div className={`text-tsecondary ${college.location.length>30?'text-[8px] md:text-[10px] lg:text-[12px]':'text-[13px]'}  text-center`}>
                  {college.location}
                </div>

                <div className="text-rating font-semibold text-sm text-center ">
                  ⭐ {college.rating?.overall || 'N/A'}
                </div>

                <div className="hidden text-sm text-tsecondary space-y-1 overflow-hidden">
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