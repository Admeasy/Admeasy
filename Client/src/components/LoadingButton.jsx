import React from'react';

const LoadingButton = ({ text, variant }) => {
 const variants = {
 blue:'bg-[#9f3562] hover:bg-[#b24a78] shadow-[#9f3562]/50',
 green:'bg-green-600 hover:bg-green-700 shadow-green-500/50',
 purple:'bg-purple-600 hover:bg-purple-700 shadow-purple-500/50',
 teal:'bg-teal-600 hover:bg-teal-700 shadow-teal-500/50',
 brand:'bg-[#9f3562] hover:bg-[#b24a78] shadow-[#9f3562]/50'
 };

 return (
 <button
 disabled
 type="button"
 className={`w-full relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-white font-semibold rounded-xl ${variants[variant]} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-not-allowed`}
 >
 {/* Spinner */}
 <div className="relative w-5 h-5">
 <svg className="animate-spin"viewBox="0 0 50 50">
 <circle
 className="animate-dash"
 cx="25"
 cy="25"
 r="20"
 fill="none"
 stroke="white"
 strokeWidth="4"
 strokeLinecap="round"
 style={{
 strokeDasharray:'1, 150',
 strokeDashoffset: 0,
 animation:'dash 1.5s ease-in-out infinite'
 }}
 />
 </svg>
 </div>

 <span className="text-[15px] tracking-wide">{text}</span>

 <style jsx>{`
 @keyframes dash {
 0% {
 stroke-dasharray: 1, 150;
 stroke-dashoffset: 0;
 }
 50% {
 stroke-dasharray: 90, 150;
 stroke-dashoffset: -35;
 }
 100% {
 stroke-dasharray: 90, 150;
 stroke-dashoffset: -124;
 }
 }
`}</style>
 </button>
 );
};
export default LoadingButton;