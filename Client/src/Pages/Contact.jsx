import { motion } from 'framer-motion'
import Envelope from '../assets/Icons/envelope.svg'
import Phone from '../assets/Icons/phone.svg'
import WA from '../assets/Icons/wa.webp'

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const Contact = () => {
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-2/3 p-5 pb-9 bg-primary flex flex-col gap-6 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-3xl shadow-3d">
        {/* Heading */}
      <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold font-poppins">Contact Us</h2>
      {/* Container */}
      <div className="w-full m-0 p-3 flex flex-col gap-4 rounded-2xl shadow-3d">
        <h2 className="md:text-2xl sm:text-[18px] text-[13px] ml-1">Need help or have any queries? Don't worry! You're just a mail or call away</h2>
        <ul className="flex flex-col gap-2">
          <li className="">
            <a href="mailto:support@admeasy.in" className="w-fit m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={Envelope} className='md:w-12 md:h-12 h-5 w-5 sm:w-8 sm:h-8' />
              <h4 className="m-0 pb-1 text-[12px] sm:text-[16px] md:text-2xl">support@admeasy.in</h4>
            </a>
          </li>
          <li className="">
            <a href="tel:+919243299145" className="w-fit m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={Phone} className='md:w-12 md:h-12 h-5 w-5 sm:w-8 sm:h-8' />
              <h4 className="m-0 pb-1 text-[12px] sm:text-[16px] md:text-2xl">+91 9243299145</h4>
            </a>
          </li>
          <li className="">
            <a href="https://wa.me/+919243299145" target='_blank' className="w-fit m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={WA} className='md:w-12 md:h-12 h-5 w-5 sm:w-8 sm:h-8' />
              <h4 className="m-0 pb-1 text-[12px] sm:text-[16px] md:text-2xl">Connect with us on WhatsApp</h4>
            </a>
          </li>
        </ul>
      </div>
    </motion.section>
    
  )
}

export default Contact