import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageSquare, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);

  // Pages where bottom nav should be hidden
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideSidebarPages = [
    '/login',
    '/mentors/login',
    '/mentors/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password'
  ];
  const shouldHide = isAdminRoute || hideSidebarPages.some(path => 
    location.pathname.startsWith(path)
  );

  if (shouldHide) return null;

  // Handle protected routes with specific toast messages
  const handleProtectedRoute = (path, actionName) => {
    if (!loggedInAccount) {
      toast.error(`Please login/signup to ${actionName}`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#fff',
          color: '#9f3562',
          fontWeight: '600',
          border: '1px solid #9f3562',
        },
      });
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const navItems = [
    {
      id: 'home',
      icon: Home,
      path: '/feed',
      onClick: () => navigate('/feed'),
      requiresAuth: false
    },
    {
      id: 'explore',
      icon: Search,
      path: '/search',
      onClick: () => navigate('/search'),
      requiresAuth: false
    },
    {
      id: 'upload',
      icon: PlusSquare,
      path: '/add-post',
      onClick: () => handleProtectedRoute('/add-post', 'add post'),
      requiresAuth: true
    },
    {
      id: 'chat',
      icon: MessageSquare,
      path: isUserAccount ? '/chats' : '/mentor/chats',
      onClick: () => handleProtectedRoute(
        isUserAccount ? '/chats' : '/mentor/chats',
        'chat with mentors'
      ),
      requiresAuth: true
    },
    {
      id: 'profile',
      icon: User,
      path: isUserAccount ? '/me/edit' : '/me',
      onClick: () => {
        if (loggedInAccount) {
          navigate(isUserAccount ? '/me/edit' : '/me');
        } else {
          navigate('/login');
        }
      },
      requiresAuth: false,
      matchPaths: isUserAccount ? ['/me/edit'] : ['/me']
    }
  ];

  return (
    <>
      {/* Spacer div to prevent content from hiding behind bottom nav */}
      <div className="md:hidden h-20" />
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          // Determine if active
          let isActive;
          if (item.matchPaths) {
            // For Profile item, only match exact paths
            isActive = item.matchPaths.some(path => 
              location.pathname === path || location.pathname.startsWith(path + '/')
            );
          } else {
            isActive = location.pathname === item.path || 
                       location.pathname.startsWith(item.path + '/');
          }

          return (
            <motion.button
              key={item.id}
              onClick={item.onClick}
              whileTap={{ scale: 0.9 }}
              className={`relative flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors duration-200
                ${isActive ? 'text-[#9f3562]' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              {/* Active Indicator Dot */}
              {isActive && (
                <motion.span
                  layoutId="bottomBarIndicator"
                  className="absolute -top-2 w-6 sm:w-8 h-1 bg-[#9f3562] rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon */}
              <Icon 
                className="w-5 h-5 sm:w-6 sm:h-6"
                strokeWidth={isActive ? 3 : 2} 
              />
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

export default BottomNavBar;