import { motion } from 'framer-motion';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Section = ({ children }) => {
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="xl:w-75/100 p-5 md:p-10 text-center bg-[#E7ECF3] flex flex-col items-center gap-5 sm:gap-10 rounded-4xl shadow-3d"
    >
      {children}
    </motion.section>
  )
}

export default Section;