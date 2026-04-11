import { useState, useEffect } from'react';
import { useNavigate, useLocation } from'react-router-dom';
import { Bell } from'lucide-react';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';

const NotificationBell = () => {
 const { user } = useUser();
 const { mentor } = useMentor();
 const navigate = useNavigate();
 const location = useLocation();
 const [notificationCount, setNotificationCount] = useState(0);
 const [isShaking, setIsShaking] = useState(false);
 const [previousCount, setPreviousCount] = useState(0);

 const isLoggedIn = user || mentor;
 const isFeedPage = location.pathname ==='/';

 useEffect(() => {
 if (!isLoggedIn || !isFeedPage) return;

 const fetchNotificationCount = async () => {
 try {
 const res = await fetch('/api/notifications/unread-count', {
 credentials:'include',
 });
 if (res.ok) {
 const data = await res.json();
 const count = data.count || 0;
 
 // Trigger shake animation when count increases
 if (count > previousCount && count > 0) {
 setIsShaking(true);
 setTimeout(() => setIsShaking(false), 1000);
 }
 
 setNotificationCount(count);
 setPreviousCount(count);
 }
 } catch (error) {
 console.error('Error fetching notification count:', error);
 }
 };

 fetchNotificationCount();

 // Poll for new notifications every 30 seconds
 const interval = setInterval(fetchNotificationCount, 30000);

 return () => clearInterval(interval);
 }, [isLoggedIn, isFeedPage, user, mentor, previousCount]);

 if (!isLoggedIn || !isFeedPage) return null;

 return (
 <>
 <style>
 {`
 @keyframes shake {
 0%, 100% { transform: translateX(0); }
 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-5deg); }
 20%, 40%, 60%, 80% { transform: translateX(5px) rotate(5deg); }
 }
 .shake-animation {
 animation: shake 0.5s ease-in-out;
 }
`}
 </style>
 <button
 onClick={() => navigate('/notifications')}
 className={`absolute top-4 right-2 sm:top-6 sm:right-6 md:top-20 md:right-6 z-50 bg-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
 isShaking ?'shake-animation':''
 }`}
 aria-label="Notifications"
 >
 <div className="relative">
 <Bell className={`w-5 h-5 sm:w-6 sm:h-6 ${notificationCount > 0 ?'text-purple-600':'text-gray-700'}`} />
 {notificationCount > 0 && (
 <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
 {notificationCount > 99 ?'99+': notificationCount}
 </span>
 )}
 </div>
 </button>
 </>
 );
};

export default NotificationBell;
