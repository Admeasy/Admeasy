import { useEffect, useState } from"react";
import { ChevronUp } from"lucide-react";

const ScrollUpButton = () => {
 const [isVisible, setIsVisible] = useState(false);

 useEffect(() => {
 const handleScroll = () => {
 setIsVisible(window.scrollY > 300);
 };

 window.addEventListener("scroll", handleScroll);
 handleScroll();
 
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 const scrollToTop = () => {
 window.scrollTo({ top: 0, behavior:"smooth"});
 };

 if (!isVisible) return null;

 return (
 <>
 <style>{`
 @keyframes slideInBounce {
 0% { opacity: 0; transform: translateY(30px) scale(0.8); }
 60% { opacity: 1; transform: translateY(-5px) scale(1.05); }
 100% { opacity: 1; transform: translateY(0) scale(1); }
 }
 @keyframes floatSoft {
 0%, 100% { transform: translateY(0); }
 50% { transform: translateY(-4px); }
 }
 @keyframes shimmer {
 0% { background-position: -200% center; }
 100% { background-position: 200% center; }
 }
 @keyframes ripple {
 0% { transform: scale(1); opacity: 0.4; }
 100% { transform: scale(1.5); opacity: 0; }
 }
 .scroll-up-container {
 animation: slideInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
 }
 .scroll-up-btn {
 position: relative;
 transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
 }
 /* Only apply hover lift on non-touch devices to prevent sticking on mobile */
 @media (hover: hover) {
 .scroll-up-btn:hover {
 transform: translateY(-4px);
 box-shadow: 0 20px 35px -15px rgba(159, 53, 98, 0.5), 0 0 0 3px rgba(159, 53, 98, 0.1);
 }
 .scroll-up-btn:hover .arrow-icon {
 animation: floatSoft 1.2s ease-in-out infinite;
 }
 }
 .scroll-up-btn:active {
 transform: translateY(-1px) scale(0.95);
 }
 .shimmer-effect {
 background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
 background-size: 200% 100%;
 animation: shimmer 2s infinite;
 }
 .ripple-effect {
 animation: ripple 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
 }
`}</style>
 
 {/* Container: Adjusted positioning for mobile (bottom-5 right-5) vs desktop (md:bottom-8 md:right-8) */}
 <div className="scroll-up-container fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50">
 <button
 onClick={scrollToTop}
 /* Responsive Sizes:
 - Mobile: w-11 h-11 (44px is a good touch target size)
 - Desktop: md:w-14 md:h-14 (Original size)
 */
 className="cursor-pointer scroll-up-btn group relative w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br from-[#9f3562] via-[#b8447a] to-[#9f3562] rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center overflow-hidden"
 aria-label="Scroll to top"
 >
 {/* Background ripple effect */}
 <div className="ripple-effect absolute inset-0 bg-white/20 rounded-xl md:rounded-2xl"></div>
 
 {/* Shimmer overlay */}
 <div className="shimmer-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
 
 {/* Gradient border glow */}
 <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-75 blur transition-opacity duration-300"></div>
 
 {/* Main content */}
 <div className="relative z-10 flex flex-col items-center">
 {/* Icon: Smaller on mobile (w-6 h-6), larger on desktop (md:w-7 md:h-7) */}
 <ChevronUp 
 className="arrow-icon w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg"
 strokeWidth={3}
 />
 </div>

 {/* Decorative dots */}
 <div className="absolute top-2 right-2 w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
 <div className="absolute bottom-2 left-2 w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full group-hover:scale-150 transition-transform duration-300 delay-75"></div>
 
 {/* Inner highlight */}
 <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
 </button>

 {/* Floating label: Hidden on mobile (hidden), shown on desktop (md:block) */}
 <div className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
 <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
 Back to top
 <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
 </div>
 </div>
 </div>
 </>
 );
};

export default ScrollUpButton;