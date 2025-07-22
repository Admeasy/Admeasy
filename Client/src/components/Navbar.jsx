import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/Admeasy/LOGO.webp';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
// import Pic from '../assets/UGs/FaizahNaqvi.webp'

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Navbar = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = (
    <>
      <NavLink
        className="hover:text-link px-2 py-2 transition-colors duration-300 block md:inline"
        to="/"
        onClick={() => setIsOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        className="hover:text-link px-2 py-2 transition-colors duration-300 block md:inline"
        to="/colleges"
        onClick={() => setIsOpen(false)}
      >
        Find Colleges
      </NavLink>
      <NavLink
        className="hover:text-link px-2 py-2 transition-colors duration-300 block md:inline"
        to="/mentors"
        onClick={() => setIsOpen(false)}
      >
        Talk to Mentors
      </NavLink>
      <NavLink
        className="hover:text-link px-2 py-2 transition-colors duration-300 block md:inline"
        to="/about"
        onClick={() => setIsOpen(false)}
      >
        About Us
      </NavLink>
      <NavLink
        className="hover:text-link px-2 py-2 transition-colors duration-300 block md:inline"
        to="/contact"
        onClick={() => setIsOpen(false)}
      >
        Contact Us
      </NavLink>
    </>
  );

  return (
    <nav className="w-full mb-5 flex items-center justify-between px-5 py-3 2xl:py-4 bg-bg sticky top-0 z-[1000] shadow-[0_8px_16px_#d1d9e6] rounded-b-2xl">
      {/* Logo */}
      <div className="flex-shrink-0">
        <img draggable="false" className="w-36 2xl:w-48" src={logo} alt="logo" />
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-8 font-admeasy text-lg 2xl:text-2xl font-semibold tracking-wide">
        {navLinks}
        {/* <img src={Pic} className='size-15 rounded-full hover:border-2' /> */}
        {user ? (
          <Link to="/me" className="flex items-center">
            <img
              src={user.imageUrl || fallbackProfilePic}
              alt="Profile"
              className="size-12 rounded-full object-cover border-2 border-link hover:shadow-lg transition-all duration-200"
              style={{ width: 48, height: 48 }}
            />
          </Link>
        ) : (
          <Link to='/login' className="w-45 flex items-center justify-center text-xl py-2 px-3 text-white transform hover:scale-103 hover:text-black hover:shadow-xl shadow-lg bg-link rounded-xl transition-transform duration-200">
            Log In / Sign Up
          </Link>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden text-3xl cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX /> : <FiMenu />}
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-[100%] left-0 w-full bg-primary shadow-lg rounded-b-xl z-50 flex flex-col items-center text-center font-admeasy font-semibold text-base tracking-wide"
          >
            {navLinks}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
