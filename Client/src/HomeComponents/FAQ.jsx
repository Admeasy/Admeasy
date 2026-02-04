import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { RiQuestionAnswerFill } from "react-icons/ri";
import { HelpCircle, Sparkles } from "lucide-react";

const faqs = [
  {
    question: "What is Admeasy?",
    answer: `Admeasy puts students first, helping you choose the right college with honest guidance, trusted information, and complete privacy. No spam, no data selling just a simple, stress-free admission journey that keeps you confident, informed, and free from future regrets.`,
  },
  {
    question: "Is my data safe with Admeasy?",
    answer: `Admeasy keeps your data 100% safe and private. We collect only what's needed, never sell or share it, and ensure no spam calls or emails just a secure, personalized admission experience.`,
  },
  {
    question: "Can Admeasy help me land a scholarship or find affordable college options?",
    answer: "Absolutely! While we don't hand out scholarships ourselves, we make finding them a whole lot easier. Use our smart filters to discover colleges offering scholarships, fee waivers, or budget-friendly programs that match your needs. Need the latest details? Our support team's got your back!",
  },
  {
    question: "Does Admeasy offer counselling or live support?",
    answer: `Absolutely! Admeasy offers personalized counselling from experienced undergraduates and our support team. From college confusion to clear guidance, we've got your back—delivering expert advice at a budget-friendly price.`,
  },
  {
    question: "How often is the college database updated?",
    answer: `We keep it fresh! College details like fees and placement stats are updated yearly from official sources, while internships and extra info are refreshed more often. For the latest updates, our support team is always ready to help.`,
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.section
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full px-4 py-16 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 opacity-50 pointer-events-none" />
      <motion.div
        className="absolute top-20 left-1/4 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div id='FAQ' className="relative max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-violet-200/50 shadow-lg"
          >
            <HelpCircle className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">Got Questions?</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl text-gray-900 font-extrabold mb-3"
          >
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-sm md:text-base"
          >
            Everything you need to know about Admeasy
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={`bg-white/90 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden ${
                openIndex === index
                  ? 'border-violet-300 shadow-xl'
                  : 'border-gray-200 hover:border-violet-200 hover:shadow-xl'
              }`}>
                <motion.button
                  onClick={() => toggleFAQ(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <motion.div
                      animate={{
                        rotate: openIndex === index ? 360 : 0,
                        scale: openIndex === index ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`flex-shrink-0 p-2 rounded-xl transition-all duration-300 ${
                        openIndex === index
                          ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg'
                          : 'bg-gray-100 group-hover:bg-violet-100'
                      }`}
                    >
                      <RiQuestionAnswerFill className={`w-5 h-5 transition-colors duration-300 ${
                        openIndex === index ? 'text-white' : 'text-violet-600'
                      }`} />
                    </motion.div>
                    
                    <span className={`text-base sm:text-lg font-bold transition-colors duration-300 ${
                      openIndex === index
                        ? 'text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text'
                        : 'text-gray-800 group-hover:text-violet-700'
                    }`}>
                      {faq.question}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 ml-4"
                  >
                    {openIndex === index ? (
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full">
                        <FiChevronUp className="text-xl text-white" />
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-100 group-hover:bg-violet-100 rounded-full transition-colors duration-300">
                        <FiChevronDown className="text-xl text-violet-600" />
                      </div>
                    )}
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="pl-14 pr-4">
                          {/* Decorative line */}
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="h-0.5 bg-gradient-to-r from-violet-400 to-fuchsia-500 rounded-full mb-4 origin-left"
                          />
                          
                          <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-sm sm:text-base text-gray-700 leading-relaxed"
                          >
                            {faq.answer}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-block p-8 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl border-2 border-violet-200 shadow-lg">
            <p className="text-gray-700 text-base sm:text-lg mb-4">
              Still have questions? We're here to help!
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <RiQuestionAnswerFill className="w-5 h-5" />
              Contact Support
            </motion.a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FAQ;