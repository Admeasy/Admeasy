import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";
import BottomNavBar from "./BottomNavBar";

const DESKTOP_BREAKPOINT = 768; // Changed from 1024 to 768

const Layout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    window.innerWidth >= DESKTOP_BREAKPOINT
  );

  /* RESPONSIVE SYNC EFFECT */
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      setIsDesktop(desktop);

      // If switching to mobile → force sidebar collapsed & close menu
      if (!desktop) {
        setIsCollapsed(true);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSpaceFeedPage = /^\/spaces\/[^/]+$/.test(location.pathname);

  const sidebarWidth = isSpaceFeedPage
    ? 0
    : isDesktop
      ? isCollapsed
        ? 88
        : 288
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <BottomNavBar />

      <main
        className="pb-20 md:pb-0 transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;