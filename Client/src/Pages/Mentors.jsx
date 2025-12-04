import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ReactPaginate from 'react-paginate';
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'
import ButtonIcon from '../components/ButtonIcon';
import { useUser } from "../context/UserContext";
import LogIn from "./LogIn"
import { toast } from 'react-toastify';
import SEO from '../components/SEO';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// In-memory cache for mentors data
let mentorsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Skeleton loader component
const MentorCardSkeleton = () => (
    <div className="w-40 sm:w-70 sm:h-70 md:h-85 mt-2 md:mt-4 relative flex flex-col items-center bg-primary rounded-xl shadow-3d p-4 border-none animate-pulse">
        <div className="py-5 flex flex-col space-y-1 w-full">
            <div className="flex flex-col items-center">
                {/* Profile image skeleton */}
                <div className="aspect-square size-20 md:size-24 m-0 mx-auto rounded-full bg-gray-300"></div>
                {/* College logo skeleton */}
                <div className="absolute top-3 left-3 size-10 md:size-14 lg:size-17 rounded-full bg-gray-200"></div>
            </div>
            {/* Text content skeletons */}
            <div className="mt-0 sm:mt-4 gap-2 text-center items-center flex flex-col w-full">
                <div className="h-4 md:h-5 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="absolute bottom-2.5 h-8 bg-gray-300 rounded-full w-24"></div>
            </div>
        </div>
    </div>
);

const Mentors = () => {
    const [currentPage, SetCurrentPage] = useState(0);
    const mentorsPerPage = 14;
    const [mentors, setMentors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();
    const mentorImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useUser();
    const [showLogin, setShowLogin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        SetCurrentPage(0); // Reset to first page when searching
    }

    // Memoize filtered mentors to avoid recalculation on every render
    const filteredMentors = useMemo(() => {
        if (!searchQuery.trim()) return mentors;

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        return mentors.filter(mentor => {
            const name = mentor.name?.toLowerCase() || '';
            const college = typeof mentor.college === 'string' ? mentor.college.toLowerCase() : (mentor.college?.name?.toLowerCase() || '');
            const courseData = typeof mentor.course === 'object' && mentor.course !== null
                ? mentor.course
                : (mentor.course ? (typeof mentor.course === 'string' && mentor.course.startsWith('{') ? JSON.parse(mentor.course) : { name: mentor.course }) : null);
            const course = courseData?.name?.toLowerCase() || courseData?.title?.toLowerCase() || '';
            const university = mentor.university?.toLowerCase() || '';
            const keywords = mentor.keywords?.map(keyword => keyword.toLowerCase()) || [];

            return searchTerms.every(term =>
                name.includes(term) ||
                college.includes(term) ||
                course.includes(term) ||
                university.includes(term) ||
                keywords.some(keyword => keyword.includes(term))
            );
        });
    }, [mentors, searchQuery]);

    function getMentorImageUrl(imageName) {
        if (imageName) {
            const entry = Object.entries(mentorImages).find(([key]) =>
                key.includes(imageName)
            );
            return entry ? entry[1] : fallbackImage;
        } else {
            return fallbackImage
        }
    }

    async function fetchMentorImageUrl(id) {
        try {
            const res = await fetch(`/api/mentors/${id}/pic`);
            const url = await res.json();
            return url || fallbackImage;
        } catch (err) {
            console.error('Error fetching mentor image:', err);
            return fallbackImage;
        }
    }

    async function getCollegeLogo(collegeId) {
        try {
            const response = await fetch(`/api/colleges/${collegeId}`);
            const college = await response.json();
            return college?.logo || null;
        } catch (err) {
            console.error('Error fetching college logo:', err);
            return null;
        }
    }

    useEffect(() => {
        async function fetchMentors() {
            // Check if cache is valid
            const now = Date.now();
            if (mentorsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
                console.log('Using cached mentors data');
                setMentors(mentorsCache);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch both APIs in parallel for better performance
                const [collegesResponse, mentorsResponse] = await Promise.all([
                    fetch(`/api/colleges?page=1&limit=1000`),
                    fetch('/api/mentors/')
                ]);

                const collegesData = await collegesResponse.json();
                const colleges = collegesData.colleges || [];
                const mentorsFromDB = await mentorsResponse.json();

                let allMentors = [];

                // Process college students
                colleges.forEach(college => {
                    if (college.students && college.students.length > 0) {
                        college.students.forEach(mentor => {
                            allMentors.push({
                                ...mentor,
                                college: college.name,
                                collegeLogo: college.logo || '',
                                university: college.affiliation
                            });
                        })
                    }
                });

                // Process mentors from DB with parallel image/logo fetching
                const mentorsWithLogos = await Promise.all(
                    mentorsFromDB.map(async (mentor) => {
                        if (!mentor.name) return '';
                        // Fetch image and logo in parallel
                        const [image, college, course] = await Promise.all([
                            fetchMentorImageUrl(mentor._id),
                            Promise.resolve(
                                typeof mentor.college === 'object' && mentor.college !== null
                                    ? mentor.college
                                    : (mentor.college ? JSON.parse(mentor.college) : null)
                            ),
                            Promise.resolve(
                                typeof mentor.course === 'object' && mentor.course !== null
                                    ? mentor.course
                                    : (mentor.course ? (typeof mentor.course === 'string' && mentor.course.startsWith('{') ? JSON.parse(mentor.course) : { name: mentor.course }) : null)
                            )
                        ]);

                        const logo = college ? await getCollegeLogo(college.id) : null;

                        return {
                            ...mentor,
                            image: image,
                            college: college?.name || mentor.college || '',
                            collegeId: college?.id || '',
                            collegeLogo: logo,
                            course: course?.name || course?.title || mentor.course || ''
                        };
                    })
                );

                allMentors.push(...mentorsWithLogos);

                // Shuffle only once when data is fetched
                const shuffledAllMentors = shuffleArray(allMentors);

                // Update cache
                mentorsCache = shuffledAllMentors;
                cacheTimestamp = Date.now();

                setMentors(shuffledAllMentors);
                setIsLoading(false);
            } catch (err) {
                setError(err);
                setIsLoading(false);
                console.error('Error fetching mentors:', err);
                toast.error('Failed to load mentors. Please try again.');
            }
        }

        fetchMentors();
    }, [])

    const [placeholder, setPlaceholder] = useState("");
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const placeholders = [
        "Search IIT Indore Mentors",
        "Search IIM Ahmedabad Mentors",
        "Search SRCC Mentors",
        "Search Delhi University Mentors",
        "Find Your Dream College Mentors"
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

    // Calculate pagination based on FILTERED mentors
    const offset = currentPage * mentorsPerPage;
    const currentMentors = filteredMentors.slice(offset, offset + mentorsPerPage);
    const pageCount = Math.ceil(filteredMentors.length / mentorsPerPage);

    const handlePageClick = ({ selected }) => {
        SetCurrentPage(selected);
        window.scrollTo({ top: 0, behavior: 'smooth' })
    };

    return (
        <>
            <SEO
                title="Mentors - Connect with Verified Mentors | Admeasy"
                description="Connect with verified mentors from top colleges. Get guidance on college admissions, courses, and career advice from experienced mentors."
                keywords="mentors, college mentors, admission guidance, career counseling, student mentors, education mentors"
                url="https://admeasy.in/mentors"
            />
            <header className="w-full m-0 my-4 p-4 flex items-center justify-center">
                <input
                    name='search'
                    value={searchQuery}
                    onChange={handleSearch}
                    className='pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-10 md:h-9 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]'
                    type="text"
                    placeholder={placeholder}
                />
                <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-4 sm:right-8 w-10'>
                    <img draggable="false" src={SearchLogo} className='size-8 sm:size-12' />
                </button>
            </header>

            <main className="w-full p-3 pb-16 flex justify-evenly flex-wrap gap-10">
                {/* Improved Loading State with Skeleton Cards */}
                {isLoading && (
                    <>
                        {[...Array(14)].map((_, index) => (
                            <MentorCardSkeleton key={index} />
                        ))}
                    </>
                )}

                {/* Error State */}
                {error && (
                    <div className="w-full flex flex-col justify-center items-center py-10 text-red-500">
                        <span className="text-2xl mb-4">Failed to load mentors</span>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* No Results State */}
                {!isLoading && !currentMentors.length && (
                    <div className="w-full flex flex-col justify-center items-center py-10">
                        <span className="text-2xl text-gray-600 mb-2">
                            {searchQuery ? 'No mentors found matching your search' : 'No mentors found'}
                        </span>
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}

                {/* Mentor Cards */}
                {!isLoading && currentMentors.map((mentor) => {
                    return (
                        <motion.div
                            variants={fadeUpVariant}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            key={mentor._id}
                            className={`w-40 sm:w-70 sm:h-70 md:h-85 mt-2 md:mt-4 relative flex flex-col items-center bg-primary rounded-xl shadow-3d p-4 transform hover:scale-105 transition-transform duration-300 ease-in-out border-none ${mentor.username ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (mentor.username) {
                                    navigate(`/mentors/${mentor.username}`);
                                }
                            }}>
                            <div className="py-5 flex flex-col space-y-1">
                                <div>
                                    <img
                                        src={mentor.username ? mentor.image : getMentorImageUrl(mentor.image)}
                                        className="aspect-square size-20 md:size-24 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = fallbackImage;
                                        }} />
                                    <img
                                        draggable="false"
                                        src={mentor.collegeLogo}
                                        alt="College Logo"
                                        loading="lazy"
                                        className="aspect-square absolute top-3 left-3 size-10 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                                    {mentor.university ? (
                                        <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[10.5px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                                            {mentor.university}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-0 sm:mt-4 gap-2 text-center items-center flex flex-col">
                                    {mentor.username ? (<h3 className="text-[14px] md:text-[16px] text-base font-admeasy-extrabold text-tprimary">{mentor.username}</h3>) : ''}
                                    <h3 className="text-[12px] md:text-[14px] text-base font-admeasy-bold text-tsecondary">{mentor.name}</h3>
                                    <p className={'font-medium text-[#39365c] inline-block px-2 py-0.25 sm:py-0.5  bg-gray-100 rounded-xl shadow-sm text-[10px] md:text-[12px]'}>{mentor.college}</p>
                                    {mentor.course && (
                                        <span className={'w-fit text-[10px] md:text-[13px] mx-auto mb-2 inline-block px-2 py-0.25 sm:py-0.5  bg-gray-100 text-[#39365c] font-semibold rounded-xl shadow-sm'}>
                                            {mentor.course}
                                        </span>
                                    )}
                                    <div className='absolute bottom-2.5 cursor-pointer' onClick={(e) => {
                                        e.stopPropagation();
                                        if (user) {
                                            // Navigate to chat page with mentor ID or username
                                            const mentorIdentifier = mentor._id || mentor.username;
                                            navigate(`/chats/${mentorIdentifier}`);
                                        } else {
                                            navigate('/login')
                                            toast.dark('Login to start chatting with mentors', {
                                                position: 'top-center',
                                            });
                                        }
                                    }}>
                                        <ButtonIcon text={'Chat Now'} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </main>

            {/* Pagination */}
            {!isLoading && filteredMentors.length > mentorsPerPage && (
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
                        pageCount={pageCount}
                        forcePage={currentPage}
                        renderOnZeroPageCount={null}
                        containerClassName="flex flex-wrap items-center justify-center gap-3 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-md border border-gray-200/60 dark:border-gray-700/50"
                        pageLinkClassName="flex items-center justify-center w-10 h-10 rounded-xl font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                        activeLinkClassName="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-[0_0_15px_-4px_rgba(59,130,246,0.5)] scale-105"
                        previousLinkClassName="flex items-center justify-center px-4 h-10 rounded-xl font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                        nextLinkClassName="flex items-center justify-center px-4 h-10 rounded-xl font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                        disabledClassName="opacity-40 cursor-not-allowed hover:translate-y-0 hover:bg-transparent hover:text-gray-400"
                        breakLinkClassName="flex items-center justify-center w-8 h-10 text-gray-400 select-none"
                    />
                </motion.div>
            )}
        </>
    )
}

export default Mentors