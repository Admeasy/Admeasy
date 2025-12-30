import React from 'react';
import { motion } from 'framer-motion';
import { GiTakeMyMoney } from "react-icons/gi";
import { PiStudentDuotone } from 'react-icons/pi';
import { FaUserCheck, FaShieldAlt, FaStar, FaPhoneAlt } from "react-icons/fa";
import { Sparkles, Trophy } from "lucide-react";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const floatVariant = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const features = [
  {
    icon: <FaUserCheck className="w-9 h-9 text-blue-600" />,
    title: "Personalized College Matches",
    description: "We match you with colleges based on your preferences, not ads or commissions.",
    Upcoming: false,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
  },
  {
    icon: <FaShieldAlt className="w-9 h-9 text-green-600" />,
    title: "No Spam, No Data Selling",
    description: "Your data is safe with us — no spam, no selling, no shady deals.",
    Upcoming: false,
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    icon: <FaStar className="w-9 h-9 text-yellow-500" />,
    title: "Verified Reviews & Ratings",
    description: "Get honest reviews from real students — not paid promotions.",
    Upcoming: false,
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
  },
  {
    icon: <PiStudentDuotone className="w-11 h-11 text-purple-600" />,
    title: "Talk To Alumni",
    description: "Talk to real students from your dream college for real insights.",
    Upcoming: false,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
  },
  {
    icon: <FaPhoneAlt className="w-8 h-8 text-red-500" />,
    title: "🎯 Direct College Connect",
    description: "Skip agents — connect directly with verified colleges, fast & transparent.",
    Upcoming: true,
    gradient: "from-red-500 to-rose-500",
    bgGradient: "from-red-50 to-rose-50",
  },
  {
    icon: <GiTakeMyMoney className="w-12 h-12 text-teal-500" />,
    title: "Sell Your Notes For Money",
    description: "Upload your notes and start getting paid by students who need them.",
    Upcoming: true,
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50",
  },
];

export default function Features() {
  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mt-16 py-16 px-6 md:px-16 relative"
    >
      <div className="relative max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 bg-white/80 rounded-full border border-blue-200 shadow-lg">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Why Choose Us</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Our Features
          </h2>

          <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">
            Everything you need to make the perfect college choice.
          </p>
        </div>

        {/* DESKTOP STICKY STACKED CARDS */}
        <div className="hidden md:grid grid-cols-12 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`col-span-6 ${idx % 2 === 0 ? "col-start-1" : "col-start-7"} sticky`}
              style={{ top: `${4 + idx * 3}rem`, marginTop: `${idx * 2.5}rem` }}
            >
              {/* SAFE PADDING WRAPPER TO PREVENT HOVER HIDING */}
              <div className="py-4 h-full">

                <div
                  className={`relative bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 shadow-xl border border-white/50 
                  hover:shadow-2xl hover:scale-[1.01] transition-all duration-500`}
                >
                  {/* subtle decoration */}
                  <motion.div
                    variants={floatVariant}
                    animate="animate"
                    className={`absolute -top-14 -right-14 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl`}
                  />

                  <div className="relative z-10">
                    {/* ICON */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-lg">
                        {feature.icon}
                      </div>

                      {feature.Upcoming && (
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-4 py-2 rounded-xl uppercase font-bold shadow-md">
                          Coming Soon
                        </div>
                      )}
                    </div>

                    {/* TITLE (must never be hidden) */}
                    <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
                      {feature.title}
                    </h3>

                    {/* DESCRIPTION */}
                    <p className="text-gray-700 text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* MOBILE STACKED */}
        <div className="flex flex-col gap-8 md:hidden">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="sticky"
              style={{ top: `${5 + idx * 3}rem`, marginTop: `${idx * 2}rem` }}
            >
              <div
                className={`relative bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-6 shadow-xl border border-white/50 
                hover:shadow-2xl hover:scale-[1.01] transition-all duration-500`}
              >
                <motion.div
                  variants={floatVariant}
                  animate="animate"
                  className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-2xl`}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                      {feature.icon}
                    </div>

                    {feature.Upcoming && (
                      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-lg uppercase font-bold shadow-md">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>

                  <p className="text-gray-700 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.section>
  );
}
