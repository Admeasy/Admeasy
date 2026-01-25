import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Newspaper, UserPlus, MessagesSquare, Menu, X, ChevronLeft, Compass, CirclePlus, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import logo from "../assets/Admeasy/favicon.ico";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// SIDEBAR WIDTH CONSTANTS (VERY IMPORTANT)
export const SIDEBAR_EXPANDED_WIDTH = 288; // 18rem
export const SIDEBAR_COLLAPSED_WIDTH = 88; // 5.5rem

const LeftSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const location = useLocation();
  const { user, setUser } = useUser();
  const { mentor, setMentor } = useMentor();
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  const landingPage = location.pathname === '/'
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSpaceFeedPage = /^\/spaces\/[^/]+$/.test(location.pathname);
  const hideSidebarPages = ['/login', '/mentors/login', '/mentors/register', '/onboarding', '/forgot-password', '/reset-password'];
  const shouldHide = isAdminRoute || isSpaceFeedPage || hideSidebarPages.some(path => location.pathname.startsWith(path));
  const { unreadCount: unreadMessagesCount } = useUnreadMessages();

  if (shouldHide) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/', exact: true },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: CirclePlus, label: 'Create', path: '/posts/create' },
    ...(loggedInAccount ? [{ icon: Users, label: 'Spaces', path: '/spaces' }] : []),
    ...(loggedInAccount
      ? isUserAccount
        ? [{ icon: MessagesSquare, label: 'Chats', path: '/chats' }]
        : [{ icon: MessagesSquare, label: 'Chats', path: '/mentor/chats' }]
      : []),
    { icon: Newspaper, label: 'Blogs', path: '/blog' },
    ...(!loggedInAccount ? [{ icon: UserPlus, label: 'Sign Up/Log In', path: '/login' }] : [])
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Optimized Animation Configuration
  const sidebarTransition = { duration: 0.3, ease: "easeInOut" };
  const textVariants = {
    hidden: { opacity: 0, width: 0, transition: { duration: 0.2 } }, // Fade out fast
    visible: { opacity: 1, width: "auto", transition: { duration: 0.3, delay: 0.1 } } // Fade in slightly slower
  };

  const handleLogout = async () => {
    if (!user && !mentor) {
      return null;
    }

    try {
      if (user) {
        const res = await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include'
        });

        if (res.ok) {
          setUser(null);
          localStorage.clear();
          toast.success("Logged out successfully");
          navigate('/');
        }
      } else if (mentor) {
        const res = await fetch('/api/mentors/logout', {
          method: 'POST',
          credentials: 'include'
        });

        if (res.ok) {
          setMentor(null);
          localStorage.clear();
          toast.success("Logged out successfully");
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Logout failed: ", err);
      toast.error("Failed to Log out");
    }
  }

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (768px and above) ================= */}
      <motion.aside
        initial="expanded"
        animate={{
          width: isCollapsed
            ? SIDEBAR_COLLAPSED_WIDTH
            : SIDEBAR_EXPANDED_WIDTH
        }}
        variants={{
          expanded: { width: "18rem" },
          collapsed: { width: "5.5rem" }
        }}
        transition={sidebarTransition}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-xl z-40 flex-col py-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute right-6 top-1 w-5 h-5 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center cursor-pointer z-50 hover:border-[#9f3562] group"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-[#9f3562]" />
          </motion.div>
        </motion.button>

        {/* Header */}
        <div className={`flex items-center gap-3 mt-0 mb-8 px-5 ${isCollapsed ? 'justify-center' : ''} h-12`}>
          <motion.div
            onClick={() => navigate('/')}
            layout // Magic framer motion prop for smooth layout shifts
            className="w-11 h-11 min-w-[2.75rem] rounded-xl bg-gradient-to-br from-[#ffffff] via-[#fff7fa] to-[#e9dce1] flex items-center justify-center shadow-md shadow-[#9f3562]/30 cursor-pointer"
          >
            <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          </motion.div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                onClick={() => navigate('/')}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="overflow-hidden whitespace-nowrap cursor-pointer"
              >
                <h2 className="font-bold text-xl text-gray-900 tracking-tight">Admeasy</h2>
                <p className="text-xs text-gray-500 font-medium">Your Education Hub</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-2 w-full px-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            let isActive;
            if (item.matchPaths) {
              isActive = item.matchPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
            } else {
              isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ""}
                className={() =>
                  `relative flex items-center py-3 rounded-xl transition-all duration-300 group overflow-hidden
                  ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'}
                  ${isActive
                    ? "text-white shadow-md shadow-[#9f3562]/30"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#9f3562]"
                  }`
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#9f3562] to-[#b14270]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div className="relative z-10 flex-shrink-0">
                  {item.icon === "profilePhoto" ? <img
                    src={loggedInAccount.imageUrl || loggedInAccount.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={loggedInAccount.name}
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-[#9f3562]/30 group-hover:ring-[#9f3562]/60 transition-all"
                  /> : <Icon className="w-5 h-5" />}
                  {/* Unread message notification badge for Chats */}
                  {item.label === 'Chats' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </motion.div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="font-admeasy-bold text-sm relative z-10 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active Dot */}
                {isActive && !isCollapsed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white relative z-10"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        {loggedInAccount && (
          <motion.div
            layout
            className={`mt-auto pt-6 border-t border-gray-100 px-3 transition-all duration-300 mb-4`}
          >
            <div
              onClick={() => navigate('/me')}
              className={`flex items-center rounded-xl hover:bg-gray-50 transition-colors duration-300 cursor-pointer group py-2.5 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={loggedInAccount.imageUrl || loggedInAccount.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt={loggedInAccount.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#9f3562]/30 group-hover:ring-[#9f3562]/60 transition-all"
                />
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex flex-1 items-center justify-between min-w-0 gap-2"
                  >
                    <Link to={'/me'} className="min-w-0 overflow-hidden">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {loggedInAccount.name}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-[#9f3562] transition-colors whitespace-nowrap">View Profile</p>
                    </Link>
                    <button
                      className='shrink-0 text-xs font-bold px-2 py-1.5 bg-white border border-[#9f3562] rounded-lg text-[#9f3562] hover:bg-[#9f3562] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.aside>
    </>
  );
};

export default LeftSidebar;