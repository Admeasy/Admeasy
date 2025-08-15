import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { RiQuestionAnswerFill } from "react-icons/ri";


const faqs = [
  {
    question: "What is Admeasy?",
    answer: `Admeasy puts students first, helping you choose the right college with honest guidance, trusted information, and complete privacy. No spam, no data selling—just a simple, stress-free admission journey that keeps you confident, informed, and free from future regrets.`,
  },
  {
    question: "Is my data safe with Admeasy?",
    answer: `Admeasy keeps your data 100% safe and private. We collect only what’s needed, never sell or share it, and ensure no spam calls or emails—just a secure, personalized admission experience.`,
  },
  {
    question: "Can Admeasy help me land a scholarship or find affordable college options?",
    answer: "Absolutely! While we don’t hand out scholarships ourselves, we make finding them a whole lot easier. Use our smart filters to discover colleges offering scholarships, fee waivers, or budget-friendly programs that match your needs. Need the latest details? Our support team’s got your back!",
  },
  {
    question: "Does Admeasy offer counselling or live support?",
    answer: `Absolutely! Admeasy offers personalized counselling from experienced undergraduates and our support team. From college confusion to clear guidance, we’ve got your back—delivering expert advice at a budget-friendly price.`,
  },
  {
    question: "How often is the college database updated?",
    answer: `We keep it fresh! College details like fees and placement stats are updated yearly from official sources, while internships and extra info are refreshed more often. For the latest updates, our support team is always ready to help.`,
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
