import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ReactPaginate from 'react-paginate';
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'
import ButtonIcon from '../components/ButtonIcon';
import { useUser } from "../context/UserContext";
import LogIn from "./LogIn"
import { toast } from 'react-toastify';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0 },
}

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

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


    // Filter mentors based on search query
    const filteredMentors = mentors.filter(mentor => {
        if (!searchQuery.trim()) return true;

        // Break down search query into individual terms
        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        const name = mentor.name?.toLowerCase() || '';
        const college = typeof mentor.college === 'string' ? mentor.college.toLowerCase() : (mentor.college?.name?.toLowerCase() || '');
        const courseData = typeof mentor.course === 'object' && mentor.course !== null
          ? mentor.course
          : (mentor.course ? (typeof mentor.course === 'string' && mentor.course.startsWith('{') ? JSON.parse(mentor.course) : { name: mentor.course }) : null);
        const course = courseData?.name?.toLowerCase() || courseData?.title?.toLowerCase() || '';
        const university = mentor.university?.toLowerCase() || '';
        const keywords = mentor.keywords?.map(keyword => keyword.toLowerCase()) || [];

        // Check if ALL search terms are found in ANY of the fields
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
            // Find the first key in mentorImages that includes the imageName
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
            setIsLoading(true);
            try {
                const response = await fetch(`/api/colleges?page=1&limit=1000`); // Fetch all mentors
                const data = await response.json()
                const colleges = data.colleges || []
                let allMentors = [];

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

                const response2 = await fetch('/api/mentors/');
                const mentorsFromDB = await response2.json();

                const mentorsWithLogos = await Promise.all(
                    mentorsFromDB.map(async (mentor) => {
                        const image = await fetchMentorImageUrl(mentor._id);
                        const college = typeof mentor.college === 'object' && mentor.college !== null
                          ? mentor.college
                          : (mentor.college ? JSON.parse(mentor.college) : null);
                        const course = typeof mentor.course === 'object' && mentor.course !== null
                          ? mentor.course
                          : (mentor.course ? (typeof mentor.course === 'string' && mentor.course.startsWith('{') ? JSON.parse(mentor.course) : { name: mentor.course }) : null);
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

                let shuffledAllMentors = shuffleArray(allMentors);

                setMentors(shuffledAllMentors);
                setIsLoading(false);
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

    // Array for animation
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
            // If paused, wait before starting deletion
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
                {isLoading && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">Loading mentors...</span></div>}
                {error && <div className="w-full flex justify-center items-center py-10 text-red-500"><span className="text-2xl">{'An error occurred'}</span></div>}
                {!isLoading && !currentMentors.length && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">{searchQuery ? 'No mentors found matching your search' : 'No mentors found'}</span></div>}
                {currentMentors.map((mentor) => {
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
                                {/* Image with College Logo Overlay */}
                                <div>
                                    <img
                                        src={mentor.username ? mentor.image : getMentorImageUrl(mentor.image)}
                                        className="aspect-square size-20 md:size-24 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                                        onError={(e) => {
                                            e.target.src = fallbackImage;
                                        }} />
                                    <img
                                        draggable="false"
                                        src={mentor.collegeLogo}
                                        alt="College Logo"
                                        className="aspect-square absolute top-3 left-3 size-10 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                                    {mentor.university ? (
                                        <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[10.5px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                                            {mentor.university}
                                        </span>
                                    ) : null}
                                </div>
                                {/* Text Content */}
                                <div className="mt-0 sm:mt-4 gap-2 text-center items-center flex flex-col">
                                    {/* Mentor's Username */}
                                    {mentor.username ? (<h3 className="text-[14px] md:text-[16px] text-base font-admeasy-extrabold text-tprimary">{mentor.username}</h3>) : ''}
                                    {/* Mentor Name */}
                                    <h3 className="text-[12px] md:text-[14px] text-base font-admeasy-bold text-tsecondary">{mentor.name}</h3>
                                    {/* Highlighted College Name */}
                                    <p className={'font-medium text-[#39365c] inline-block px-2 py-0.25 sm:py-0.5  bg-gray-100 rounded-xl shadow-sm text-[10px] md:text-[12px]'}>{mentor.college}</p>
                                    {/* Course Badge */}
                                    {mentor.course && (
                                      <span className={'w-fit text-[10px] md:text-[13px] mx-auto mb-2 inline-block px-2 py-0.25 sm:py-0.5  bg-gray-100 text-[#39365c] font-semibold rounded-xl shadow-sm'}>
                                          {mentor.course}
                                      </span>
                                    )}
                                    <div className='absolute bottom-2.5 cursor-pointer' onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click when clicking Chat Now button
                                        if (user) {
                                            const message = `Hey Team Admeasy!\n I'm ${user.name}, a ${user.course} student from ${user.institute}. I'd love to connect with ${mentor.name} from ${mentor.college} to gain some real insights and perspective!`;
                                            const encodedMessage = encodeURIComponent(message);
                                            window.open(`https://wa.me/919243299145?text=${encodedMessage}`, "_blank");
                                        } else {
                                            navigate('/login')
                                            toast.dark('Login to get real insights from alumni', {
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
            {/* Pagination - Only show if there are results */}
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
            {showLogin && <LogIn isOpen={showLogin} onClose={() => setShowLogin(false)} />}
        </>
    )
}
export default Mentors