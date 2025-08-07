import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/Admeasy/LOGO.webp';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { useUser } from '../context/UserContext';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [blockNavigation, setBlockNavigation] = useState(true);

  useEffect(() => {
    const handleBlockNavChange = () => {
      setBlockNavigation(localStorage.getItem('blockNavigation') === 'true');
    };
    window.addEventListener('storage', handleBlockNavChange);
    window.addEventListener('blockNavigationChange', handleBlockNavChange);
    // Initial check
    handleBlockNavChange();
    return () => {
      window.removeEventListener('storage', handleBlockNavChange);
      window.removeEventListener('blockNavigationChange', handleBlockNavChange);
    };
  }, []);

  const shouldHide = blockNavigation && user;

  const navLinks = (
    <>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-2 transition-colors duration-300 block md:inline"
        to="/"
        onClick={() => setIsOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-2 transition-colors duration-300 block md:inline"
        to="/colleges"
        onClick={() => setIsOpen(false)}
      >
        Find Colleges
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-2 transition-colors duration-300 block md:inline"
        to="/mentors"
        onClick={() => setIsOpen(false)}
      >
        Talk to Mentors
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-2 transition-colors duration-300 block md:inline"
        to="/about"
        onClick={() => setIsOpen(false)}
      >
        About Us
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-2 transition-colors duration-300 block md:inline"
        to="/contact"
        onClick={() => setIsOpen(false)}
      >
        Contact Us
      </NavLink>
    </>
  );

  const handleImageError = () => {
    setImageError(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <nav className="w-full mb-5 flex items-center justify-between px-2.5 md:px-5 py-3 2xl:py-4 bg-bg sticky top-0 z-[1000] shadow-[0_8px_16px_#d1d9e6] rounded-b-2xl">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link to="/">
          <img
            draggable="false"
            className="w-36 2xl:w-48"
            src={logo}
            alt="Admeasy Logo"
          />
        </Link>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-8 font-admeasy text-lg 2xl:text-2xl font-semibold tracking-wide items-center">
        {!shouldHide && navLinks}
        {user ? (
          <Link to="/me" className="flex items-center">
            <img
              src={imageError ? fallbackProfilePic : (user.imageUrl || user.image || fallbackProfilePic)}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover hover:border-2 border-link hover:shadow-lg transition-all duration-200"
              onError={handleImageError}
            />
          </Link>
        ) : (
          <Link
            to='/login'
            className="flex items-center justify-center text-xl py-2 px-3 text-white transform hover:scale-105 hover:text-black hover:shadow-xl shadow-lg bg-link rounded-xl transition-transform duration-200"
          >
            Log In / Sign Up
          </Link>
        )}
      </div>

      <div className="md:hidden flex items-center max-[323px]:gap-1 gap-2">
        {user ? (
          <Link
            to="/me"
            className="md:hidden flex items-center justify-center gap-2 py-2 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={imageError ? fallbackProfilePic : (user.imageUrl || user.image || fallbackProfilePic)}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover"
              onError={handleImageError}
            />
          </Link>
        ) : !shouldHide && (
          <Link
            to='/login'
            className="md:hidden flex items-center justify-center text-lg text-center py-0.75 px-2.5 text-white bg-link rounded-xl cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            Log In
          </Link>
        )}

        {/* Mobile Hamburger */}
        <div
          className="md:hidden p-0 m-0 text-3xl cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {!shouldHide && isOpen ? <FiX /> : <FiMenu />}
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {!shouldHide && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[100%] left-0 w-full bg-primary shadow-lg rounded-b-xl z-50 flex flex-col items-center space-y-2 text-center font-admeasy font-semibold text-base tracking-wide py-4"
          >
            {navLinks}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
