import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SEARCH_TERMS = [
  "Notes",
  "Mentors",
  "Posts",
  "Colleges",
];

const INTERVAL_MS = 2000;

/**
 * Gen-Z style animated search placeholder.
 * Shows "Search" (static) + cycling word with slide-up animation.
 */
export default function AnimatedSearchPlaceholder({
  terms = SEARCH_TERMS,
  intervalMs = INTERVAL_MS,
  staticPrefix = "Search AIR Holders",
  className = "",
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % terms.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [terms.length, intervalMs]);

  const currentTerm = terms[index];

  return (
    <span className={`inline-flex items-center truncate ${className}`}>
      <span className="text-gray-400 shrink-0 whitespace-nowrap mr-1">{staticPrefix} </span>
      <span className="relative inline-block overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentTerm}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block text-[#9f3562] font-medium whitespace-nowrap"
          >
            {currentTerm}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
