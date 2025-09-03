import './App.css'
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import ScrollUpButton from './components/ScrollUpButton';
import Footer from './components/Footer'
import LoginModal from './components/LoginModal';
import Contact from './Pages/Contact'
import About from './Pages/About'
import Mentors from './Pages/Mentors'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import Course from './Pages/Course'
import SignUp from './Pages/SignUp'
import LogIn from './Pages/LogIn'
import Profile from './Pages/EditProfile'
import Admin from './Pages/Admin'
import ManageColleges from './Pages/ManageColleges'
import ManageUsers from './Pages/ManageUsers'
import ManageApplications from './Pages/ManageApplications'
import JobApplications from './Pages/JobApplications'
import MentorshipForm from './Pages/MentorshipForm'
import Messages from './Pages/Messages'
import Enrollments from './Pages/Enrollments';
import { useEffect, useState } from 'react';
import { useUser } from './context/UserContext';
import TextPressure from "../ReactBits/TextPressure/TextPressure"
import { NotFound } from './Pages/NotFound';
import MgciBanner from './components/MgciBanner';
import Bannerimg from "./assets/Banner/NEET.webp"
import MGCIBrochure from "./assets/Banner/MGCIbrochure.pdf"
function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();
  const [showBanner,SetShowBanner] = useState(false)
  useEffect(() => {
    // Fetch user data on app mount
    fetchUser();
  }, []);
 useEffect(()=>{
 setTimeout(() => {
    SetShowBanner(true)
  }, 100)
 },[])

  
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/modal' element={<LoginModal />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/mentors' element={<Mentors />}></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/colleges/:id' element={<CollegeDetailed />}></Route>
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course />}></Route>
        <Route path='/policies' element={<PrivacyPolicy />}></Route>
        <Route path='/t&c' element={<TermsAndConditions />}></Route>
{/* We don't need Signup route */}
        {/* <Route path='/signup' element={<SignUp />}></Route> */}
        <Route path='/login' element={<LogIn />}></Route>
        <Route path='/me' element={<Profile />}></Route>
        <Route path='/admin' element={<Admin />}></Route>
        <Route path='/careers/mentorship/apply' element={<MentorshipForm />}></Route>
        <Route path='/admin/colleges' element={<ManageColleges />}></Route>
        <Route path='/admin/users' element={<ManageUsers />}></Route>
        <Route path='/admin/messages' element={<Messages />}></Route>
        <Route path='/admin/enrollments'element={<Enrollments/>}></Route>
        <Route path='/admin/applications' element={<ManageApplications />}></Route>
        <Route path='/admin/applications/:job' element={<JobApplications />}></Route>

        {/* 404 Slap */}
      <Route path='*' element={<NotFound/>} />
      </Routes>
   
      <ScrollUpButton/>
      {showBanner&&  <MgciBanner
          onClose={() => SetShowBanner(false)}
          imgSrc={Bannerimg}
          imgWidth={'400px'}
        brochure={MGCIBrochure}
        />}
      {!isAdminRoute && <Footer />}
  
    </>
  )
}

export default App
