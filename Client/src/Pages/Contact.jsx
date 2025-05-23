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
      className="w-2/3 p-5 pb-9 bg-[#E7ECF3] flex flex-col gap-6 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-3xl shadow-[8px_8px_16px_#d1d9e6,_inset_8px_8px_16px_#ffffff]">
      <h2 className="text-6xl font-poppins">Contact Us</h2>
      <div className="w-full m-0 p-3 flex flex-col gap-4 rounded-2xl shadow-[8px_8px_16px_#d1d9e6,_inset_8px_8px_16px_#ffffff]">
        <h2 className="text-2xl ml-1">Need help or have any queries? Don't worry! You're just a mail or call away</h2>
        <ul className="flex flex-col gap-2">
          <li className="">
            <a href="mailto:support@admeasy.in" className="m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={Envelope} className='w-12 h-12' />
              <h4 className="m-0 pb-1 text-2xl">support@admeasy.in</h4>
            </a>
          </li>
          <li className="">
            <a href="tel:" className="m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={Phone} className='w-12 h-12' />
              <h4 className="m-0 pb-1 text-2xl">+91 9410451807</h4>
            </a>
          </li>
          <li className="">
            <a href="https://wa.me/+919410451807" target='_blank' className="m-0 p-0 flex items-center gap-2 font-semibold">
              <img src={WA} className='w-12 h-12' />
              <h4 className="m-0 pb-1 text-2xl">Connect with us on WhatsApp</h4>
            </a>
          </li>
        </ul>
      </div>
    </motion.section>
  )
}

export default Contact