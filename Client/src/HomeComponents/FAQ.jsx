import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { RiQuestionAnswerFill } from "react-icons/ri";


const faqs = [
  {
    question: "🎓 What is Admeasy?",
    answer: `Admeasy is your smart admission buddy! 🤝📱 We're a student-first platform that helps you find the right college without drowning in confusion or compromising your privacy. 🚫📞 No spam. No data selling. Just genuine guidance, verified college info, and tools to make your admission journey smooth, stress-free, and regret-free. ✨🎯`,
  },
  {
    question: "🔐 Is my data safe with Admeasy?",
    answer: `100% safe and secure — no spam, no nonsense. 🛡️📵 At Admeasy, your privacy is our priority. We collect only the necessary details (like your name, contact info, and preferences) to personalize your experience — and we never sell or share your data. ❌📞
Unlike other platforms, you won't receive annoying spam calls or random emails. Your data stays with us, just the way it should. 🔒✅`,
  },
  {
    question: "❓Does Admeasy help with scholarships or financial aid information?",
    answer: "Yes! While Admeasy doesn't directly provide scholarships or financial aid, we guide you toward the right opportunities. Our platform includes filters to help you discover colleges that offer scholarships, fee waivers, or budget-friendly programs based on your preferences. 💸🎓 ➡️ For detailed and updated information, feel free to contact our support team — we're here to help!.",
  },
  {
    question: "💬 Does Admeasy offer counselling or live support?",
    answer: `Absolutely! 🧑‍🏫💬 Admeasy offers personalized counselling through experienced undergraduates and our dedicated support team. Whether you're confused about college options or just need guidance, we've got your back — all at a very pocket-friendly price. 💡🎓`,
  },
  {
    question: "🔄 How often is the college database updated?",
    answer: `We keep it fresh! 🗂️✨ College details like fee structure and placement stats are updated once every year, directly sourced from official data. Internship opportunities and additional info are refreshed more frequently — depending on availability and updates from the institutions. 🎓💼
We aim to keep everything as current as possible — and if you ever need the latest scoop, our support team is just a message away! 💬📲`,
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}
  return (
    <motion.section
 variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full px-4 py-10 bg-bg"
    >
      <div id='FAQ' className="max-w-4xl mx-auto">
        <h2 className="text-3xl text-gray-800 font-admeasy-extrabold justify-center flex gap-4 sm:text-4xl text-center mb-8 ">
          Frequently Asked Questions <span className='c'> <RiQuestionAnswerFill/></span>
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 cursor-pointer py-4 flex justify-between items-center text-left focus:outline-none"
              >
                <span className="text-base sm:text-lg font-medium text-gray-800">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <FiChevronUp className="text-xl sm:text-2xl text-black" />
                ) : (
                  <FiChevronDown className="text-xl sm:text-2xl text-gray-500" />
                )}
              </button>

              <div
                className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? 'h-full opacity-100 py-2'
                    : 'max-h-0 opacity-0 py-0'
                }`}
              >
                <p className="text-sm sm:text-base overflow-y-scroll text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default FAQ;
