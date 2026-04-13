import { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { motion } from"framer-motion";
import { Link } from"react-router-dom";
import { FaMapMarkerAlt, FaStar, FaArrowRight, FaUserGraduate, FaBook } from"react-icons/fa";
import { Building2, Sparkles, TrendingUp } from"lucide-react";
import ExploreBtn from"./ExploreBtn";
import GradientText from"./GradientText";
import { FaShareAlt } from"react-icons/fa";
import { toast } from"react-toastify";
import SharePopUp from"../components/SharePopUp";

const formatRating = (rating) => {
 if (typeof rating ==="number") return rating.toFixed(1);
 if (rating?.overall && typeof rating.overall ==="number") {
 return rating.overall.toFixed(1);
 }
 return"N/A";
};

const fadeUpVariant = {
 hidden: { opacity: 0, y: 60 },
 visible: { opacity: 1, y: 0 },
};

const floatVariant = {
 animate: {
 y: [-5, 5, -5],
 transition: {
 duration: 3,
 repeat: Infinity,
 ease:"easeInOut"
 }
 }
};

export default function CollegeCard() {
 const [Colleges, setColleges] = useState([]);
 const [isLoading, setIsLoading] = useState(false);
 const [selectedCollege, setSelectedCollege] = useState(null);

 useEffect(() => {
 let isMounted = true;

 async function fetchColleges() {
 setIsLoading(true);
 try {
 const response = await fetch("/api/colleges?page=1&limit=9999");
 if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
 const data = await response.json();
 const collegeList = data.colleges || [];
 
 const shuffled = [...collegeList];
 for (let i = shuffled.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
 }
 
 const count = window.innerWidth > 1024 ? 6 : 4;
 if (isMounted) setColleges(shuffled.slice(0, count));
 } catch (error) {
 console.error("Error fetching colleges:", error);
 } finally {
 if (isMounted) setIsLoading(false);
 }
 }

 fetchColleges();
 return () => { isMounted = false; };
 }, []);

 const navigate = useNavigate();

 return (
 <motion.section
 variants={fadeUpVariant}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.7, ease:"easeOut"}}
 className="text-tprimary my-16 relative overflow-hidden"
 >
 {/* Background decorative elements */}
 <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 opacity-40 pointer-events-none"/>
 <motion.div
 className="absolute top-20 right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"
 animate={{
 scale: [1, 1.3, 1],
 opacity: [0.3, 0.6, 0.3],
 }}
 transition={{
 duration: 10,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 />

 <div className="relative pt-6 bg-transparent">
 {/* Enhanced Heading Section */}
 <div className="w-full mb-14 flex flex-col items-center justify-center text-center px-4">
 <motion.div
 initial={{ scale: 0.9, opacity: 0 }}
 whileInView={{ scale: 1, opacity: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 className="inline-flex items-center gap-2 mb-4 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200/50 shadow-lg"
 >
 <Building2 className="w-5 h-5 text-emerald-600"/>
 <span className="text-sm font-semibold text-emerald-700">Top Institutions</span>
 <Sparkles className="w-4 h-4 text-yellow-500"/>
 </motion.div>
 
 <motion.h1
 initial={{ y: 20, opacity: 0 }}
 whileInView={{ y: 0, opacity: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: 0.1 }}
 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4"
 >
 <GradientText
 colors={["#10b981","#3b82f6","#8b5cf6"]}
 animationSpeed={8}
 showBorder={false}
 className="font-extrabold"
 >
 Discover Top Colleges Trusted by Students
 </GradientText>
 </motion.h1>
 
 <motion.p
 initial={{ y: 20, opacity: 0 }}
 whileInView={{ y: 0, opacity: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl"
 >
 Find top-rated institutions near you with <span className="font-semibold text-emerald-600">trusted reviews</span> and <span className="font-semibold text-blue-600">authentic experiences</span>
 </motion.p>
 </div>

 {/* Cards Section with enhanced grid */}
 <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-10 relative">
 {isLoading ? (
 <div className="col-span-full flex flex-col items-center justify-center py-20">
 <motion.div
 animate={{ rotate: 360 }}
 transition={{ duration: 1, repeat: Infinity, ease:"linear"}}
 className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full mb-4"
 />
 <h3 className="text-xl md:text-2xl text-gray-700 font-semibold">
 Loading Amazing Colleges...
 </h3>
 </div>
 ) : (
 Colleges.map((college, index) => (
 <motion.div
 key={college._id}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: index * 0.1 }}
 whileHover={{ y: -8 }}
 >
 <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100">
 {/* Decorative gradient on hover */}
 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
 
 {/* Floating decorative element */}
 <motion.div
 variants={floatVariant}
 animate="animate"
 className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-2xl"
 />

 {/* Top Section with Logo + Info */}
 <div className="relative flex items-start gap-4 p-6">
 <motion.div
 whileHover={{ scale: 1.1, rotate: 5 }}
 className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-lg ring-4 ring-white group-hover:ring-emerald-100 transition-all duration-300"
 >
 {/* Glow effect */}
 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"/>
 <img
 src={college.logo}
 alt={college.name}
 className="relative h-14 w-14 object-contain"
 draggable="false"
 />
 </motion.div>
 
 <div className="flex-1 min-w-0">
 <motion.h2
 onClick={() => navigate(`/colleges/${college._id}`)}
 title={college.name}
 whileHover={{ x: 5 }}
 className="cursor-pointer font-bold text-lg text-gray-800 group-hover:text-emerald-600 transition-colors duration-300 line-clamp-2 mb-2"
 >
 {college.name}
 </motion.h2>
 
 <motion.div
 whileHover={{ x: 3 }}
 className="flex items-center gap-2 text-gray-600 text-sm"
 >
 <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0"/>
 <span className="truncate">{college.location}</span>
 </motion.div>
 </div>
 </div>

 {/* Divider with gradient */}
 <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"/>

 {/* Stats Section with icons */}
 <div className="py-5 px-6 flex justify-around items-center bg-gradient-to-r from-gray-50/50 to-white/50">
 <motion.div
 whileHover={{ scale: 1.05, y: -2 }}
 className="flex flex-col items-center gap-1.5 group/stat cursor-pointer"
 >
 <div className="p-2 bg-emerald-100 rounded-lg group-hover/stat:bg-emerald-200 transition-colors">
 <FaUserGraduate className="text-emerald-600 w-5 h-5"/>
 </div>
 <p className="text-gray-700 font-semibold text-sm">
 {college?.students?.length ?? 0}
 </p>
 <p className="text-gray-500 text-xs">Mentors</p>
 </motion.div>
 
 <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"/>
 
 <motion.div
 whileHover={{ scale: 1.05, y: -2 }}
 className="flex flex-col items-center gap-1.5 group/stat cursor-pointer"
 >
 <div className="p-2 bg-blue-100 rounded-lg group-hover/stat:bg-blue-200 transition-colors">
 <FaBook className="text-blue-600 w-5 h-5"/>
 </div>
 <p className="text-gray-700 font-semibold text-sm">
 {college?.courses?.length ?? 0}
 </p>
 <p className="text-gray-500 text-xs">Courses</p>
 </motion.div>
 </div>

 {/* Rating Section */}
 <div className="px-6 py-4 flex items-center justify-between">
 <motion.span
 whileHover={{ scale: 1.05 }}
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${
 !college.rating || college.rating <= 3
 ?"bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200"
 : college.rating < 4
 ?"bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200"
 :"bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200"
 }`}
 >
 <FaStar className="text-yellow-500"/>
 {college.rating ? formatRating(college.rating) :"N/A"}
 </motion.span>

 <motion.div
 variants={floatVariant}
 animate="animate"
 >
 <TrendingUp className="w-5 h-5 text-emerald-500 opacity-70"/>
 </motion.div>
 </div>

 {/* Buttons Section */}
 <div className="px-6 pb-6 flex items-center gap-3">
 <motion.button
 onClick={() => {
 setSelectedCollege({
 id: college._id,
 name: college.name,
 });
 }}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 title="Share this college"
 className="group/share flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
 >
 <FaShareAlt className="w-4 h-4 group-hover/share:rotate-12 transition-transform"/>
 </motion.button>

 <motion.button
 onClick={() => navigate(`/colleges/${college._id}`)}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 title={`Explore ${college.name}`}
 className="group/explore flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
 >
 <span>Explore</span>
 <FaArrowRight className="w-4 h-4 group-hover/explore:translate-x-1 transition-transform"/>
 </motion.button>
 </div>
 </div>
 </motion.div>
 ))
 )}
 </div>

 {/* View More Button */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.3 }}
 title="Discover more amazing colleges"
 className="text-center mt-12"
 >
 <ExploreBtn text="View More Colleges"linkbtn="/colleges"isSticky={false} />
 </motion.div>
 </div>

 {selectedCollege && (
 <SharePopUp
 isOpen={true}
 onClose={() => setSelectedCollege(null)}
 college={`https://admeasy.in/colleges/${selectedCollege.id}`}
 CollegeName={selectedCollege.name}
 />
 )}
 </motion.section>
 );
}