import React from "react";
import { useState,useEffect } from "react";
const FeedbackStars = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!isClosed && window.scrollY > 200) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isClosed]);

  const handleClose = () => {
    setIsClosed(true);
    setIsVisible(false);
  };

  const handleStarClick = (star) => {
    setRating(star);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes starPop {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }

        .feedback-container {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .star-icon {
          transition: all 0.2s ease;
        }

        .star-icon:hover {
          transform: scale(1.2) rotate(10deg);
        }

        .star-icon:active {
          animation: starPop 0.3s ease;
        }

        .close-btn {
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          transform: rotate(90deg) scale(1.1);
          background: rgba(239, 68, 68, 0.1);
        }

        .close-btn:active {
          transform: rotate(90deg) scale(0.95);
        }
      `}</style>

      <div className="feedback-container fixed bottom-8 left-8 z-50 bg-white rounded-2xl shadow-xl p-5 pr-12 border border-slate-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="close-btn absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500"
          aria-label="Close feedback"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Rate Your Experience
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              How would you rate your visit?
            </p>
          </div>

          {/* Stars */}
          <div className="flex gap-2 cursor-pointer">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="star-icon cursor-pointer focus:outline-none"
                aria-label={`Rate ${star} stars`}
                title={`${star} star`}
              >
                <svg
                  className="w-8 h-8"
                  fill={
                    star <= (hoveredStar || rating)
                      ? "#FBBF24"
                      : "none"
                  }
                  stroke={
                    star <= (hoveredStar || rating)
                      ? "#FBBF24"
                      : "#CBD5E1"
                  }
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-sm text-sky-600 font-medium">
              Thanks for your {rating} star rating to Admeasy!
            </p>
          )}
        </div>
      </div>
    </>
  );
};
export default FeedbackStars