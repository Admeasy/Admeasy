import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import LeftSidebar from "./LeftSidebar";

const DESKTOP_BREAKPOINT = 1024;

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop
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

  const sidebarWidth = isDesktop
    ? isCollapsed
      ? 88
      : 288
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <LeftSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main
        className="pt-[64px] transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
