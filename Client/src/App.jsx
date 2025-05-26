import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import Home from './Pages/Home'
import Footer from './Footer/Footer'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/about' element={<About />} ></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/DetailedCollege' element={<CollegeDetailed/>}></Route>
      </Routes>
{/*Remove the commment when it's responsive and working fine */}
      {/* <Footer/> */}
    </>
  )
}

export default App
