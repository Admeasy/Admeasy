import './App.css'
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import Chat from './Pages/Chat';
import Chats from './Pages/Chats';
import MentorChats from './Pages/MentorChats';
import MentorChat from './Pages/MentorChat';
import ManageMentors from './Pages/ManageMentors';
import { useEffect, useState } from 'react';
import { useUser } from './context/UserContext';
import { useMentor } from './context/MentorContext';
import { SocketProvider } from './context/SocketContext';
import TextPressure from "../ReactBits/TextPressure/TextPressure"
import { NotFound } from './Pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ManageBlogs from './Pages/ManageBlogs';
import ManageNotes from './Pages/ManageNotes';
import BlogDetail from './Pages/BlogDetail';
import { AnimatePresence, motion } from 'framer-motion';
import AuthPage from './components/AuthPage';
import MentorPostsFeed from './Pages/MentorPostsFeed';
import PostDetail from './Pages/PostDetail';
import LeftSidebar from './components/LeftSidebar';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();
  const { mentor } = useMentor();

  // Pages where old navbar should be hidden
  const hideOldNavbarPages = [
    '/',
    '/posts/',
    '/colleges',
    '/mentors',
    '/blog',
    '/about',
    '/contact',
    '/chats',
    '/mentor/chats',
    '/me',
    '/notes',
  ];

  const shouldHideOldNavbar = hideOldNavbarPages.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );

  return (
    <>
      {/* Old Navbar - only show on pages that need it (not on sidebar pages) */}
      {!isAdminRoute && !shouldHideOldNavbar && <Navbar />}
      
      {/* New Left Sidebar - shows on all non-admin pages except auth pages */}
      {!isAdminRoute && <LeftSidebar />}
      
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
        {/* New social-style home feed on root */}
        <Route path='/' element={<MentorPostsFeed />} />
        
        {/* Legacy landing page preserved and reachable */}
        <Route path='/home-classic' element={<Home />} />
        
        <Route path='/contact' element={<Contact />} />
        <Route path='/about' element={<About />} />
        <Route path='/mentors' element={<Mentors />} />
        <Route path='/colleges' element={<Colleges />} />
        <Route path='/colleges/:id' element={<CollegeDetailed />} />
        <Route path='/colleges/:collegeId/courses/:courseId' element={<Course />} />
        <Route path='/mentors/register' element={<MentorRegistration />} />
        <Route path='/mentors/login' element={<MentorsLogin />} />
        <Route path='/mentors/:username' element={<MentorProfile />} />
        
        {/* User Chat Routes - Protected for users only */}
        <Route
          path="/chats"
          element={
            <ProtectedRoute user={true}>
              <Chats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats/:mentorId"
          element={
            <ProtectedRoute user={true}>
              <Chat />
            </ProtectedRoute>
          }
        />
        
        {/* Mentor Chat Routes */}
        <Route
          path="/mentor/chats"
          element={
            <ProtectedRoute mentor={true}>
              <MentorChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/chats/:userId"
          element={
            <ProtectedRoute mentor={true}>
              <MentorChat />
            </ProtectedRoute>
          }
        />
        
        <Route path='/policies' element={<PrivacyPolicy />} />
        <Route path='/t&c' element={<TermsAndConditions />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/login' element={<AuthPage />} />

        {/* Profile Routes */}
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
        
        <Route path='/onboarding' element={<Onboarding />} />
        <Route path='/onboarding/:id' element={<Onboarding />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/careers/mentorship/apply' element={<MentorshipForm />} />
        <Route path='/admin/colleges' element={<ManageColleges />} />
        <Route path='/admin/blogs' element={<ManageBlogs />} />
        <Route path='/admin/users' element={<ManageUsers />} />
        <Route path='/admin/mentors' element={<ManageMentors />} />
        <Route path='/admin/messages' element={<Messages />} />
        
        {/* Blog Routes */}
        <Route path='/blog' element={<Blogs />} />
        <Route path='/blog/:id' element={<BlogDetail />} />
        <Route path='/blogs' element={<Blogs />} />
        <Route path='/blogs/:id' element={<BlogDetail />} />
        
        {/* Notes Routes */}
        <Route path='/notes' element={<Notes />} />
        <Route path="/notes/:id" element={<NotesPage />} />
        <Route path="/notes-search" element={<NotesSearch />} />
        <Route path="/add-note" element={<AddNote />} />

        {/* Mentor Posts Routes */}
        <Route path="/mentor-posts" element={<MentorPostsFeed />} />
        <Route path="/posts/:postId" element={<PostDetail />} />

        <Route path='/admin/enrollments' element={<Enrollments />} />
        <Route path='/admin/applications' element={<ManageApplications />} />
        <Route path='/admin/applications/:job' element={<JobApplications />} />
        <Route path='/admin/notes' element={<ManageNotes />} />

        {/* 404 */}
        <Route path='*' element={<NotFound />} />
      </Routes>

      <ScrollUpButton />
      
      {/* Footer - handled individually in pages that need sidebar */}
      {!isAdminRoute && !shouldHideOldNavbar && <Footer />}
    </>
  )
}

export default App