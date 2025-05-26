import React from 'react'
import '../App.css'
import logo from '../assets/Admeasy/LOGO.webp'
import { NavLink } from 'react-router-dom'


const Navbar = () => {
  // Function to handle the click event on the bars icon
  const handleBarsClick = () => {
    const navLinks = document.querySelector('.nav-links');
    const barsIcon = document.getElementById('bars');

    // Toggle the visibility of the nav links
    if (navLinks.classList.contains('hidden')) {
      navLinks.classList.remove('hidden');
      barsIcon.classList.add('fa-xmark');
      barsIcon.classList.remove('fa-bars');
    } else {
      navLinks.classList.add('hidden');
      barsIcon.classList.add('fa-bars');
      barsIcon.classList.remove('fa-xmark');
    }
  }

  return (
    <nav className='w-full flex items-center justify-between px-5 py-2 bg-[#F2F4F8] sticky top-0 z-1000 shadow-[0_8px_16px_#d1d9e6] rounded-b-2xl' id='nav'>
      <div className="logo">
        <img draggable='false' className='w-50' src={logo} alt="logo" />
      </div>
      <div className="flex items-center justify-center">
        <div className="nav-links text-xl lg:tracking-wider font-admeasy hidden md:flex gap-5 lg:gap-10 font-semibold">
          <NavLink className={'links hover:text-[#0057A0] px-2 transition-colors duration-500'} to='/'>Home</NavLink>
          <NavLink className={'links hover:text-[#0057A0] px-2 transition-colors duration-500'} to='/about'>About Us</NavLink>
          <NavLink className={'links hover:text-[#0057A0] px-2 transition-colors duration-500'} to='/contact'>Contact Us</NavLink>
          <NavLink className={'links hover:text-[#0057A0] px-2 transition-colors duration-500'} to='/colleges'>Find Colleges</NavLink>
        </div>
        <div className=" block md:hidden nav-bars text-3xl">
          <i id='bars' onClick={handleBarsClick} className="fa-solid fa-bars transition-all duration-500"></i>
        </div>
      </div>
    </nav>
  )
}

export default Navbar