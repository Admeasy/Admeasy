import React from 'react';
import { motion } from 'framer-motion';

const ProfileCompletionCircle = ({ 
  percentage = 0, 
  size = 48, 
  strokeWidth = 4, 
  children,
  className = ""
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className={`relative flex items-center justify-center transition-transform duration-300 ${className}`} 
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 drop-shadow-sm"
      >
        {/* Background Circle - slightly more visible track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle - Vibrant color */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#9f3562"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "circOut" }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_2px_rgba(159,53,98,0.3)]"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
      
      {/* Overlapping progress ring effect for 'full' look if needed */}
      {percentage === 100 && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="absolute inset-0 rounded-full border-2 border-[#9f3562]/20 animate-ping pointer-events-none"
         />
      )}
    </div>
  );
};

export default ProfileCompletionCircle;
