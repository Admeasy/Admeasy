import { FaUserCheck, FaShieldAlt, FaStar, FaPhoneAlt, FaSearch, FaMobileAlt } from "react-icons/fa";
import { PiStudentDuotone } from 'react-icons/pi';
import { GiTakeMyMoney } from "react-icons/gi";
import { motion } from 'framer-motion';


const features = [
  {
    icon: <FaUserCheck className="w-8 h-8 text-blue-600" />,
    title: "Personalized College Matches",
    description: "We match you with colleges based on your preferences, not ads or commissions.",
    Upcoming: false
  },
  {
    icon: <FaShieldAlt className="w-8 h-8 text-green-600" />,
    title: "No Spam, No Data Selling",
    description: "Your data is safe with us — we strictly avoid sharing or selling it to third parties. No spam, no shady deals — just secure, transparent service designed with your privacy in mind.",
    Upcoming: false
  },
  {
    icon: <FaStar className="w-8 h-8 text-yellow-500" />,
    title: "Verified Reviews & Ratings",
    description: "Get honest reviews from students — not paid promotions.",
    Upcoming: false
  },
  {
    icon: <FaPhoneAlt className="w-8 h-8 text-red-500" />,
    title: "🎯Direct College Connect",
    description: "Admeasy lets you connect directly with verified colleges — skip the agents, spam calls, and confusing middle steps. Talk to colleges transparently and make confident decisions, all in one platform.",
    Upcoming: false
  },
  {
    icon: <PiStudentDuotone className="w-10 h-10 text-purple-600" />,
    title: "Talk To Alumni",
    description: "Connect with students from your preferred college to gain real insights into campus life — from academics and faculty to fests and student culture..",
    Upcoming: true
  },
  {
    icon: <FaSearch className="w-8 h-8 text-indigo-500" />,
    title: "Subscription-Based Model",
    description: "No spam. No pressure. Just powerful tools to find your dream college — on your terms. Unlock premium features, exclusive insights, and a peaceful admission journey.",
    Upcoming: true
  },
  {
    icon: <GiTakeMyMoney className="w-12 h-12 text-teal-500" />,
    title: "Sell Your Notes For Money",
    description: "Why let your notes gather dust when they can earn you real money? 📚💰 Join our platform, upload your study material, and start getting paid for helping others learn. Turn your hard work into a steady stream of income!",
    Upcoming: true
  },
];

export default function Features() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  }
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="visible"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full px-4 py-10"
    >
      <section className="mt-10 py-12 px-6 md:px-16">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">✅ Our Features</h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-gray-100 rounded-2xl relative shadow-3d hover:shadow-md transition-all p-6 flex flex-col items-start">
              <div className="relative w-full">
                {feature.Upcoming && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-700 text-white text-[10px] px-2 py-[3px] rounded-md uppercase font-semibold  tracking-wider shadow-sm ring-1 ring-red-300 animate-pulse">
                    Soon!
                  </span>
                )}
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{feature.title}</h3>

                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.section>
  );
}
