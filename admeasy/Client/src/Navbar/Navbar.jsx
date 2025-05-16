import React from 'react'
import './Navbar.css'
import logo from '../assets/Others/LOGO.webp'
import { NavLink } from 'react-router-dom'
const Navbar = () => {
  return (
    <div className='w-full flex items-center justify-between px-5 py-2' id='nav'>
<div className="logo">
<img draggable='false' className='w-50' src={logo} alt="logo"/>
</div>
<div className=" block md:hidden nav-bars text-3xl">
<i className="fa-solid fa-bars"></i>
</div>
<div className="nav-links hidden md:flex gap-10">
<NavLink className={'links hover:text-orange-400 transition-colors duration-200'} to='/'>Home</NavLink>
<NavLink className={'links hover:text-orange-400 transition-colors duration-200'} to='/about'>About Us</NavLink>
<NavLink className={'links hover:text-orange-400 transition-colors duration-200'} to='/contact'>Contact Us</NavLink>
<NavLink className={'links hover:text-orange-400 transition-colors duration-200'} to='/colleges'>Colleges</NavLink>
</div>
    </div>
  )
}

export default Navbar