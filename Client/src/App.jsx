import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import Footer from './components/Footer'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import Course from './Pages/Course'


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/about' element={<About />} ></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/colleges/:id' element={<CollegeDetailed/>}></Route>
        <Route path='/Policies' element={<PrivacyPolicy/>}></Route>
        <Route path='/Terms' element={<TermsAndConditions/>}></Route>
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course/>}></Route>
      </Routes>
{/* Remove the commment when it's responsive and working fine */}
      <Footer/>
    </>
  )
}

export default App
