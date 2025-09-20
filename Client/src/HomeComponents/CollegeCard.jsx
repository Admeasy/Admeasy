import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaStar, FaArrowRight } from "react-icons/fa";
import ExploreBtn from "./ExploreBtn";
import GradientText from "./GradientText";
import { FaShareAlt } from "react-icons/fa";
import { toast } from "react-toastify";
// ✅ Helper function to format rating
const formatRating = (rating) => {
  if (typeof rating === "number") return rating.toFixed(1);
  if (rating?.overall && typeof rating.overall === "number") {
    return rating.overall.toFixed(1);
  }
  return "N/A";
};

// ✅ Animation variant
const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

export default function CollegeCard() {
  const [Colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentors,SetMentors] = useState(0)

// // Fetch colleges Data
// useEffect(() => {
//   const fetchCollege = async () => {
//     try {
//       const response = await fetch(`/api/colleges/${id}`);
//       if (!response.ok) {
//         throw new Error(`Failed to fetch college data (${response.status})`);
//       }
//       const data = await response.json();
//       SetMentors(data);
//       console.log(mentors)
//     } catch (err) {
//       console.error('Error fetching college data:', err);
//     }
//   };

//   fetchCollege();
// }, [mentors]);


  // ✅ Fetch colleges
  useEffect(() => {
    async function fetchColleges() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/colleges");
        const data = await response.json();
        // Pick 4 random colleges
        const selected = [...data]
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);

        setColleges(selected);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchColleges();
  }, []);

  const navigate = useNavigate()

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="text-tprimary my-10"
    >
      {/* ===== Heading Section ===== */}
      <div className="pt-6 bg-gradient-to-b from-sky-50 to-white">
        <div className="w-full mb-10 flex flex-col sm:flex-row items-center justify-center text-center">
          <div>
            <h1 className="flex gap-2 text-2xl sm:text-3xl md:text-4xl font-admeasy-extrabold text-gray-800">
              <GradientText
                colors={["#6EE7B7", "#3B82F6", "#9333EA"]}
                animationSpeed={8}
                showBorder={false}
                className="font-admeasy-extrabold"
              >
                Discover Top Colleges Trusted by Students
              </GradientText>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-2">
              Find top-rated institutions near your city with trusted reviews
            </p>
          </div>
        </div>

        {/* ===== Cards Section ===== */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-10">
          {isLoading ? (
            <h3 className="mb-5 text-lg md:text-2xl text-tsecondary text-center font-semibold col-span-full">
              Loading Colleges...
            </h3>
          ) : (
            
            Colleges.map((college) => (
              <div key={college._id}>
                <div className="bg-white rounded-2xl shadow-admeasy hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Top Section with Logo + Info */}
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center shadow-inner">
                      <img
                        src={college.logo}
                        alt={college.name}
                        className="h-12 w-12 object-contain"
                        draggable="false"
                      />
                    </div>
                    <div>
                      <h2 
                      onClick={() => {
                        navigate(`/colleges/${college._id}`)
                      }}
                      title={`${college.name}`}
                      className="cursor-pointer font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition">
                        {college.name}
                      </h2>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <FaMapMarkerAlt className="text-blue-500" />
                        {college.location}
                      </p>
                      
                    </div>
                  </div>
                  <hr class="h-[2px] bg-gray-400 border-0 rounded" />
                  <div className="py-4 px-8 flex justify-between items-center bg-white rounded-2xl">
                    <p 
                    //title={`Click to see mentors of ${college.name}`}  
                    className="text-gray-700 font-medium hover:underline hover:text-blue-600 transition">
                      {college?.students?.length ?? 0} Mentors
                    </p>
                    <span className="w-px h-6 bg-gray-300"></span>
                    <p 
                    //title={`Click to see Courses of ${college.name}`} 
                    className="text-gray-700 font-medium hover:underline hover:text-blue-600 transition">
                      {college?.courses?.length ?? 0} Courses
                    </p>
                  </div>


                  {/* Rating */}
                  <div className="px-5 py-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                        ${
                          !college.rating || college.rating <= 3
                            ? "bg-red-50 text-red-700"
                            : college.rating < 4
                            ? "bg-orange-50 text-orange-700"
                            : "bg-green-50 text-green-700"
                        }`}
                    >
                      <FaStar className="text-yellow-500" />
                      {college.rating ? formatRating(college.rating) : "N/A"}
                    </span>
                  </div>

                  {/* Explore Button */}
                  <div className="px-5 pb-5 flex items-center gap-3">
                    {/* Share button */}
                    <button
                      onClick={() => {
                        const shareUrl = `https://admeasy.in/colleges/${college._id}`;
                        const message =  `Hey 👋  
I discovered this college on *Admeasy* – the smarter way to explore colleges without spam calls.  

✨ Why Admeasy?  
- Free mentors from top colleges 🎓  
- 100% data privacy 🔒  
- Verified info & student-friendly guidance 📚  

Check out this college here 👉 ${shareUrl}`;
                        navigator.clipboard.writeText(message)
                          .then(() => {
                       toast.success("🎓 College link copied! Share it with friends 👥");
                          })
                          .catch((err) => {
                            toast.error('Opps! Something is not really great!')
                          });
                      }}
                      title="Share this college"
                      type="button"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded-xl font-semibold transition-all hover:bg-blue-700 hover:gap-3"
                    >
                      <FaShareAlt className="w-4 h-4" />
                      Share
                    </button>

                    {/* Explore button */}
                    <button
                      onClick={() => {
                        navigate(`/colleges/${college._id}`)
                      }}
                      title={`Click to know more about ${college.name}`}
                      type="button"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold transition-all hover:bg-blue-700 hover:gap-3 w-full"
                    >
                      Explore
                      <FaArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== View More Button ===== */}
        <div title="Click to see more colleges" className="text-center mt-10">
          <ExploreBtn text="View More" linkbtn="/colleges" isSticky={false} />
        </div>
      </div>
    </motion.section>
  );
}
