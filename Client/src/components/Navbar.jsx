import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/Admeasy/LOGO.webp';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import LoginButton from './LoginButton';
const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = () => {
  const { user } = useUser();
  const { mentor } = useMentor();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [blockNavigation, setBlockNavigation] = useState(true);
  const loggedInAccount = user || mentor;
  const isUserAccount = Boolean(user);

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

  useEffect(() => {
    setImageError(false);
  }, [user, mentor]);

  const shouldHide = blockNavigation && user;

  const navLinks = (
    <>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/"
        onClick={() => setIsOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/colleges"
        onClick={() => setIsOpen(false)}
      >
        Colleges
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/mentors"
        onClick={() => setIsOpen(false)}
      >
        Mentors
      </NavLink>
      {loggedInAccount && (
        <NavLink
          className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
          to="/mentor-posts"
          onClick={() => setIsOpen(false)}
        >
          Mentor Posts
        </NavLink>
      )}
      {/* Chat link only for users, Messages link only for mentors */}
      {isUserAccount && (
        <NavLink
          className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
          to="/chats"
          onClick={() => setIsOpen(false)}
        >
          Chat
        </NavLink>
      )}
      {!isUserAccount && mentor && (
        <NavLink
          className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
          to="/mentor/chats"
          onClick={() => setIsOpen(false)}
        >
          Messages
        </NavLink>
      )}
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/blog"
        onClick={() => setIsOpen(false)}
      >
        Blogs
      </NavLink>
               <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/about"
        onClick={() => setIsOpen(false)}
      >
        About
      </NavLink>
      <NavLink
        className="hover:text-link lg:px-0.5 xl:px-2 py-0.25 sm:py-0.5 transition-colors duration-300 block md:inline"
        to="/contact"
        onClick={() => setIsOpen(false)}
      >
        Contact
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
    <nav className="w-full flex items-center justify-between px-2.5 lg:px-5 py-3 2xl:py-4 bg-bg sticky top-0 z-[1000] shadow-[0_8px_16px_#d1d9e6] rounded-b-2xl">
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
      <div className="hidden min-[890px]:flex gap-2 lg:gap-4 ml-auto font-admeasy text-lg 2xl:text-2xl font-semibold tracking-wide items-center">
        {!shouldHide && navLinks}
        {loggedInAccount ? (
          <Link to={isUserAccount ? '/me/edit' : '/me'} className="flex items-center ml-6">
            <img
              src={
                imageError
                  ? fallbackProfilePic
                  : (
                    (isUserAccount
                      ? (user.imageUrl || user.image)
                      : (mentor?.imageUrl || mentor?.image)) || fallbackProfilePic
                  )
              }
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover hover:border-2 border-link hover:shadow-lg transition-all duration-200"
              onError={handleImageError} />
          </Link>
        ) : (
          // Login Signup Page 
          <Link to='/login' className="ml-6">
            <LoginButton />
          </Link>
        )}
      </div>

      <div className="max-[889px]:flex hidden items-center max-[323px]:gap-1 gap-2">
        {loggedInAccount ? (
          <Link
            to={isUserAccount ? '/me/edit' : '/me'}
            className="max-[899px]:flex hidden items-center justify-center gap-2 py-2 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={
                imageError
                  ? fallbackProfilePic
                  : (
                    (isUserAccount
                      ? (user.imageUrl || user.image)
                      : (mentor?.imageUrl || mentor?.image)) || fallbackProfilePic
                  )
              }
              alt="Profile"
              className="aspect-square w-9 h-9 rounded-full object-contain"
              onError={handleImageError}
            />
          </Link>
        ) : !shouldHide && (
          // Login Signup Page 
          <Link to='/login' onClick={() => setIsOpen(false)}>
            <LoginButton />
          </Link>
        )}

        {/* Mobile Hamburger */}
        <div
          className="max-[899px]:block hidden p-0 m-0 text-3xl cursor-pointer"
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