import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, CirclePlus, MessagesSquare, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useUnreadSpaceMessages } from '../hooks/useUnreadSpaceMessages';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { trackAdmeasyEvent } from '../utils/trackEvent';

const BOTTOM_CTA_TOOLTIP_KEY = 'admeasy:bottom_cta_tooltip_done';
/** Dedupe analytics if React Strict Mode runs the effect twice before hide. */
let bottomCtaShownEventSent = false;

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();

  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  const [imageError, setImageError] = useState(false);
  const { unreadCount: unreadMessagesCount } = useUnreadMessages();
  const { unreadCount: unreadSpaceMessagesCount } = useUnreadSpaceMessages();

  // Scroll hide/show state
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const [showPlusHint, setShowPlusHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(BOTTOM_CTA_TOOLTIP_KEY)) return;
    } catch {
      return;
    }
    setShowPlusHint(true);
    if (!bottomCtaShownEventSent) {
      bottomCtaShownEventSent = true;
      trackAdmeasyEvent('bottom_cta_shown');
    }
    const hide = window.setTimeout(() => {
      setShowPlusHint(false);
      try {
        sessionStorage.setItem(BOTTOM_CTA_TOOLTIP_KEY, '1');
      } catch {
        /* ignore */
      }
    }, 4500);
    return () => window.clearTimeout(hide);
  }, []);

  // Reset image error when user or mentor changes
  useEffect(() => {
    setImageError(false);
  }, [user, mentor]);

  // Scroll hide/show logic
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
            // Scrolling down — hide
            setIsVisible(false);
          } else {
            // Scrolling up — show
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get profile image URL
  const profileImageUrl = loggedInAccount
    ? (isUserAccount
      ? (user?.imageUrl || user?.image)
      : (mentor?.imageUrl || mentor?.image))
    : null;

  const hasProfileImage = profileImageUrl && !imageError;

  // Pages where bottom nav should be hidden
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSpaceFeedPage = /^\/spaces\/[^/]+$/.test(location.pathname);
  const hideSidebarPages = [
    '/login',
    '/mentors/login',
    '/mentors/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password'
  ];
  const shouldHide = isAdminRoute || isSpaceFeedPage || hideSidebarPages.some(path =>
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
      path: '/',
      onClick: () => navigate('/'),
      requiresAuth: false
    },
    {
      id: 'upload',
      icon: CirclePlus,
      path: '/posts/create',
      onClick: () => {
        trackAdmeasyEvent('bottom_cta_clicked');
        handleProtectedRoute('/posts/create', 'create a post');
      },
      requiresAuth: true
    },
    {
      id: 'spaces',
      icon: Users,
      path: '/spaces',
      onClick: () => handleProtectedRoute('/spaces', 'view spaces'),
      requiresAuth: true
    },
    {
      id: 'chat',
      icon: MessagesSquare,
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
      path: '/me',
      onClick: () => {
        if (loggedInAccount) {
          if (location.pathname === '/me') {
            navigate('/me', { replace: true });
          } else {
            navigate('/me');
          }
        } else {
          navigate('/login');
        }
      },
      requiresAuth: false,
      matchPaths: ['/me']
    }
  ];

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 h-16 flex items-center justify-between transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        // Determine if active
        let isActive;
        if (item.matchPaths) {
          isActive = item.matchPaths.some(path =>
            location.pathname === path || location.pathname.startsWith(path + '/')
          );
        } else {
          isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
        }

        // For profile item, show profile image if available
        const isProfileItem = item.id === 'profile';
        const showProfileImage = isProfileItem && hasProfileImage;

        const showCreateHint = item.id === 'upload' && showPlusHint;

        return (
          <motion.button
            key={item.id}
            onClick={item.onClick}
            whileTap={{ scale: 0.9 }}
            className={`relative flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors duration-200
              ${isActive ? 'text-[#9f3562]' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <AnimatePresence>
              {showCreateHint && (
                <motion.div
                  key="plus-cta-hint"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute -top-[42px] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap"
                  aria-hidden
                >
                  <span className="block rounded-lg border border-gray-200/80 bg-gray-900/88 px-2.5 py-1.5 text-[11px] font-medium leading-tight text-white shadow-lg backdrop-blur-sm">
                    Have doubt? Ask now
                  </span>
                  <span className="mx-auto block h-0 w-0 border-x-[6px] border-x-transparent border-t-[5px] border-t-gray-900/88" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Active Indicator Dot */}
            {isActive && (
              <motion.span
                layoutId="bottomBarIndicator"
                className="absolute -top-2 w-6 sm:w-8 h-1 bg-[#9f3562] rounded-b-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {/* Profile Image or Icon */}
            {showProfileImage ? (
              <img
                src={profileImageUrl}
                alt={loggedInAccount?.name || 'Profile'}
                className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full object-cover ring-2 transition-all ${isActive ? 'ring-[#9f3562]' : 'ring-gray-200'
                  }`}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="relative">
                <Icon
                  className="w-5.5 h-5.5 sm:w-6 sm:h-6"
                  strokeWidth={isActive ? 3 : 2}
                />
                {/* Unread message notification badge for Chats */}
                {item.id === 'chat' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
                {/* Unread space message notification badge */}
                {item.id === 'spaces' && unreadSpaceMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                    {unreadSpaceMessagesCount > 99 ? '99+' : unreadSpaceMessagesCount}
                  </span>
                )}
              </div>
            )}
            {isProfileItem && loggedInAccount && !loggedInAccount.username && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;