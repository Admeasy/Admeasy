import { useEffect, useState } from "react";

const ScrollUpButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);  
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes floatUp {
        0% { 
          opacity: 0.3; 
          transform: translateY(8px) scale(0.8); 
        }
        50% { 
          opacity: 1; 
          transform: translateY(-4px) scale(1); 
        }
        100% { 
          opacity: 0.3; 
          transform: translateY(-16px) scale(0.8); 
        }
      }
      
      @keyframes buttonPulse {
        0%, 100% { 
          transform: scale(1); 
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.3);
        }
        50% { 
          transform: scale(1.05); 
          box-shadow: 0 6px 30px rgba(14, 165, 233, 0.4);
        }
      }
      
      @keyframes slideIn {
        from { 
          transform: translateY(100px) scale(0.8);
          opacity: 0;
        }
        to { 
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      
      .scroll-button-enter {
        animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .scroll-button-hover:hover {
        animation: buttonPulse 2s infinite;
      }
      
      .scroll-button-hover:hover .arrow-icon {
        transform: translateY(-2px);
      }
      
      .scroll-button-hover:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showButton) return null;

  return (
    <div
      className="scroll-button-enter rounded-2xl scroll-button-hover fixed bottom-6 right-6 z-50 w-14 h-14 cursor-pointer transition-all duration-300 ease-out"
      onClick={scrollToTop}
    >
      {/* Main button container */}
      <div className="relative w-full h-full bg-gradient-to-br from-white via-blue-50 to-sky-100 rounded-2xl border border-sky-200 shadow-lg backdrop-blur-sm overflow-hidden group">
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-sky-50/20 to-transparent rounded-2xl"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div 
            className="absolute bottom-2 left-3 w-1 h-1 bg-sky-400 rounded-full opacity-60"
            style={{ animation: "floatUp 2.5s infinite linear" }}
          ></div>
          <div 
            className="absolute bottom-2 right-3 w-1 h-1 bg-blue-400 rounded-full opacity-60"
            style={{ animation: "floatUp 2.5s infinite linear 0.8s" }}
          ></div>
          <div 
            className="absolute bottom-2 left-1/2 w-0.5 h-0.5 bg-sky-300 rounded-full opacity-70"
            style={{ animation: "floatUp 2.5s infinite linear 1.6s" }}
          ></div>
        </div>
        
        {/* Main arrow icon */}
        <div className="arrow-icon absolute inset-0 flex items-center justify-center transition-transform duration-200">
          <div className="relative">
            {/* Arrow shaft */}
            <div className="w-0.5 h-6 bg-gradient-to-t from-sky-600 to-sky-400 rounded-full mx-auto"></div>
            
            {/* Arrow head */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="w-3 h-3 border-t-2 border-r-2 border-sky-500 transform rotate-[-45deg] bg-gradient-to-br from-sky-400 to-sky-600 rounded-sm"></div>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-sky-400/20 rounded-full blur-sm"></div>
          </div>
        </div>
        
        {/* Hover ripple effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-blue-400/10 to-sky-400/10 rounded-2xl animate-pulse"></div>
        </div>
      </div>
      
      {/* Outer glow ring */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 via-blue-400/20 to-sky-400/20 rounded-3xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default ScrollUpButton;