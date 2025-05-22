import React from 'react'
import '../App.css'
import logo from '../assets/Admeasy/LOGO.webp'
import { NavLink } from 'react-router-dom'
const Navbar = () => {
  return (
    <nav className='w-full flex items-center justify-between px-5 py-2 bg-[#f5cac3] sticky top-0 z-1000 shadow-[0_7px_10px_#00000079] rounded-b-2xl' id='nav'>
      <div className="logo">
        <img draggable='false' className='w-50' src={logo} alt="logo" />
      </div>
      <div className=" block md:hidden nav-bars text-3xl">
        <i className="fa-solid fa-bars"></i>
      </div>
      <div className="nav-links text-xl tracking-wider hidden md:flex gap-10 font-semibold">
        <NavLink className={'links hover:text-orange-400 px-2 transition-colors duration-500'} to='/'>Home</NavLink>
        <NavLink className={'links hover:text-orange-400 px-2 transition-colors duration-500'} to='/about'>About Us</NavLink>
        <NavLink className={'links hover:text-orange-400 px-2 transition-colors duration-500'} to='/contact'>Contact Us</NavLink>
        <NavLink className={'links hover:text-orange-400 px-2 transition-colors duration-500'} to='/colleges'>Find Colleges</NavLink>
      </div>
    </nav>
  )
}

export default Navbar