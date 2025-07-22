import './App.css'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import Footer from './components/Footer'
import Contact from './Pages/Contact'
import About from './Pages/About'
import Mentors from './Pages/Mentors'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import Course from './Pages/Course'
import Admin from './Pages/Admin'
import ManageColleges from './Pages/ManageColleges'
import SignUp from './Pages/SignUp'
import LogIn from './Pages/LogIn'
import Profile from './Pages/EditProfile'
import { useEffect } from 'react';
import { useUser } from './context/UserContext';


function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser } = useUser();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          let user = data.user;
          // Fetch authorized image URL if user has an image
          if (user && user.image) {
            try {
              const imgRes = await fetch('/api/users/me/pic', { credentials: 'include' });
              if (imgRes.ok) {
                const imgUrl = await imgRes.json();
                user = { ...user, imageUrl: imgUrl };
              }
            } catch {
              user = { ...user, imageUrl: null };
            }
          }
          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, [setUser]);

  return (
    <>
      {!isAdminRoute && <Navbar />}
             <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/mentors' element={<Mentors />}></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/colleges/:id' element={<CollegeDetailed />}></Route>
        <Route path='/Policies' element={<PrivacyPolicy />}></Route>
        <Route path='/Terms' element={<TermsAndConditions />}></Route>
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course />}></Route>
        <Route path='/signup' element={<SignUp />}></Route>
        <Route path='/login' element={<LogIn />}></Route>
        <Route path='/me' element={<Profile />}></Route>
        <Route path='/admin' element={<Admin />}></Route>
        <Route path='/admin/colleges' element={<ManageColleges />}></Route>
        <Route path='/admin/mentors' element={<h1 className='mt-5 text-5xl text-tprimary text-center font-bold'>Coming Soon...</h1>}></Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
