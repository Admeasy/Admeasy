import { motion } from'framer-motion';

const fadeUpVariant = {
 hidden: { opacity: 0, y: 60 },
 visible: { opacity: 1, y: 0 },
}

const Section = ({ children, className =""}) => {
 return (
 <motion.section
 variants={fadeUpVariant}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.7, ease:'easeOut'}}
 className={`xl:w-75/100 md:w-full p-5 md:p-10 text-center bg-white/95 backdrop-blur-xl flex flex-col items-center gap-5 sm:gap-10 rounded-4xl shadow-xl shadow-gray-200/50 border border-gray-100 ${className}`}>
 {children}
 </motion.section>
 )
}

export default Section;