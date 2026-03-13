import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import AnimatedSearchPlaceholder from "./AnimatedSearchPlaceholder";
import logo from "../assets/Admeasy/favicon.ico";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import LoginButton from "./LoginButton";
import { useState, useEffect, useRef } from "react";

const fallbackProfilePic =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const location = useLocation();

  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);

  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    setImageError(false);
  }, [user, mentor]);

  // Scroll hide/show logic (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const isMobile = window.innerWidth < 768;

          if (isMobile) {
            if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
              // Scrolling down
              setIsVisible(false);
            } else {
              // Scrolling up
              setIsVisible(true);
            }
          } else {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const profileImage =
    imageError
      ? fallbackProfilePic
      : (isUserAccount
        ? user?.imageUrl || user?.image
        : mentor?.imageUrl || mentor?.image) || fallbackProfilePic;

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-16 bg-white z-[1000] border-b border-gray-200 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="h-full px-4 flex items-center justify-between gap-3">

        {/* ===== LEFT: LOGO ===== */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
        </Link>

        {/* ===== CENTER: SEARCH / EXPLORE BUTTON ===== */}
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors text-sm flex-1 mx-3 min-w-0"
        >
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <AnimatedSearchPlaceholder className="text-xs" />
        </button>

        {/* ===== RIGHT: BELL ===== */}
        <button
          onClick={() => loggedInAccount ? navigate("/notifications") : navigate("/login")}
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
        >
          <Bell className="w-5 h-5" />
        </button>

      </div>
    </nav>
  );
};

export default Navbar;