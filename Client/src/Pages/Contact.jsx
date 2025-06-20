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
    <>
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="p-5 my-15 bg-primary flex flex-col gap-6 rounded-3xl shadow-3d max-w-3xl w-full mx-auto">
      {/* Heading */}
      <h2 className="text-[22px] md:text-3xl lg:text-4xl font-bold font-poppins text-center">
        Contact Us
      </h2>

      {/* Container */}
      <div className="w-full p-3 flex flex-col gap-4 rounded-2xl shadow-3d">
        <h2 className="md:text-2xl sm:text-[18px] text-[13px] ml-1 text-center">
          Need help or have any queries? Don't worry! You're just a mail or call away
        </h2>

        <ul className="flex flex-col gap-4">
          <li>
            <a
              href="mailto:support@admeasy.in"
              className="max-w-fit flex items-center gap-3 font-semibold"
            >
              <img
                src={Envelope}
                alt="Email Icon"
                className="md:w-12 md:h-12 w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
              <h4 className="text-[12px] sm:text-[16px] md:text-2xl">
                support@admeasy.in
              </h4>
            </a>
          </li>

          <li>
            <a
              href="tel:+919243299145"
              className="max-w-fit flex items-center gap-3 font-semibold"
            >
              <img
                src={Phone}
                alt="Phone Icon"
                className="md:w-12 md:h-12 w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
              <h4 className="text-[12px] sm:text-[16px] md:text-2xl">
                +91 9243299145
              </h4>
            </a>
          </li>

          <li>
            <a
              href="https://wa.me/+919243299145"
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-fit flex items-center gap-3 font-semibold"
            >
              <img
                src={WA}
                alt="WhatsApp Icon"
                className="md:w-12 md:h-12 w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
              <h4 className="text-[12px] sm:text-[16px] md:text-2xl">
                Connect with us on WhatsApp
              </h4>
            </a>
          </li>
        </ul>
      </div>
       
    </motion.section>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-gray-800">
        🎓 Student Honest Review!
      </h2>
      
      <div className="w-full p-6 max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-3d border border-gray-200">
        <iframe
          className="w-[230px] h-full rounded-2xl"
          src="https://www.youtube.com/embed/43iXBgwjk3k?controls=1&modestbranding=1&rel=0&showinfo=0"
          title="Medicaps University | B.Tech CSE | Student Review"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
    </>
  )
}

export default Contact
