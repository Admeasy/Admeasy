import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Newspaper,
  UserPlus,
  MessagesSquare,
  ChevronLeft,
  Compass,
  CirclePlus,
  Users,
  Repeat,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import { useUnreadSpaceMessages } from "../hooks/useUnreadSpaceMessages";
const logo = '/favicon.ico';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

export const SIDEBAR_EXPANDED_WIDTH = 288;
export const SIDEBAR_COLLAPSED_WIDTH = 88;

const LeftSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const {
    user,
    setUser,
    savedAccounts,
    removeSavedAccount,
    logoutCurrentAccount,
    logoutAllAccounts,
    fetchUser,
  } = useUser();
  const { mentor, setMentor } = useMentor();
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  const navigate = useNavigate();

  const [showAccountsPopup, setShowAccountsPopup] = useState(false);
  const popupRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSpaceFeedPage = /^\/spaces\/[^/]+$/.test(location.pathname);
  const hideSidebarPages = [
    "/login",
    "/mentors/login",
    "/mentors/register",
    "/onboarding",
    "/forgot-password",
    "/reset-password",
  ];
  const shouldHide =
    isAdminRoute ||
    isSpaceFeedPage ||
    hideSidebarPages.some((path) => location.pathname.startsWith(path));

  const { unreadCount: unreadMessagesCount } = useUnreadMessages();
  const { unreadCount: unreadSpaceMessagesCount } = useUnreadSpaceMessages();

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowAccountsPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (shouldHide) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/", exact: true },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: CirclePlus, label: "Create", path: "/posts/create" },
    ...(loggedInAccount
      ? [{ icon: Users, label: "Spaces", path: "/spaces" }]
      : []),
    ...(loggedInAccount
      ? isUserAccount
        ? [{ icon: MessagesSquare, label: "Chats", path: "/chats" }]
        : [{ icon: MessagesSquare, label: "Chats", path: "/mentor/chats" }]
      : []),
    { icon: Newspaper, label: "Blogs", path: "/blogs" },
    ...(!loggedInAccount
      ? [{ icon: UserPlus, label: "Sign Up/Log In", path: "/login" }]
      : []),
  ];

  const sidebarTransition = { duration: 0.3, ease: "easeInOut" };
  const textVariants = {
    hidden: { opacity: 0, width: 0, transition: { duration: 0.2 } },
    visible: {
      opacity: 1,
      width: "auto",
      transition: { duration: 0.3, delay: 0.1 },
    },
  };

  const handleAccountSwitch = async (account) => {
    if (account.id === user?._id) {
      setShowAccountsPopup(false);
      return;
    }

    try {
      const toastId = toast.loading("Switching account...");
      const res = await fetch("/api/users/switch-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ switchToken: account.token }),
        credentials: "include", // CRITICAL FIX: Allows new cookies to be saved in the browser!
      });

      const data = await res.json();

      if (res.ok) {
        await fetchUser(); // reload the user info into context with the new cookies
        setShowAccountsPopup(false);
        toast.update(toastId, {
          render: `Switched to ${account.name}`,
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        navigate("/");
      } else {
        toast.update(toastId, {
          render: data.message || "Session expired. Please log in again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        removeSavedAccount(account.id); // Remove from list if switch token expired
        navigate("/login");
      }
    } catch (err) {
      toast.error("Failed to switch account");
    }
  };

  return (
    <>
      <motion.aside
        initial="expanded"
        animate={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        }}
        variants={{
          expanded: { width: "18rem" },
          collapsed: { width: "5.5rem" },
        }}
        transition={sidebarTransition}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-xl z-40 flex-col py-8 overflow-y-visible"
      >
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

        <div
          className={`flex items-center gap-3 mt-0 mb-8 px-5 ${isCollapsed ? "justify-center" : ""} h-12`}
        >
          <motion.div
            onClick={() => navigate("/")}
            layout
            className="w-11 h-11 min-w-[2.75rem] rounded-xl bg-gradient-to-br from-[#ffffff] via-[#fff7fa] to-[#e9dce1] flex items-center justify-center shadow-md shadow-[#9f3562]/30 cursor-pointer"
          >
            <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                onClick={() => navigate("/")}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="overflow-hidden whitespace-nowrap cursor-pointer"
              >
                <h2 className="font-bold text-xl text-gray-900 tracking-tight">
                  Admeasy
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Your Education Hub
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2 w-full px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `relative flex items-center py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isCollapsed ? "justify-center px-0" : "px-4 gap-3.5"} ${isActive ? "text-white shadow-md shadow-[#9f3562]/30" : "text-gray-700 hover:bg-gray-50 hover:text-[#9f3562]"}`
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
                  {item.label === "Chats" && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                      {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
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
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile and Switch Account Trigger */}
        {loggedInAccount && (
          <div className="relative mt-auto pt-6 border-t border-gray-100 px-3 mb-4" ref={popupRef}>

            {/* Accounts Switcher Popup */}
            <AnimatePresence>
              {showAccountsPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute bottom-full left-3 mb-2 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 overflow-hidden ${isCollapsed ? 'w-48' : 'w-[calc(100%-24px)]'}`}
                >
                  <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Switch Account</p>

                  <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                    {savedAccounts?.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => handleAccountSwitch(acc)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${user?._id === acc.id ? 'bg-[#9f3562]/5' : ''}`}
                      >
                        <img src={acc.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt={acc.name} className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="text-sm font-semibold text-gray-900 truncate">{acc.name}</span>
                          <span className="text-xs text-gray-500 truncate">{acc.email}</span>
                        </div>
                        {user?._id === acc.id && <div className="ml-auto w-2 h-2 rounded-full bg-[#9f3562]"></div>}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 mt-1">
                    <button onClick={() => { setShowAccountsPopup(false); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#9f3562] transition-colors">
                      <PlusCircle className="w-4 h-4" /> Add an existing account
                    </button>
                    {savedAccounts.length > 1 && (
                      <button onClick={() => { setShowAccountsPopup(false); logoutCurrentAccount(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Log out this account
                      </button>
                    )}
                    <button onClick={() => { setShowAccountsPopup(false); logoutAllAccounts(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Log out all accounts
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`flex flex-col rounded-xl hover:bg-gray-50 transition-colors duration-300 group py-2.5 ${isCollapsed ? 'items-center px-0' : 'px-3'}`}>

              {/* Top Row: Avatar + Name */}
              <div onClick={() => navigate('/me')} className={`flex items-center w-full cursor-pointer z-10 ${isCollapsed ? 'justify-center' : 'gap-3 mb-3'}`}>
                <div className="relative flex-shrink-0">
                  <img src={loggedInAccount.imageUrl || loggedInAccount.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt={loggedInAccount.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#9f3562]/30 group-hover:ring-[#9f3562]/60 transition-all" />
                </div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div variants={textVariants} initial="hidden" animate="visible" exit="hidden" className="flex flex-1 flex-col min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate w-full" title={loggedInAccount.name}>{loggedInAccount.name}</p>
                      <p className="text-xs text-gray-500 group-hover:text-[#9f3562] transition-colors whitespace-nowrap">View Profile</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Row: Switch Account Button */}
              <AnimatePresence>
                {!isCollapsed ? (
                  <motion.button
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={(e) => { e.stopPropagation(); setShowAccountsPopup(!showAccountsPopup); }}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-[#9f3562] rounded-lg text-[#9f3562] hover:bg-[#9f3562] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md whitespace-nowrap text-center z-10"
                    title="Switch Account"
                  >
                    Switch Account
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); setShowAccountsPopup(!showAccountsPopup); }}
                    className="mt-2 p-2 rounded-full text-gray-400 hover:text-[#9f3562] hover:bg-[#9f3562]/10 transition-colors"
                    title="Switch Account"
                  >
                    <Repeat className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
};

export default LeftSidebar;