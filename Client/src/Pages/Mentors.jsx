import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ReactPaginate from 'react-paginate';
import { Search, Users, GraduationCap, MessageCircle, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion'
import ButtonIcon from '../components/ButtonIcon';
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import LogIn from "./LogIn"
import { toast } from 'react-toastify';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// Cache configuration
const CACHE_KEY = 'mentors_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Skeleton Loading Component
const MentorCardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        <div className="relative p-6 pb-4">
            {/* Profile Image Skeleton */}
            <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200"></div>
            </div>
            {/* Name Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            {/* College Skeleton */}
            <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto mb-2"></div>
            {/* Course Skeleton */}
            <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
        {/* Button Skeleton */}
        <div className="px-6 pb-6">
            <div className="h-10 bg-gray-200 rounded-xl"></div>
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
    const { mentor } = useMentor();
    const [showLogin, setShowLogin] = useState(false);
    const navigate = useNavigate();
    const loggedInAccount = user || mentor;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        SetCurrentPage(0);
    }

    // Filter out blank/empty mentors first
    const validMentors = mentors.filter(mentor => {
        // Check if mentor has at least a name (required field)
        const hasName = mentor.name && mentor.name.trim() !== '';
        // Optionally check for other essential fields
        const hasBasicInfo = hasName && (mentor.college || mentor.university || mentor.course);
        return hasBasicInfo;
    });

    const filteredMentors = validMentors.filter(mentor => {
        if (!searchQuery.trim()) return true;

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

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
        const res = await fetch(`/api/mentors/${id}/pic`);
        const url = await res.json();
        return url;
    }

    async function getCollegeLogo(collegeId) {
        const response = await fetch(`/api/colleges/${collegeId}`);
        const college = await response.json();
        if (!college) return null;
        return college.logo;
    }

    useEffect(() => {
        async function fetchMentors() {
            // Check cache first
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const now = Date.now();
                    
                    // If cache is still valid (less than 5 minutes old)
                    if (now - timestamp < CACHE_DURATION) {
                        setMentors(data);
                        setIsLoading(false);
                        // Still update in background
                        fetchMentorsFromAPI(true);
                        return;
                    }
                }
            } catch (err) {
                console.error('Error reading cache:', err);
            }

            // No valid cache, fetch from API
            await fetchMentorsFromAPI(false);
        }

        async function fetchMentorsFromAPI(silentUpdate = false) {
            if (!silentUpdate) setIsLoading(true);
            
            try {
                // Fetch colleges and mentors in parallel
                const [collegesResponse, mentorsResponse] = await Promise.all([
                    fetch(`/api/colleges?page=1&limit=1000`),
                    fetch('/api/mentors/')
                ]);

                const [collegesData, mentorsFromDB] = await Promise.all([
                    collegesResponse.json(),
                    mentorsResponse.json()
                ]);

                const colleges = collegesData.colleges || [];
                let allMentors = [];

                // Process college mentors (synchronous, fast)
                colleges.forEach(college => {
                    if (college.students && college.students.length > 0) {
                        college.students.forEach(mentor => {
                            allMentors.push({
                                ...mentor,
                                college: college.name,
                                collegeLogo: college.logo || '',
                                university: college.affiliation
                            });
                        });
                    }
                });

                // Process DB mentors with optimized parallel fetching
                // First, set basic mentor data immediately for faster initial render
                const mentorsBasic = mentorsFromDB.map((mentor) => {
                        const college = typeof mentor.college === 'object' && mentor.college !== null
                          ? mentor.college
                          : (mentor.college ? JSON.parse(mentor.college) : null);
                        const course = typeof mentor.course === 'object' && mentor.course !== null
                          ? mentor.course
                          : (mentor.course ? (typeof mentor.course === 'string' && mentor.course.startsWith('{') ? JSON.parse(mentor.course) : { name: mentor.course }) : null);
                    
                        return {
                            ...mentor,
                        image: fallbackImage, // Set fallback initially
                            college: college?.name || mentor.college || '',
                            collegeId: college?.id || '',
                        collegeLogo: null, // Will be loaded later
                        course: course?.name || course?.title || mentor.course || '',
                        _tempId: mentor._id // Store original ID for updates
                        };
                });

                allMentors.push(...mentorsBasic);
                let shuffledAllMentors = shuffleArray(allMentors);
                
                // Cache the data
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: shuffledAllMentors,
                        timestamp: Date.now()
                    }));
                } catch (err) {
                    console.error('Error caching mentors:', err);
                }
                
                // Set mentors immediately for faster initial render
                setMentors(shuffledAllMentors);
                setIsLoading(false);

                // Then fetch images and logos in background (non-blocking)
                if (mentorsFromDB.length > 0) {
                    // Batch fetch images and logos with Promise.allSettled for better error handling
                    const mentorUpdates = await Promise.allSettled(
                        mentorsFromDB.map(async (mentor) => {
                            try {
                                const college = typeof mentor.college === 'object' && mentor.college !== null
                                    ? mentor.college
                                    : (mentor.college ? JSON.parse(mentor.college) : null);
                                
                                const [image, collegeLogo] = await Promise.all([
                                    fetchMentorImageUrl(mentor._id).catch(() => fallbackImage),
                                    college ? getCollegeLogo(college.id).catch(() => null) : Promise.resolve(null)
                                ]);

                                return {
                                    mentorId: mentor._id,
                                    image,
                                    collegeLogo
                                };
                            } catch (err) {
                                return {
                                    mentorId: mentor._id,
                                    image: fallbackImage,
                                    collegeLogo: null
                                };
                            }
                        })
                    );

                    // Update mentors with fetched images/logos
                    setMentors(prevMentors => {
                        const updated = prevMentors.map(mentor => {
                            // Match by _id or _tempId
                            const update = mentorUpdates.find(u => 
                                u.status === 'fulfilled' && 
                                (u.value?.mentorId === mentor._id || u.value?.mentorId === mentor._tempId)
                            );
                            
                            if (update && update.status === 'fulfilled' && update.value) {
                                const { image, collegeLogo } = update.value;
                                return {
                                    ...mentor,
                                    image: image || mentor.image,
                                    collegeLogo: collegeLogo || mentor.collegeLogo
                                };
                            }
                            return mentor;
                        });
                        
                        // Update cache with new images
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify({
                                data: updated,
                                timestamp: Date.now()
                            }));
                        } catch (err) {
                            console.error('Error updating cache:', err);
                        }
                        
                        return updated;
                    });
                }
            } catch (err) {
                setError(err);
                setIsLoading(false);
                console.error(err);
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

    const offset = currentPage * mentorsPerPage;
    const currentMentors = filteredMentors.slice(offset, offset + mentorsPerPage);
    const pageCount = Math.ceil(filteredMentors.length / mentorsPerPage);

    const handlePageClick = ({ selected }) => {
        SetCurrentPage(selected);
        window.scrollTo({ top: 0, behavior: 'smooth' })
    };

    return (
        <div className="transition-all duration-300 min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
            {/* Enhanced Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>
            {/* Modern Header with Search */}
            <header className="w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Title Section - Centered */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-admeasy-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
                            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[#9f3562]" />
                            Find Your Mentor
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600">Connect with alumni from top colleges across India</p>
                    </div>

                    {/* Modern Search Bar - Centered */}
                    <div className="relative max-w-3xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            name='search'
                            value={searchQuery}
                            onChange={handleSearch}
                            className='w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300'
                            type="text"
                            placeholder={placeholder}
                        />
                        {/* <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#9f3562]/10 text-[#9f3562] rounded-lg text-sm font-medium">
                            {filteredMentors.length} mentors
                        </div> */}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Loading State - Skeleton Loading */}
                    {isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, index) => (
                                <MentorCardSkeleton key={index} />
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-200">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <p className="text-red-600 font-medium">An error occurred while loading mentors</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !currentMentors.length && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? 'Try adjusting your search terms' : 'No mentors available at the moment'}
                            </p>
                        </div>
                    )}

                    {/* Mentors Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentMentors.map((mentorCard) => {
                            return (
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
                                            navigate(`/mentors/${mentorCard.username}`);
                                        }
                                    }}
                                >
                                    {/* Card Header with Image */}
                                    <div className="relative p-6 pb-4 flex-1">
                                        {/* University Badge */}
                                        {mentorCard.university && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white text-xs font-semibold rounded-lg shadow-md">
                                                    <Award className="w-3 h-3" />
                                                    {mentorCard.university}
                                                </span>
                                            </div>
                                        )}

                                        {/* Profile Image with College Logo Overlay */}
                                        <div className="relative w-24 h-24 mx-auto mb-4 flex-shrink-0">
                                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-[#9f3562]/20 transition-all duration-300">
                                            <img
                                                    src={mentorCard.username ? mentorCard.image : getMentorImageUrl(mentorCard.image)}
                                                    className="w-full h-full object-cover object-center"
                                                    style={{ aspectRatio: '1 / 1' }}
                                                onError={(e) => {
                                                    e.target.src = fallbackImage;
                                                }}
                                                    alt={mentorCard.name || 'Mentor'}
                                                    loading="lazy"
                                            />
                                            </div>
                                            {mentorCard.collegeLogo && (
                                                <img
                                                    draggable="false"
                                                    src={mentorCard.collegeLogo}
                                                    alt="College Logo"
                                                    className="absolute -bottom-2 -right-2 w-10 h-10 object-cover object-center rounded-full border-2 border-white shadow-lg bg-white"
                                                    style={{ aspectRatio: '1 / 1' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
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

                                            {/* College */}
                                            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                                                <GraduationCap className="w-3.5 h-3.5 text-[#9f3562] flex-shrink-0" />
                                                <p className="text-xs font-medium text-gray-700 line-clamp-1">
                                                    {mentorCard.college}
                                                </p>
                                            </div>

                                            {/* Course Badge */}
                                            {mentorCard.course && (
                                                <div className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                                                    {mentorCard.course}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer with CTA - Fixed at bottom */}
                                    <div className="px-6 pb-6 pt-2 flex justify-center items-center">
                                        <div className='cursor-pointer w-full flex justify-center' onClick={(e) => {
                                                e.stopPropagation();
                                            if (loggedInAccount) {
                                                // Navigate to chat page with mentor ID or username
                                                // Use mentorCard (the displayed mentor) for the identifier
                                                const mentorIdentifier = mentorCard._id || mentorCard.username;
                                                if (mentorIdentifier) {
                                                    // If logged in as user, go to /chats/:mentorId
                                                    // If logged in as mentor, go to /mentor/chats/:userId
                                                if (user) {
                                                        navigate(`/chats/${mentorIdentifier}`);
                                                    } else if (mentor) {
                                                        // For mentor-to-mentor chat
                                                        navigate(`/mentor/chats/${mentorIdentifier}`);
                                                    }
                                                } else {
                                                    toast.error('Unable to start chat. Mentor information is missing.', {
                                                        position: 'top-center',
                                                    });
                                                }
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
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </main>

            {/* Modern Pagination */}
            {!isLoading && filteredMentors.length > mentorsPerPage && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="flex justify-center px-4 pb-12 relative z-10"
                >
                    <ReactPaginate
                        breakLabel="..."
                        nextLabel={
                            <span className="flex items-center gap-2 font-medium">
                                Next <ChevronRight className="w-4 h-4" />
                            </span>
                        }
                        previousLabel={
                            <span className="flex items-center gap-2 font-medium">
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </span>
                        }
                        onPageChange={handlePageClick}
                        pageRangeDisplayed={3}
                        marginPagesDisplayed={1}
                        pageCount={pageCount}
                        forcePage={currentPage}
                        renderOnZeroPageCount={null}
                        containerClassName="flex flex-wrap items-center justify-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200"
                        pageLinkClassName="flex items-center justify-center min-w-10 h-10 px-3 rounded-xl font-medium text-gray-700 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-[#9f3562]/10 hover:text-[#9f3562] hover:border-[#9f3562]/20"
                        activeLinkClassName="bg-gradient-to-r from-[#9f3562] to-[#b8447a] text-white border-transparent shadow-md hover:bg-[#9f3562] hover:text-white"
                        previousLinkClassName="flex items-center justify-center px-4 h-10 rounded-xl font-medium text-gray-700 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-[#9f3562]/10 hover:text-[#9f3562] hover:border-[#9f3562]/20"
                        nextLinkClassName="flex items-center justify-center px-4 h-10 rounded-xl font-medium text-gray-700 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-[#9f3562]/10 hover:text-[#9f3562] hover:border-[#9f3562]/20"
                        disabledClassName="opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-400 hover:border-gray-200"
                        breakLinkClassName="flex items-center justify-center w-10 h-10 text-gray-400 select-none"
                    />
                </motion.div>
            )}

            {showLogin && <LogIn isOpen={showLogin} onClose={() => setShowLogin(false)} />}
        </div>
    )
}

export default Mentors