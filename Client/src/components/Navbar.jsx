import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { Search, X } from "lucide-react";
import logo from "../assets/Admeasy/newLogo.png";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import LoginButton from "./LoginButton";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const fallbackProfilePic =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const location = useLocation();
  
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);
  
  const [searchActive, setSearchActive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setImageError(false);
  }, [user, mentor]);

  const profileImage =
    imageError
      ? fallbackProfilePic
      : (isUserAccount
          ? user?.imageUrl || user?.image
          : mentor?.imageUrl || mentor?.image) || fallbackProfilePic;

  const hideNavbarMenu = [
    '/login',
    '/mentors/login',
    '/mentors/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password'
  ];
  
  const shouldHideMenu = hideNavbarMenu.some(path =>
    location.pathname.startsWith(path)
  );

  // Single unified search handler
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchActive(false);
      setQuery("");
    }
  };

  // Handle Enter key in desktop search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  // Close mobile search
  const handleSearchClose = () => {
    setSearchActive(false);
    setQuery("");
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-white z-[1000] border-b border-gray-200">
      <div className="h-full px-4 flex items-center">
        
        {/* ================= MOBILE HAMBURGER ================= */}
        {!shouldHideMenu && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden mr-3 text-2xl text-gray-700"
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        )}

        {/* ================= LOGO ================= */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logo}
            alt="Admeasy"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="hidden sm:block lg:block font-bold text-lg text-gray-900">
            Admeasy
          </span>
        </Link>

        {/* ================= DESKTOP SEARCH (CENTER) ================= */}
        <div className="hidden lg:flex flex-1 justify-center px-6">
          <div className="relative w-full max-w-[520px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search colleges, mentors, notes..."
              className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* ================= DESKTOP NAVIGATION LINKS ================= */}
        <div className="hidden lg:flex items-center gap-6 ml-auto text-sm font-medium text-gray-700">
          <NavLink 
            to="/feed" 
            className={({ isActive }) => 
              `navbarHover font-admeasy-bold text-lg transition-colors ${isActive ? 'text-[#9f3562]' : ''}`
            }
          >
            Feed
          </NavLink>
          <NavLink 
            to="/colleges" 
            className={({ isActive }) => 
              `navbarHover font-admeasy-bold text-lg transition-colors ${isActive ? 'text-[#9f3562]' : ''}`
            }
          >
            Colleges
          </NavLink>
          <NavLink 
            to="/notes" 
            className={({ isActive }) => 
              `navbarHover font-admeasy-bold text-lg transition-colors ${isActive ? 'text-[#9f3562]' : ''}`
            }
          >
            Notes
          </NavLink>

          {/* Desktop Auth */}
          {loggedInAccount ? (
            <Link to={"/me"}>
              <img
                src={profileImage}
                onError={() => setImageError(true)}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border border-gray-200 hover:border-[#9f3562] transition-colors"
              />
            </Link>
          ) : (
            <Link to="/login">
              <LoginButton />
            </Link>
          )}
        </div>

        {/* ================= MOBILE RIGHT SECTION ================= */}
        <div className="lg:hidden flex items-center gap-3 ml-auto relative">
          
          {/* Default State - Search Icon & Profile */}
          <div
            className={`flex items-center gap-3 transition-all duration-300 ${
              searchActive ? "opacity-0 pointer-events-none absolute" : "opacity-100"
            }`}
          >
            <button
              onClick={() => setSearchActive(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Open search"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
            
            {loggedInAccount ? (
              <Link to={isUserAccount ? "/me/edit" : "/me"}>
                <img
                  src={profileImage}
                  onError={() => setImageError(true)}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                />
              </Link>
            ) : (
              <Link to="/login">
                <LoginButton />
              </Link>
            )}
          </div>

          {/* Search Active State */}
          <div
            className={`fixed left-0 right-0 top-0 h-16 bg-white flex items-center px-4 transition-all duration-300 border-b border-gray-200 ${
              searchActive
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex-1 flex items-center gap-3 max-w-7xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for courses, quizzes, or documents"
                  className="w-full h-11 pl-11 pr-4 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9f3562] focus:bg-white transition-all"
                  autoFocus={searchActive}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;