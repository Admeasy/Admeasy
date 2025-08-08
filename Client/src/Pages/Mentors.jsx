import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchLogo from '../assets/Others/Search-logo.webp'
import { motion } from 'framer-motion'
import ButtonIcon from '../components/ButtonIcon';
import { useUser } from "../context/UserContext";
import Login from '../Pages/Login'

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
    const [mentors, setMentors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();
    const studentImages = import.meta.glob('../assets/UGs/*', { eager: true, query: '?url', import: 'default' });
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useUser();
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    }

    // Filter mentors based on search query
    const filteredMentors = mentors.filter(mentor => {
        if (!searchQuery.trim()) return true;

        // Break down search query into individual terms
        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        const name = mentor.name?.toLowerCase() || '';
        const college = mentor.college?.toLowerCase() || '';
        const course = mentor.course?.toLowerCase() || '';
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

    function getStudentImageUrl(imageName) {
        if (imageName) {
            // Find the first key in studentImages that includes the imageName
            const entry = Object.entries(studentImages).find(([key]) =>
                key.includes(imageName)
            );
            return entry ? entry[1] : fallbackImage;
        } else {
            return fallbackImage
        }
    }

    useEffect(() => {
        async function fetchMentors() {
            setIsLoading(true);
            try {
                const response = await fetch('/api/colleges');
                const colleges = await response.json();
                let allMentors = [];
                let duMentors = [];
                colleges.forEach(college => {
                    if (college.students && college.students.length > 0) {
                        college.students.forEach(student => {
                            if (college.affiliation === 'Delhi University' || college.name.includes('Delhi University') || college.name.includes('DU')) {
                                duMentors.push({
                                    ...student,
                                    college: college.name,
                                    collegeLogo: college.logo || '',
                                    university: college.affiliation || 'Delhi University',
                                    keywords: college.keywords || []
                                })
                            } else {
                                allMentors.push({
                                    ...student,
                                    college: college.name,
                                    collegeLogo: college.logo || '',
                                    university: college.affiliation,
                                    keywords: college.keywords || []
                                });
                            }
                        });
                    }
                });

                let shuffledAllMentors = shuffleArray(allMentors);
                let shuffledDUMentors = shuffleArray(duMentors);

                shuffledDUMentors.forEach(mentor => {
                    shuffledAllMentors.unshift(mentor);
                })

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


    return (
        <>
            <header className="w-full m-0 my-4 p-4 flex items-center justify-center">
                <input
                    name='search'
                    value={searchQuery}
                    onChange={handleSearch}
                    className='pl-4 outline-0 bg-bg rounded-3xl xl:h-14 h-10 md:h-9 lg:h-12 w-full placeholder:text-tsecondary placeholder:text-[12px] xl:placeholder:text-[16px] sm:placeholder:text-[13px] shadow-inset-6 text-[12px] sm:text-[14px] lg:text-[18px]'
                    type="text"
                    placeholder='Search Mentor from IIT...'
                />
                <button className='cursor-pointer text-[12px] lg:text-[16px] md:text-[14px] xl:text-[17px] absolute right-4 sm:right-8 w-10'>
                    <img draggable="false" src={SearchLogo} className='size-8 sm:size-12' />
                </button>
            </header>
            <main className="w-full p-3 flex justify-evenly flex-wrap gap-10">
                {isLoading && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">Loading students...</span></div>}
                {error && <div className="w-full flex justify-center items-center py-10 text-red-500"><span className="text-2xl">{'An error occurred'}</span></div>}
                {!isLoading && !filteredMentors.length && <div className="w-full flex justify-center items-center py-10"><span className="text-2xl">{searchQuery ? 'No students found matching your search' : 'No students found'}</span></div>}
                {filteredMentors.map((student) => (
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        key={student._id}
                        className="w-40 sm:w-70 sm:h-65 md:h-79 mt-2 md:mt-4 relative flex flex-col items-center bg-primary rounded-xl shadow-3d p-4 transform hover:scale-105 transition-transform duration-300 ease-in-out border-none"

                    >
                        <div className="py-5 flex flex-col space-y-1">
                            {/* Image with College Logo Overlay */}
                            <div>
                                <img
                                    src={getStudentImageUrl(student.image)}
                                    className="size-20 md:size-24 m-0 mx-auto rounded-full object-cover object-center shadow-md"
                                    onError={(e) => {
                                        e.target.src = fallbackImage;
                                    }} />
                                <img
                                    draggable="false"
                                    src={student.collegeLogo}
                                    alt="College Logo"
                                    className="absolute top-3 left-3 size-10 md:size-14 lg:size-17 object-contain rounded-full border-2 border-white shadow-lg bg-white z-10" />
                                {student.university ? (
                                    <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[7px] sm:text-[9px] md:text-[10.5px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                                        {student.university}
                                    </span>
                                ) : null}
                            </div>
                            {/* Text Content */}
                            <div className="mt-0 sm:mt-4 gap-2 text-center items-center flex flex-col">
                                {/* Student Name */}
                                <p className="text-[14px] md:text-[16px] text-base font-admeasy-bold text-[#1f1f1f]">{student.name}</p>
                                {/* Highlighted College Name */}
                                <p className={`font-medium text-[#39365c] ${student.college.length > 35 ? 'text-[10px] md:text-[13px]' : 'text-[12px] md:text-[15px]'}`}>{student.college}</p>
                                {/* Course Badge */}
                                <span className={`w-fit ${student.course.length > 25 ? 'text-[10px] md:text-[13px]' : 'text-[12px] md:text-[14px]'} mx-auto mb-2 inline-block px-2 py-0.25 sm:py-0.5  bg-gray-100 text-[#39365c] font-semibold rounded-xl shadow-sm`}>
                                    {student.course}
                                </span>
                                <div className='absolute bottom-2.5 cursor-pointer' onClick={() => {
                                    if (user) {
                                        const message = `Hey Team Admeasy!\n I'm ${user.name}, a ${user.course} student from ${user.institute}. I'd love to connect with ${student.name} from ${student.college} to gain some real insights and perspective!`;
                                        const encodedMessage = encodeURIComponent(message);
                                        window.open(`https://wa.me/919243299145?text=${encodedMessage}`, "_blank");
                                    } else {
                                        setShowLogin(true);
                                    }
                                }}>
                                    <ButtonIcon text={'Chat Now'} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </main>
            {showLogin && <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />}
        </>
    )
}

export default Mentors
