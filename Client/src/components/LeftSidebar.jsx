import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, GraduationCap, Users, Newspaper, Info, Mail,
  UserPlus, MessageSquare, User, Menu, X, ChevronLeft
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import logo from "../assets/Admeasy/newLogo.png";
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user } = useUser();
  const { mentor } = useMentor();
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  const landingPage = location.pathname === '/'
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  //const [isCollapsed, setIsCollapsed] = useState(landingPage?true:false);
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideSidebarPages = ['/login', '/mentors/login', '/mentors/register', '/onboarding', '/forgot-password', '/reset-password'];
  const shouldHide = isAdminRoute || hideSidebarPages.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed', exact: true },
    { icon: GraduationCap, label: 'Colleges', path: '/colleges' },
    { icon: Users, label: 'Mentors', path: '/mentors' },
    { icon: Newspaper, label: 'Blogs', path: '/blog' },
    { icon: Info, label: 'About', path: '/about' },
    { icon: Mail, label: 'Contact', path: '/contact' },
    ...(loggedInAccount
      ? isUserAccount
        ? [{ icon: MessageSquare, label: 'Chat', path: '/chats' }]
        : [{ icon: MessageSquare, label: 'Messages', path: '/mentor/chats' }]
      : []),
    loggedInAccount
      ? { icon: User, label: 'Profile', path: '/me', exact: false, matchPaths: ['/me'] }
      : { icon: UserPlus, label: 'Sign Up', path: '/login' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Optimized Animation Configuration
  const sidebarTransition = { duration: 0.3, ease: "easeInOut" }; // Fast & Smooth (300ms)
  const textVariants = {
    hidden: { opacity: 0, width: 0, transition: { duration: 0.2 } }, // Fade out fast
    visible: { opacity: 1, width: "auto", transition: { duration: 0.3, delay: 0.1 } } // Fade in slightly slower
  };

  return (
    <>
      {/* ================= MOBILE MENU BUTTON ================= */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 w-12 h-12 rounded-xl bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center border border-gray-100 hover:shadow-xl hover:border-[#9f3562]/20 transition-all active:scale-90"
      >
        <AnimatePresence mode="wait">
          {isMobileMenuOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-[#9f3562]" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-[#9f3562]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>


      {/* ================= DESKTOP SIDEBAR FIXED================= */}
      <motion.aside
        initial="expanded"
        animate={{
          width: isCollapsed
            ? SIDEBAR_COLLAPSED_WIDTH
            : SIDEBAR_EXPANDED_WIDTH
        }}
        variants={{
          expanded: { width: "18rem" }, // w-72
          collapsed: { width: "5.5rem" }  // Slightly wider than w-20 to fit centered icons perfectly
        }}
        transition={sidebarTransition}
        className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-xl z-40 flex-col py-8 overflow-hidden"
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute right-6 top-1 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center cursor-pointer z-50 hover:border-[#9f3562] group"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-[#9f3562]" />
          </motion.div>
        </motion.button>

        {/* Header */}
        <div className={`flex items-center gap-3 mb-8 px-5 ${isCollapsed ? 'justify-center' : ''} h-12`}>
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
                className="overflow-hidden whitespace-nowrap"
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
            // Special handling for Profile item to prevent false matches
            let isActive;
            if (item.matchPaths) {
              // For Profile item, only match exact paths
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
                  <Icon className="w-5 h-5" />
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
            className={`mt-auto pt-6 border-t border-gray-100 px-3 transition-all duration-300`}
          >
            <div className={`flex items-center rounded-xl hover:bg-gray-50 transition-colors duration-300 cursor-pointer group py-2.5 ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}>
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
                    className="flex-1 min-w-0"
                  >
                    <Link to={'/me'}>
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {loggedInAccount.name}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-[#9f3562] transition-colors whitespace-nowrap">View Profile</p>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.aside>

      {/*  MOBILE SIDEBAR (UNCHANGED) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 h-screen w-[85vw] min-w-[70vw] sm:w-[85vw] md:w-[450px]
             bg-white/98 backdrop-blur-2xl border-r border-gray-100 shadow-2xl z-50
             flex flex-col py-8 px-5"
          >

            <div className="flex items-center gap-3 px-3 mb-10 mt-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#ddd8da] to-[#fff1f7] flex items-center justify-center shadow-lg shadow-[#9f3562]/30">
                <img src={logo} alt="logo" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">Admeasy</h2>
                <p className="text-xs text-gray-500">Your Education Hub</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                // Special handling for Profile item to prevent false matches
                let isActive;
                if (item.matchPaths) {
                  // For Profile item, only match exact paths
                  isActive = item.matchPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
                } else {
                  isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={() => `
                      w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                      ${isActive ? 'text-white shadow-md shadow-[#9f3562]/25' : 'text-gray-700 hover:bg-gray-50 hover:text-[#9f3562]'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveBg"
                        className="absolute inset-0 bg-gradient-to-r from-[#9f3562] to-[#b14270]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium text-sm relative z-10">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeftSidebar;