import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/Admeasy/LOGO.webp';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
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
    <nav className="w-full flex items-center justify-between px-5 py-3 2xl:py-4 bg-bgh sticky top-0 z-[1000] shadow-[0_8px_16px_#d1d9e6] rounded-b-2xl">
      {/* Logo */}
      <div className="flex-shrink-0 w-max">
        <img draggable="false" className="w-25 [@media(min-width:320px)]:w-30 [@media(min-width:420px)]:w-40 2xl:w-48" src={logo} alt="logo" />
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-8 font-admeasy text-lg 2xl:text-2xl font-semibold tracking-wide">
        {navLinks}
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
            className="absolute top-0 left-0 w-full bg-bg shadow-lg rounded-b-xl z-50 flex flex-col items-center text-center font-admeasy font-semibold text-base tracking-wide"
          >
            {navLinks}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
