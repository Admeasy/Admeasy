import { useState } from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import Home from './Pages/Home'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Colleges from './Pages/Colleges'
function App() {

  return (
    <>
    
    {/* Call Navbar here */}
  
<Navbar/>
<Routes>
  
<Route path='/' element={<Home/>}></Route> 
<Route path='/contact' element={<Contact/>}></Route> 
<Route path='/about' element={<About/>} ></Route>
<Route path='/colleges' element={<Colleges/>}></Route>

  </Routes>        
    </>
  )
}

export default App
