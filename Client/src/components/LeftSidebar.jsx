import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, GraduationCap, Users, Newspaper, Info, Mail, UserPlus, MessageSquare, User, Menu, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import { motion, AnimatePresence } from 'framer-motion';

const LeftSidebar = () => {
  const location = useLocation();
  const { user } = useUser();
  const { mentor } = useMentor();
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide sidebar on admin routes and auth pages
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideSidebarPages = ['/login', '/mentors/login', '/mentors/register', '/onboarding', '/forgot-password', '/reset-password'];
  const shouldHide = isAdminRoute || hideSidebarPages.some(path => location.pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/', exact: true },
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
      ? { icon: User, label: 'Profile', path: isUserAccount ? '/me/edit' : '/me' }
      : { icon: UserPlus, label: 'Sign Up', path: '/login' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Top Right */}
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

      {/* Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ================= DESKTOP SIDEBAR (EXPANDED) ================= */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-xl z-40 flex-col py-8 px-5"
      >
        {/* Header (Logo + Text) */}
        <div className="flex items-center gap-3 px-3 mb-10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9f3562] via-[#b14270] to-[#701a3c] flex items-center justify-center shadow-md shadow-[#9f3562]/30 cursor-pointer"
          >
            <span className="text-white font-bold text-xl">A</span>
          </motion.div>
          <div>
            <h2 className="font-bold text-xl text-gray-900 tracking-tight">Admeasy</h2>
            <p className="text-xs text-gray-500 font-medium">Your Education Hub</p>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="flex-1 space-y-1.5 w-full">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.path}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl
                    transition-all duration-300 group relative overflow-hidden
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-md shadow-[#9f3562]/25'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#9f3562]'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveBg"
                      className="absolute inset-0 bg-gradient-to-r from-[#9f3562] to-[#b14270]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <motion.div
                    className="relative z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  
                  <span className="font-medium text-sm relative z-10">{item.label}</span>
                  
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white relative z-10"
                    />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Desktop User Profile */}
        {loggedInAccount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-auto pt-6 border-t border-gray-100"
          >
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer group">
              <div className="relative">
                <img
                  src={loggedInAccount.image || loggedInAccount.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt={loggedInAccount.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#9f3562]/30 group-hover:ring-[#9f3562]/60 transition-all"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {loggedInAccount.name}
                </p>
                <p className="text-xs text-gray-500 group-hover:text-[#9f3562] transition-colors">View Profile</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.aside>

      {/* ================= MOBILE SIDEBAR (FORCED WIDE) ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed right-0 top-0 h-screen w-[85vw] min-w-[70vw] sm:w-[85vw] md:w-[450px] bg-white/98 backdrop-blur-2xl border-l border-gray-100 shadow-2xl z-50 flex flex-col py-8 px-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-3 mb-10 mt-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9f3562] via-[#b14270] to-[#701a3c] flex items-center justify-center shadow-lg shadow-[#9f3562]/30"
              >
                <span className="text-white font-bold text-xl">A</span>
              </motion.div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">Admeasy</h2>
                <p className="text-xs text-gray-500">Your Education Hub</p>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`
                        w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl
                        transition-all duration-300 group relative overflow-hidden
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-md shadow-[#9f3562]/25'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-[#9f3562]'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileActiveBg"
                          className="absolute inset-0 bg-gradient-to-r from-[#9f3562] to-[#b14270]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <motion.div
                        className="relative z-10"
                        animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <span className="font-medium text-sm relative z-10">{item.label}</span>
                      
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-2 h-2 rounded-full bg-white relative z-10"
                        />
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </nav>

            {/* User Profile */}
            {loggedInAccount && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-auto pt-6 border-t border-gray-100"
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer group">
                  <div className="relative">
                    <img
                      src={loggedInAccount.image || loggedInAccount.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt={loggedInAccount.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#9f3562]/30 group-hover:ring-[#9f3562]/60 transition-all"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {loggedInAccount.name}
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-[#9f3562] transition-colors">View Profile</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeftSidebar;