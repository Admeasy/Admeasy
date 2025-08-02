import React from 'react';
import { GiTakeMyMoney } from "react-icons/gi";
import { PiStudentDuotone } from 'react-icons/pi';
import { FaUserCheck, FaShieldAlt, FaStar, FaPhoneAlt } from "react-icons/fa";

const features = [
  {
    icon: <FaUserCheck className="w-8 h-8 text-blue-600" />,
    title: "Personalized College Matches",
    description: "We match you with colleges based on your preferences, not ads or commissions.",
    Upcoming: false,
  },
  {
    icon: <FaShieldAlt className="w-8 h-8 text-green-600" />,
    title: "No Spam, No Data Selling",
    description: "Your data is safe with us — we strictly avoid sharing or selling it to third parties. No spam, no shady deals — just secure, transparent service designed with your privacy in mind.",
    Upcoming: false,
  },
  {
    icon: <FaStar className="w-8 h-8 text-yellow-500" />,
    title: "Verified Reviews & Ratings",
    description: "Get honest reviews from students — not paid promotions.",
    Upcoming: false,
  },
  {
    icon: <PiStudentDuotone className="w-10 h-10 text-purple-600" />,
    title: "Talk To Alumni",
    description: "Connect with students from your preferred college to gain real insights into campus life — from academics and faculty to fests and student culture.",
    Upcoming: false,
  },
  {
    icon: <FaPhoneAlt className="w-8 h-8 text-red-500" />,
    title: "🎯 Direct College Connect",
    description: "Admeasy lets you connect directly with verified colleges — skip the agents, spam calls, and confusing middle steps. Talk to colleges transparently and make confident decisions, all in one platform.",
    Upcoming: true,
  },
  {
    icon: <GiTakeMyMoney className="w-12 h-12 text-teal-500" />,
    title: "Sell Your Notes For Money",
    description: "Why let your notes gather dust when they can earn you real money? 📚💰 Upload your study material and start getting paid for helping others learn.",
    Upcoming: true,
  },
];

export default function Features() {
  return (
    <section className="mt-10 py-12 px-6 md:px-16">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-admeasy-extrabold text-center mb-10 text-gray-800">
        ✅ Our Features
      </h2>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="sticky"
            style={{ top: `${4 + idx * 2}rem`, marginTop: `${idx * 1.5}rem` }}
          >
            <div className="bg-gray-100 rounded-2xl shadow-3d hover:shadow-lg transition-shadow duration-300 p-6">
              <div className="relative mb-4">
                {feature.Upcoming && (
                  <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-700 text-white text-xs px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                    Soon!
                  </span>
                )}
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className={`col-span-6 ${idx % 2 === 0 ? 'col-start-1' : 'col-start-7'} sticky`}
            style={{ top: `${4 + idx * 2}rem`, marginTop: `${idx * 1.5}rem` }}
          >
            <div className="bg-gray-100 rounded-2xl p-6 shadow-3d hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
              <div className="relative mb-4">
                {feature.Upcoming && (
                  <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-700 text-white text-xs px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
                    Soon!
                  </span>
                )}
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
