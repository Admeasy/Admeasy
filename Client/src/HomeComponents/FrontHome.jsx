import { motion } from'framer-motion';
import { useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import SearchLogo from'../assets/Others/search.png';
import girl from'../assets/Others/girl.png';
import boy from'../assets/Others/boy2.png';
import { Building2, GraduationCap, BookOpen, TrendingUp, Award, Lightbulb } from'lucide-react';

const fadeUpVariant = {
 hidden: { opacity: 0, y: 60 },
 visible: { opacity: 1, y: 0 },
};

const floatVariant = {
 animate: {
 y: [-10, 10, -10],
 transition: {
 duration: 3,
 repeat: Infinity,
 ease:"easeInOut"
 }
 }
};

const scaleVariant = {
 animate: {
 scale: [1, 1.05, 1],
 transition: {
 duration: 2,
 repeat: Infinity,
 ease:"easeInOut"
 }
 }
};

const FrontHome = () => {
 const navigate = useNavigate();
 
 const handleSearch = (e) => {
 e.preventDefault();
 const searchQuery = e.target.search.value.trim();
 if (searchQuery) {
 navigate(`/colleges?search=${encodeURIComponent(searchQuery)}`);
 }
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
 <motion.section
 variants={fadeUpVariant}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.7, ease:'easeOut'}}
 className="w-full mx-auto px-4 py-6 sm:py-8"
 >
 <div className="relative flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 w-[95%] mx-auto shadow-2xl rounded-2xl overflow-hidden px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-10">
 

 {/* Floating Icon - Top Left */}
 <motion.div
 variants={floatVariant}
 animate="animate"
 whileHover={{ scale: 1.1, rotate: 5 }}
 className="absolute top-6 left-6 sm:top-8 sm:left-8 bg-white/20 backdrop-blur-md p-2 sm:p-2.5 rounded-xl shadow-lg hidden sm:block border border-white/30"
 >
 <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
 </motion.div>

 {/* Floating Icon - Top Right */}
 <motion.div
 variants={floatVariant}
 animate="animate"
 transition={{ delay: 0.5 }}
 whileHover={{ scale: 1.1, rotate: -5 }}
 className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-white/20 backdrop-blur-md p-2 sm:p-2.5 rounded-xl shadow-lg hidden sm:block border border-white/30"
 >
 <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
 </motion.div>

 {/* Girl Image - Left */}
 <motion.div
 initial={{ opacity: 0, x: -50 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.8, delay: 0.2 }}
 className="relative z-10 w-auto flex-shrink-0 order-2 md:order-1 hidden md:block"
 >
 <motion.div
 variants={floatVariant}
 animate="animate"
 whileHover={{ scale: 1.05 }}
 className="relative"
 >
 
 <img
 src={girl}
 alt="Student Girl"
className="relative w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain drop-shadow-2xl"
 />
 </motion.div>
 </motion.div>

 {/* Center Content */}
 <div className="relative z-10 w-full md:flex-1 flex flex-col text-center justify-center gap-3 sm:gap-4 order-1 md:order-2 px-2">
 <motion.h1
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.3 }}
 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight"
 >
 Get <motion.span className="text-yellow-300 inline-block">
 Real Insights
</motion.span>
<br />
 from your <motion.span className="text-yellow-300 inline-block">
 Seniors
</motion.span>

 </motion.h1>

 <motion.p
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.4 }}
 className="text-sm sm:text-base md:text-base lg:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed px-2"
 >
 Discover top-rated colleges near you and connect with UGs/Alumnis to make the right choice for your future. <strong className="text-yellow-300 font-bold">₹0</strong> to talk to IITians, IIMities, SRCCians
 </motion.p>

 {/* Badge Pills */}
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, delay: 0.5 }}
 className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap"
 >
 <motion.div
 whileHover={{ scale: 1.05, y: -2 }}
 className="bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 border border-white/30 shadow-lg"
 >
 <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
 <span className="text-white font-semibold text-xs sm:text-sm">IIT</span>
 </motion.div>
 <motion.div
 whileHover={{ scale: 1.05, y: -2 }}
 className="bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 border border-white/30 shadow-lg"
 >
 <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
 <span className="text-white font-semibold text-xs sm:text-sm">IIM</span>
 </motion.div>
 </motion.div>

 {/* Search Bar */}
 <motion.form
 onSubmit={handleSearch}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.6 }}
 whileHover={{ scale: 1.02 }}
 className="relative w-full max-w-xl mx-auto mt-2 sm:mt-3"
 >
 <motion.input
 name="search"
 type="text"
 placeholder={placeholder}
 whileFocus={{ scale: 1.02 }}
 className="w-full h-12 sm:h-14 md:h-14 px-4 sm:px-5 pr-14 sm:pr-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white text-sm sm:text-base placeholder:text-white/80 shadow-xl outline-none focus:ring-2 focus:ring-white/60 focus:bg-white/30 transition-all"
 aria-label="Search for colleges"
 />
 <motion.button
 type="submit"
 whileHover={{ scale: 1.15, rotate: 5 }}
 whileTap={{ scale: 0.95 }}
 className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 transition-transform"
 aria-label="Search"
 >
 <img
 src={SearchLogo}
 alt="Search Icon"
 draggable="false"
 className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 drop-shadow-lg"
 />
 </motion.button>
 </motion.form>

 {/* Mobile Images - Show below search on small screens */}
 <div className="flex md:hidden items-center justify-center gap-4 sm:gap-6 mt-4">
 <motion.div
 initial={{ opacity: 0, x: -30 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6, delay: 0.7 }}
 className="relative"
 >
 <motion.div
 className="absolute -inset-2 bg-gradient-to-r from-yellow-300/20 to-pink-300/20 rounded-full blur-xl"
 animate={{
 scale: [1, 1.2, 1],
 opacity: [0.3, 0.5, 0.3],
 }}
 transition={{
 duration: 3,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 />
 <motion.img
 src={girl}
 alt="Student Girl"
 variants={floatVariant}
 animate="animate"
 whileHover={{ scale: 1.05 }}
className="relative w-40 h-40 sm:w-44 sm:h-44 object-contain drop-shadow-2xl"
 />
 </motion.div>
 <motion.div
 initial={{ opacity: 0, x: 30 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6, delay: 0.8 }}
 className="relative"
 >
 <motion.div
 className="absolute -inset-2 bg-gradient-to-l from-blue-300/20 to-purple-300/20 rounded-full blur-xl"
 animate={{
 scale: [1, 1.2, 1],
 opacity: [0.3, 0.5, 0.3],
 }}
 transition={{
 duration: 3,
 repeat: Infinity,
 ease:"easeInOut",
 delay: 0.5
 }}
 />
 <motion.img
 src={boy}
 alt="Student Boy"
 variants={floatVariant}
 animate="animate"
 transition={{ delay: 0.3 }}
 whileHover={{ scale: 1.05 }}
className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
 />
 </motion.div>
 </div>
 </div>

 {/* Boy Image - Right */}
 <motion.div
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.8, delay: 0.2 }}
 className="relative z-10 w-auto flex-shrink-0 order-3 hidden md:block"
 >
 <motion.div
 variants={floatVariant}
 animate="animate"
 transition={{ delay: 0.5 }}
 whileHover={{ scale: 1.05 }}
 className="relative"
 >
 
 <img
 src={boy}
 alt="Student Boy"
className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 object-contain drop-shadow-2xl"
 />
 </motion.div>
 </motion.div>

 {/* Floating Icon - Bottom Right */}
 <motion.div
 variants={floatVariant}
 animate="animate"
 transition={{ delay: 0.3 }}
 whileHover={{ scale: 1.1, rotate: 5 }}
 className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 bg-white/20 backdrop-blur-md p-2 sm:p-2.5 rounded-xl shadow-lg hidden sm:block border border-white/30"
 >
 <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
 </motion.div>
 </div>
 </motion.section>
 );
};

export default FrontHome;