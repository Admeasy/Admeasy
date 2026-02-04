import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import logo from "../assets/Admeasy/favicon.ico";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import LoginButton from "./LoginButton";
import { useState, useEffect } from "react";

const fallbackProfilePic =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
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

        {/* ================= LOGO ================= */}
        {/* Removed Hamburger button here */}
        <Link to="/feed" className="flex items-center gap-2 shrink-0">
          <img
            src={logo}
            alt="Admeasy"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="hidden sm:block lg:block font-bold text-lg text-gray-900">
            Admeasy
          </span>
        </Link>

        {/* ================= DESKTOP NAVIGATION LINKS ================= */}
        <div className="hidden lg:flex items-center gap-6 ml-auto text-sm font-medium text-gray-700">
          {/* Desktop Auth */}
          {loggedInAccount ? (
            <Link to={"/me"} className="relative">
              <img
                src={profileImage}
                onError={() => setImageError(true)}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border border-gray-200 hover:border-[#9f3562] transition-colors"
              />
              {!loggedInAccount.username && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </Link>
          ) : (
            <Link to="/login">
              <LoginButton />
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;