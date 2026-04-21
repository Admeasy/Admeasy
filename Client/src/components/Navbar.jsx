import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Trophy, Coins } from "lucide-react";
import AnimatedSearchPlaceholder from "./AnimatedSearchPlaceholder";
const logo = "/favicon.ico";
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

  // ── Coin balance state ─────────────────────────────────
  const [coinBalance, setCoinBalance] = useState(null);

  useEffect(() => {
    setImageError(false);
  }, [user, mentor]);

  // Fetch coin balance when user logs in
  useEffect(() => {
    if (!user) {
      setCoinBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setCoinBalance(data.wallet.coinBalance);
      } catch (err) {
        console.error("Coin balance fetch error:", err);
      }
    };
    fetchBalance();
  }, [user]);

  // Scroll hide/show logic (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const isMobile = window.innerWidth < 768;

          if (isMobile) {
            if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
              setIsVisible(false);
            } else {
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

  const profileImage = imageError
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

        {/* ===== CENTER: SEARCH ===== */}
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors text-sm flex-1 mx-3 min-w-0"
        >
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <AnimatedSearchPlaceholder className="text-xs" />
        </button>

        {/* ===== RIGHT: COINS + LEADERBOARD + BELL ===== */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Coin balance — only for logged in users, not mentors */}
          {user && coinBalance !== null && (
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200"
              title={`${coinBalance} coins = ₹${(coinBalance / 10).toFixed(0)}`}
            >
              <Coins className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-700">
                {coinBalance}
              </span>
            </button>
          )}

          {/* ===== MENTOR ONLY: LEADERBOARD ===== */}
          {!isUserAccount && mentor && (
            <button
              onClick={() => navigate("/mentor/leaderboard")}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#9f3562]/10 transition-colors text-[#9f3562] shrink-0 group"
              title="Leaderboard"
            >
              <Trophy className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          )}

          {/* Bell */}
          <button
            onClick={() =>
              loggedInAccount ? navigate("/notifications") : navigate("/login")
            }
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Profile / Login */}
          <div className="flex items-center shrink-0">
            {!loggedInAccount && (
              <div className="ml-2">
                <LoginButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
