import { motion } from'framer-motion'
import { useEffect } from'react'
import Envelope from'../assets/Icons/envelope.svg'
import Phone from'../assets/Icons/phone.svg'
import WA from'../assets/Icons/wa.webp'
import SEO from'../components/SEO'

const fadeUpVariant = {
 hidden: { opacity: 0, y: 60 },
 visible: { opacity: 1, y: 0 },
}

const Contact = () => {
 useEffect(() => {
 window.scrollTo(0, 0);
 }, []);

 return (
 <>
 <SEO
 title="Contact Us - Get in Touch | Admeasy"
 description="Have questions? Contact Admeasy for support, partnerships, or inquiries. We're here to help you with college admissions and education guidance."
 keywords="contact admeasy, support, help, college admissions help, education support"
 url="https://admeasy.in/contact"
 />
 {/* Updated Wrapper:
 - lg:ml-72: Pushed 288px right on desktop
 - ml-0: Full width on mobile/tablet
 */}
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4 transition-all duration-300 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
 {/* Enhanced Ambient Background */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'8s'}} />
 <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'10s'}} />
 <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"style={{ animationDuration:'6s'}} />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"/>
 </div>
 <motion.section
 variants={fadeUpVariant}
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.7, ease:'easeOut'}}
 className="p-5 bg-white/95 backdrop-blur-xl flex flex-col gap-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 max-w-3xl w-full mx-auto relative z-10"
 >
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
 </div>
 </>
 )
}

export default Contact