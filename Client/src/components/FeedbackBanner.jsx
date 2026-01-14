import React, { useState, useEffect } from "react";
import { X, MessageSquarePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FeedbackBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed the banner in this session
        const hasClosed = sessionStorage.getItem("feedback_banner_closed");
        if (!hasClosed) {
            // Small delay for smooth entrance after app load
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem("feedback_banner_closed", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    // z-30 ensures it sits below the Sidebar (z-40) on desktop but above standard content
                    className="fixed top-16 left-0 right-0 z-30 flex items-center justify-center bg-[#9f3562] text-white px-4 py-3 shadow-md border-t border-white/10"
                >
                    <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-7xl mx-auto relative px-2">

                        {/* Content Group */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                            <span className="flex items-center gap-2 text-sm sm:text-base font-medium">
                                <MessageSquarePlus size={18} className="hidden sm:block text-white/90" />
                                <span>Help us improve by sharing your valuable feedback</span>
                            </span>

                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSfLNRocoYXbEwp77Z4knqIkjqHjbUFy4clEhhjmP-A8hblKzQ/viewform"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white text-white hover:text-[#9f3562] border border-white/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm whitespace-nowrap"
                            >
                                Give Feedback
                            </a>
                        </div>

                        {/* Close Button - Absolute on right for desktop, relative for mobile if needed, but absolute is cleaner */}
                        <button
                            onClick={handleClose}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            aria-label="Dismiss feedback banner"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FeedbackBanner;