import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
const logo = '/favicon.ico';

const AdvertiserSidebar = ({ isCollapsed, setIsCollapsed, showMobileMenu, setShowMobileMenu }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/advertisers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        toast.success('Logged out successfully');
        window.location.href = '/advertiser/login';
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/advertiser/dashboard' },
    { icon: Plus, label: 'Create Ad', path: '/advertiser/create-ad' },
    { icon: FileText, label: 'My Ads', path: '/advertiser/myads' }
  ];

  const sidebarWidth = isCollapsed && !isHovered ? '88px' : '288px';

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 z-[999] xl:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-[calc(100vw-2rem)] max-w-[280px] sm:w-72 bg-white z-[1000] xl:hidden shadow-2xl"
            >
              <div className="p-3 sm:p-4 md:p-6 h-full flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <Link
                    to="/advertiser/dashboard"
                    className="flex items-center gap-2 sm:gap-3"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <img src={logo} alt="Admeasy" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
                    <span className="font-bold text-base sm:text-xl text-gray-900">Admeasy</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowMobileMenu(false)}
                    className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 xl:hidden"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5 sm:space-y-2 flex-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMobileMenu(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${isActive
                            ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="font-medium truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                  <NavLink
                    to="/advertiser/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${isActive
                        ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium truncate">Profile</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm sm:text-base"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium truncate">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        style={{ width: sidebarWidth }}
        className="hidden xl:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col transition-all duration-300 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <div className="p-6 border-b border-gray-200">
          <Link to="/advertiser/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Admeasy" className="w-10 h-10 flex-shrink-0" />
            <AnimatePresence>
              {(!isCollapsed || isHovered) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-xl text-gray-900 whitespace-nowrap overflow-hidden"
                >
                  Admeasy
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {(!isCollapsed || isHovered) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <NavLink
            to="/advertiser/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {(!isCollapsed || isHovered) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden">
                  Profile
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {(!isCollapsed || isHovered) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default AdvertiserSidebar;
