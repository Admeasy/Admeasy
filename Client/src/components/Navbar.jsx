import React from 'react'
import './Navbar.css'
import logo from '../assets/Others/LOGO.webp'
import { NavLink } from 'react-router-dom'
const Navbar = () => {
  return (
    <div className='w-full flex items-center justify-between px-5 py-2 bg-white sticky top-0 z-1000 shadow-[#00000079] shadow-xl' id='nav'>
      <div className="logo">
        <img draggable='false' className='w-50' src={logo} alt="logo" />
      </div>
      <div className=" block md:hidden nav-bars text-3xl">
        <i className="fa-solid fa-bars"></i>
      </div>
      <div className="nav-links hidden md:flex gap-10 font-semibold">
        <NavLink className={'links hover:text-orange-400 transition-colors duration-500'} to='/'>Home</NavLink>
        <NavLink className={'links hover:text-orange-400 transition-colors duration-500'} to='/about'>About Us</NavLink>
        <NavLink className={'links hover:text-orange-400 transition-colors duration-500'} to='/contact'>Contact Us</NavLink>
        <NavLink className={'links hover:text-orange-400 transition-colors duration-500'} to='/colleges'>Colleges</NavLink>
      </div>
    </div>
  )
}

export default Navbar