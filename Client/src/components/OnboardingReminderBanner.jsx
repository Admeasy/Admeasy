import React, { useState, useEffect } from'react';
import { useNavigate, useLocation } from'react-router-dom';
import { X } from'lucide-react';
import { useUser } from'../context/UserContext';

export default function OnboardingReminderBanner() {
 const { user, isLoading } = useUser();
 const navigate = useNavigate();
 const location = useLocation();
 const [isVisible, setIsVisible] = useState(true);

 // Don't show if loading or no user
 if (isLoading || !user) return null;

 // Don't show if already completed
 if (user.hasCompletedOnboarding) return null;

 // Don't show if on onboarding page
 if (location.pathname.startsWith('/onboarding')) return null;

 // Don't show if dismissed in this session
 if (sessionStorage.getItem('onboarding_banner_dismissed')) return null;

 if (!isVisible) return null;

 const handleDismiss = (e) => {
 e.stopPropagation();
 setIsVisible(false);
 sessionStorage.setItem('onboarding_banner_dismissed','true');
 };

 const handleNavigate = () => {
 navigate('/onboarding');
 };

 return (
 <div
 onClick={handleNavigate}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all relative z-50 w-full"
 >
 <div className="flex-1 flex justify-center items-center gap-2 font-medium">
 <span>📌</span>
 <span>Please complete your onboarding</span>
 </div>
 <button
 onClick={handleDismiss}
 className="p-1 hover:bg-white/20 rounded-full transition-colors absolute right-4"
 aria-label="Close reminder"
 >
 <X size={20} />
 </button>
 </div>
 );
}
