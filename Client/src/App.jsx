import './App.css'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import ScrollUpButton from './components/ScrollUpButton';
import Footer from './components/Footer'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Mentors from './Pages/Mentors'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import Course from './Pages/Course'
import SignUp from './Pages/SignUp'
import Login from './Pages/Login'
import Profile from './Pages/EditProfile'
import Admin from './Pages/Admin'
import ManageColleges from './Pages/ManageColleges'
import ManageUsers from './Pages/ManageUsers'
import ManageApplications from './Pages/ManageApplications'
import JobApplications from './Pages/JobApplications'
import MentorshipForm from './Pages/MentorshipForm'
import Messages from './Pages/Messages'
import { useEffect } from 'react';
import { useUser } from './context/UserContext';
import TextPressure from "../ReactBits/TextPressure/TextPressure"
import { NotFound } from './Pages/NotFound';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();

  useEffect(() => {
    // Fetch user data on app mount
    fetchUser();
  }, []);

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/mentors' element={<Mentors />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/mentors' element={<Mentors />}></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/colleges/:id' element={<CollegeDetailed />}></Route>
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course />}></Route>
        <Route path='/policies' element={<PrivacyPolicy />}></Route>
        <Route path='/t&c' element={<TermsAndConditions />}></Route>
        <Route path='/signup' element={<SignUp />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/me' element={<Profile />}></Route>
        <Route path='/admin' element={<Admin />}></Route>
        <Route path='/careers/mentorship/apply' element={<MentorshipForm />}></Route>
        <Route path='/admin/colleges' element={<ManageColleges />}></Route>
        <Route path='/admin/users' element={<ManageUsers />}></Route>
        <Route path='/admin/messages' element={<Messages />}></Route>
        <Route path='/admin/applications' element={<ManageApplications />}></Route>
        <Route path='/admin/applications/:job' element={<JobApplications />}></Route>

        {/* 404 Slap */}
      <Route path='*' element={<NotFound/>} />
      </Routes>
   
      <ScrollUpButton/>
      {!isAdminRoute && <Footer />}
  
    </>
  )
}

export default App
