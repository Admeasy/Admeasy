import { Link } from'react-router-dom';
import { motion } from'framer-motion';
import { ArrowRight, Target, TrendingUp, Users, BarChart3, CheckCircle2, Sparkles } from'lucide-react';
const logo ='/favicon.ico';
import SEO from'../components/SEO';

const AdvertiseLanding = () => {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40">
 <SEO title="Advertise on Admeasy | Reach Students & Mentors"description="Advertise your education-related products and services on Admeasy. Reach thousands of students and mentors."/>
 
 {/* Navbar */}
 <nav className="fixed top-0 left-0 w-full h-16 bg-white/95 backdrop-blur-xl z-[1000] border-b border-gray-200">
 <div className="h-full px-4 sm:px-6 flex items-center justify-between max-w-7xl mx-auto">
 <Link to="/"className="flex items-center gap-2">
 <img src={logo} alt="Admeasy"className="w-8 h-8 md:w-10 md:h-10 object-contain"/>
 <span className="hidden sm:block font-bold text-lg text-gray-900">Admeasy</span>
 </Link>
 <Link
 to="/advertiser/signup"
 className="px-4 py-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all duration-300 flex items-center gap-2"
 >
 Sign Up
 <ArrowRight className="w-4 h-4"/>
 </Link>
 </div>
 </nav>

 {/* Hero Section */}
 <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="text-center mb-16"
 >
 <motion.div
 initial={{ scale: 0.9 }}
 animate={{ scale: 1 }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="inline-flex items-center gap-2 px-4 py-2 bg-[#9f3562]/10 rounded-full mb-6"
 >
 <Sparkles className="w-4 h-4 text-[#9f3562]"/>
 <span className="text-sm font-semibold text-[#9f3562]">Reach Your Target Audience</span>
 </motion.div>
 
 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
 Advertise on{''}
 <span className="bg-gradient-to-r from-[#9f3562] to-[#b14270] bg-clip-text text-transparent">
 Admeasy
 </span>
 </h1>
 
 <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
 Connect with thousands of students and mentors actively seeking educational resources, 
 courses, and opportunities. Perfect for education-related businesses.
 </p>

 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link
 to="/advertiser/signup"
 className="px-8 py-4 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-[#9f3562]/30 transition-all duration-300 flex items-center justify-center gap-2"
 >
 Get Started
 <ArrowRight className="w-5 h-5"/>
 </Link>
 <Link
 to="/advertiser/login"
 className="px-8 py-4 bg-white text-[#9f3562] border-2 border-[#9f3562] rounded-xl font-semibold hover:bg-[#9f3562]/5 transition-all duration-300"
 >
 Already have an account?
 </Link>
 </div>
 </motion.div>

 {/* Features Grid */}
 <div className="grid md:grid-cols-3 gap-6 mb-16">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.3 }}
 className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
 >
 <div className="w-12 h-12 bg-gradient-to-br from-[#9f3562]/10 to-pink-100 rounded-xl flex items-center justify-center mb-4">
 <Target className="w-6 h-6 text-[#9f3562]"/>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">Targeted Audience</h3>
 <p className="text-gray-600">
 Reach students and mentors actively engaged in education and college admissions.
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.4 }}
 className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
 >
 <div className="w-12 h-12 bg-gradient-to-br from-[#9f3562]/10 to-pink-100 rounded-xl flex items-center justify-center mb-4">
 <BarChart3 className="w-6 h-6 text-[#9f3562]"/>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
 <p className="text-gray-600">
 Track views, clicks, and engagement with detailed analytics and insights.
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.5 }}
 className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
 >
 <div className="w-12 h-12 bg-gradient-to-br from-[#9f3562]/10 to-pink-100 rounded-xl flex items-center justify-center mb-4">
 <TrendingUp className="w-6 h-6 text-[#9f3562]"/>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Management</h3>
 <p className="text-gray-600">
 Create, manage, and track your ads all from one simple dashboard.
 </p>
 </motion.div>
 </div>

 {/* Why Advertise Section */}
 <motion.section
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.6, delay: 0.6 }}
 className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 sm:p-12 mb-16 border border-gray-100"
 >
 <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
 Why Advertise on Admeasy?
 </h2>
 
 <div className="grid md:grid-cols-2 gap-6">
 <div className="flex items-start gap-4">
 <CheckCircle2 className="w-6 h-6 text-[#9f3562] flex-shrink-0 mt-1"/>
 <div>
 <h3 className="font-bold text-gray-900 mb-1">Education-Focused Platform</h3>
 <p className="text-gray-600">
 Our platform is specifically designed for students and mentors, ensuring your ads reach the right audience.
 </p>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <CheckCircle2 className="w-6 h-6 text-[#9f3562] flex-shrink-0 mt-1"/>
 <div>
 <h3 className="font-bold text-gray-900 mb-1">High Engagement</h3>
 <p className="text-gray-600">
 Users actively browse content, making them more likely to interact with relevant advertisements.
 </p>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <CheckCircle2 className="w-6 h-6 text-[#9f3562] flex-shrink-0 mt-1"/>
 <div>
 <h3 className="font-bold text-gray-900 mb-1">Quality Control</h3>
 <p className="text-gray-600">
 All ads are reviewed by our team to ensure quality and relevance for our community.
 </p>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <CheckCircle2 className="w-6 h-6 text-[#9f3562] flex-shrink-0 mt-1"/>
 <div>
 <h3 className="font-bold text-gray-900 mb-1">Transparent Pricing</h3>
 <p className="text-gray-600">
 Simple, transparent pricing with no hidden fees. Pay only for what you need.
 </p>
 </div>
 </div>
 </div>
 </motion.section>

 {/* CTA Section */}
 <motion.section
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.8 }}
 className="text-center bg-gradient-to-r from-[#9f3562] to-[#b14270] rounded-3xl p-12 text-white"
 >
 <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
 <p className="text-lg mb-8 opacity-90">
 Join education-focused businesses advertising on Admeasy today.
 </p>
 <Link
 to="/advertiser/signup"
 className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#9f3562] rounded-xl font-semibold hover:shadow-xl transition-all duration-300"
 >
 Create Your Advertiser Account
 <ArrowRight className="w-5 h-5"/>
 </Link>
 </motion.section>
 </section>

 {/* Footer */}
 <footer className="mt-16 py-8 px-4 text-center text-gray-600 border-t border-gray-200">
 <p>© {new Date().getFullYear()} Admeasy. All rights reserved.</p>
 </footer>
 </div>
 );
};

export default AdvertiseLanding;
