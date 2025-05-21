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
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]"
    >
      {children}
    </motion.section>
  )
}

export default Section;