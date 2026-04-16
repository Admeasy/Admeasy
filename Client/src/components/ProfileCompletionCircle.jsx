import React from'react';
import { motion } from'framer-motion';

const ProfileCompletionCircle = ({ 
 percentage = 0, 
 size = 48, 
 strokeWidth = 3, 
 children,
 className =""
}) => {
 const radius = (size - strokeWidth) / 2;
 const circumference = radius * 2 * Math.PI;
 const offset = circumference - (percentage / 100) * circumference;

 return (
 <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
 <svg
 width={size}
 height={size}
 className="transform -rotate-90"
 >
 {/* Background Circle */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="transparent"
 stroke="#f3f4f6"
 strokeWidth={strokeWidth}
 />
 {/* Progress Circle */}
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
 transition={{ duration: 1, ease:"easeOut"}}
 strokeLinecap="round"
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 {children}
 </div>
 
 {/* Tooltip/Percentage label could go here if needed, but per request keeping it as a visual indicator around avatar */}
 </div>
 );
};

export default ProfileCompletionCircle;
