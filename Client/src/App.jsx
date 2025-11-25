import './App.css'
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import ScrollUpButton from './components/ScrollUpButton';
import Footer from './components/Footer'
import MentorRegistration from './Pages/MentorRegistration'
import MentorsLogin from './Pages/MentorsLogin';
import EditMentorProfile from './Pages/EditMentorProfile';
import MentorProfile from './Pages/MentorProfile';
import LoginModal from './components/LoginModal';
import Contact from './Pages/Contact'
import About from './Pages/About'
import Mentors from './Pages/Mentors'
import Colleges from './Pages/Colleges'
import CollegeDetailed from './Pages/CollegeDetailed'
import PrivacyPolicy from './Pages/PrivacyPolicy'
import TermsAndConditions from './Pages/TermsAndConditions'
import ResetPassword from './Pages/ResetPassword';
import Course from './Pages/Course'
import Notes from './Pages/Notes';
import NotesSearch from './Pages/NotesSearch';
import AddNote from './Pages/AddNote';
import SignUp from './Pages/SignUp'
import LogIn from './Pages/LogIn'
import Profile from './Pages/EditProfile'
import Admin from './Pages/Admin'
import ForgotPassword from './Pages/ForgotPassword';
import Onboarding from './Pages/Onboarding';
import ManageColleges from './Pages/ManageColleges'
import ManageUsers from './Pages/ManageUsers'
import ManageApplications from './Pages/ManageApplications'
import JobApplications from './Pages/JobApplications'
import MentorshipForm from './Pages/MentorshipForm'
import Blogs from './Pages/Blogs'
import Messages from './Pages/Messages'
import Enrollments from './Pages/Enrollments';
import NotesPage from './Pages/NotesPage';
import ManageMentors from './Pages/ManageMentors';
import { useEffect, useState } from 'react';
import { useUser } from './context/UserContext';
import { useMentor } from './context/MentorContext';
import TextPressure from "../ReactBits/TextPressure/TextPressure"
import { NotFound } from './Pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ManageBlogs from './Pages/ManageBlogs';
import ManageNotes from './Pages/ManageNotes';
import BlogDetail from './Pages/BlogDetail';
import { AnimatePresence, motion } from 'framer-motion';


// Vartalaap Banner Imgs
function App() {
  const location = useLocation();
  const [randomBanner, SetRandomBanner] = useState(null)
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();
  const { mentor } = useMentor();
  const [showBanner, SetShowBanner] = useState(false)
  const [bannerName, SetBannerName] = useState('')
  //   useEffect(() => {
  //     // Fetch user data on app mount
  //     fetchUser();
  //   }, []);
  //  useEffect(()=>{
  //  setTimeout(() => {
  //     SetShowBanner(true)
  //   }, 5000)
  //  },[])



  // const Banners = [
  //   {  Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
  //   Subheadline: "Expert-led Online Classes",
  //   SubheadlineO: "Dedicated Offline Programs in Indore",
  //   imgSrc: Bannerimg,
  //   imgWidth: "400px",
  //   brochure: MGCIBrochure,
  //   bannerName: "MGCI",
  // },
  // {
  //   Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
  //   Subheadline: "Expert-led Online Classes",
  //   SubheadlineO: "Dedicated Offline Programs in Indore",
  //   imgSrc: MGCIBannerTwo,
  //   imgWidth: "400px",
  //   brochure: MGCIBrochure,
  //   bannerName: "MGCI",
  // },
  // {
  //    Headline: "Crack JEE & NEET with Udaan — Your Success, Our Mission",
  //   Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
  //   SubheadlineO:"Join Udaan Today!!",
  //   imgSrc:UdaanBanner,
  //   imgWidth:"300px",
  //   brochure:false,
  //   bannerName:"UDAAN"
  // },
  // {
  //   Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
  //   Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
  //   SubheadlineO:"Join Udaan Today!!",
  //   imgSrc:UdaanBannerJee,
  //   imgWidth:"300px",
  //   brochure:false,
  //   bannerName:"UDAAN"  
  // },
  // {
  //   Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
  //   Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
  //   SubheadlineO:"Join Udaan Today — Where Aspirations Take Flight",
  //   imgSrc:UdaanBannerNeet,
  //   imgWidth:"300px",
  //   brochure:false,
  //   bannerName:"UDAAN"  
  // }]
  //    useEffect(()=>{
  //     const randomIndex = Math.floor(Math.random()*Banners.length)
  //     SetRandomBanner(Banners[randomIndex])
  //   },[])

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        {/* <Route path='/modal' element={<LoginModal />}></Route> */}
        <Route path='/about' element={<About />}></Route>
        <Route path='/mentors' element={<Mentors />}></Route>
        <Route path='/colleges' element={<Colleges />}></Route>
        <Route path='/colleges/:id' element={<CollegeDetailed />}></Route>
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course />}></Route>
        <Route path='/mentors/register' element={<MentorRegistration />}></Route>
        <Route path='/mentors/login' element={<MentorsLogin />}></Route>
        <Route path='/mentors/:username' element={<MentorProfile />}></Route>
        <Route path='/policies' element={<PrivacyPolicy />}></Route>
        <Route path='/t&c' element={<TermsAndConditions />}></Route>
        <Route path='/reset-password/:token' element={<ResetPassword/>}></Route>
         <Route path='/reset-password' element={<ResetPassword/>}></Route>
        <Route path='/forgot-password' element={<ForgotPassword/>}></Route>
        {/* We don't need Signup route */}
        <Route path='/signup' element={<SignUp />}></Route>
        <Route path='/login' element={<LogIn />}></Route>

        {/* If user Only then /me accessible */}
        <Route
          path="/me/edit"
          element={
            <ProtectedRoute user={user || mentor}>
              {mentor ? <EditMentorProfile /> : <Profile />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/me"
          element={
            <ProtectedRoute user={mentor}>
              <MentorProfile />
            </ProtectedRoute>
          }
        />
        <Route path='/onboarding' element={<Onboarding/>}></Route>
        <Route path='/onboarding/:id' element={<Onboarding/>}></Route>
        <Route path='/admin' element={<Admin />}></Route>
        <Route path='/careers/mentorship/apply' element={<MentorshipForm />}></Route>
        <Route path='/admin/colleges' element={<ManageColleges />}></Route>
        <Route path='/admin/blogs' element={<ManageBlogs />}></Route>
        <Route path='/admin/users' element={<ManageUsers />}></Route>
        <Route path='/admin/mentors' element={<ManageMentors />}></Route>
        <Route path='/admin/messages' element={<Messages />}></Route>
        {/* The Original Path is Blog */}
        <Route path='/blog' element={<Blogs />}></Route>
        <Route path='/blog/:id' element={<BlogDetail />}></Route>
        {/* But sometimes Users mistakenly goes to /Blogs */}
        <Route path='/blogs' element={<Blogs/>}></Route>
        <Route path='/blogs/:id' element={<BlogDetail/>}></Route>
        {/* Notes */}
        <Route path='/notes' element={<Notes/>}></Route>
        <Route path="/notes/:id" element={<NotesPage />} />
        <Route path="/notes-search" element={<NotesSearch />} />
        <Route path="/add-note" element={<AddNote />} />

        <Route path='/admin/enrollments'element={<Enrollments/>}></Route>
        <Route path='/admin/applications' element={<ManageApplications />}></Route>
        <Route path='/admin/applications/:job' element={<JobApplications />}></Route>
        <Route path='/admin/notes' element={<ManageNotes />}></Route>

        {/* 404 Slap */}
        <Route path='*' element={<NotFound />} />
      </Routes>

      <ScrollUpButton />
      {showBanner && !isAdminRoute &&
        <MgciBanner
          onClose={() => SetShowBanner(false)}
          Headline={randomBanner.Headline}
          Subheadline={randomBanner.Subheadline}
          SubheadlineO={randomBanner.SubheadlineO}
          imgSrc={randomBanner.imgSrc}
          imgWidth={randomBanner.imgWidth}
          brochure={randomBanner.brochure}
          bannerName={randomBanner.bannerName}
        />}
      {!isAdminRoute && <Footer />}

    </>
  )
}

export default App
