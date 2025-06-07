import './App.css'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import Home from './Pages/Home'
import Footer from './Footer/Footer'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import CollegeCourse from './Pages/CollegeCourse'
function App() {
  let location = useLocation()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/about' element={<About />} ></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/DetailedCollege' element={<CollegeDetailed/>}></Route>
        <Route path='/Policies' element={<PrivacyPolicy key={location.key}/>}></Route>
        <Route path='/Terms' element={<TermsAndConditions/>}></Route>
         <Route path='/Course' element={<CollegeCourse/>}></Route>
      </Routes>
{/* Remove the commment when it's responsive and working fine */}
      <Footer/>
    </>
  )
}

export default App
