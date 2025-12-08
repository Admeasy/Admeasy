import { useEffect, useState } from "react";

const ScrollUpButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial scroll position
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .scroll-btn-container {
          animation: fadeSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .scroll-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(14, 165, 233, 0.5),
                      0 8px 10px -6px rgba(14, 165, 233, 0.3);
        }

        .scroll-btn:active {
          transform: translateY(0);
          box-shadow: 0 4px 15px -3px rgba(14, 165, 233, 0.4);
        }

        .arrow-animate {
          transition: transform 0.3s ease;
        }

        .scroll-btn:hover .arrow-animate {
          transform: translateY(-3px);
          animation: float 1.5s ease-in-out infinite;
        }

        .glow-ring {
          transition: opacity 0.3s ease;
        }

        .scroll-btn:hover .glow-ring {
          opacity: 1;
        }
      `}</style>
      
      <div className="scroll-btn-container cursor-pointer fixed bottom-8 right-8 z-50">
        {/* Glow ring */}
        <div className="glow-ring cursor-pointer absolute -inset-1 bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 rounded-full opacity-0 blur-md"></div>
        
        {/* Main button */}
        <button
          onClick={scrollToTop}
          className="cursor-pointer scroll-btn relative w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group"
          aria-label="Scroll to top"
        >
          {/* Background shine effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Arrow icon */}
          <div className="arrow-animate relative">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>

          {/* Pulse indicator */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-white/30"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          ></div>
        </button>
      </div>
    </>
  );
};

export default ScrollUpButton