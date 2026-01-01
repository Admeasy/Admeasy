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
import Profile from './Pages/Profile';
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
import EditProfile from './Pages/EditProfile'
import Admin from './Pages/Admin'
import ForgotPassword from './Pages/ForgotPassword';
import Onboarding from './Pages/Onboarding';
import ManageColleges from './Pages/ManageColleges'
import ManageUsers from './Pages/ManageUsers'
import ManageApplications from './Pages/ManageApplications'
import ManageSubscriptionPlans from './Pages/ManageSubscriptionPlans'
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
import Feed from './Pages/Feed';
import PostDetail from './Pages/PostDetail';
import MentorPost from './Pages/MentorPost';
import Layout from './components/Layout';
import Explore from "./Pages/Explore"
import BottomNavBar from './components/BottomNavBar';
import MentorForgotPassword from "./Pages/MentorForgotPassword";
import MentorResetPassword from "./Pages/MentorResetPassword";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();
  const { mentor } = useMentor();

  // Routes that use Layout component (Layout already includes Navbar and Sidebar)
  const layoutRoutes = [
    '/',
    '/explore',
    '/mentors',
    '/colleges',
    '/blog',
    '/blogs',
    '/notes',
    '/chats',
    '/mentor/chats',
    '/posts',
    '/home-classic'
  ];

  // Check if current route uses Layout
  const usesLayout = layoutRoutes.some(path => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });

  // Auth pages that should hide navbar
  const authPages = [
    '/login',
    '/mentors/login',
    '/mentors/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password'
  ];

  const isAuthPage = authPages.some(path =>
    location.pathname.startsWith(path)
  );

  // Show old Navbar only on non-Layout, non-admin, non-auth routes
  const shouldShowOldNavbar = !isAdminRoute && !usesLayout && !isAuthPage;

  return (
    <>
      {/* Old Navbar - only show on pages that don't use Layout (Layout has its own Navbar) */}
      {shouldShowOldNavbar && <Navbar />}

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
        {/* ================= SIDEBAR LAYOUT ROUTES ================= */}
        <Route element={<Layout />}>
          <Route path="/about" element={<About />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/" element={<Feed />} />
          {/* <Route path="/" element={<Home />} />
          <Route path="/home-classic" element={<Home />} /> */}

          <Route path="/contact" element={<Contact />} />

          <Route path="/mentors" element={<Mentors />} />

          {/* Profile Routes - inside Layout for sidebar/navbar */}
          <Route
            path="/me"
            element={
              <ProtectedRoute user={user || mentor}>
                {mentor ? <MentorProfile /> : <Profile />}
              </ProtectedRoute>
            }
          />
          <Route path="/:username" element={<Profile />} />

          <Route path="/colleges" element={<Colleges />} />
          <Route path="/colleges/:id" element={<CollegeDetailed />} />
          <Route path="/colleges/:collegeId/courses/:courseId" element={<Course />} />

          <Route path="/blog" element={<Blogs />} />
          <Route path="/blog/:id" element={<BlogDetail />} />

          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />

          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<NotesPage />} />
          <Route path="/notes-search" element={<NotesSearch />} />
          <Route path="/add-note" element={<AddNote />} />

          {/* Chats */}
          <Route
            path="/chats"
            element={
              <ProtectedRoute user={true}>
                <Chats />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentor/chats"
            element={
              <ProtectedRoute mentor={true}>
                <MentorChats />
              </ProtectedRoute>
            }
          />
           <Route path="/mentors/:username" element={<MentorProfile />} />
           
            {/* Mentor Password Reset */}
          <Route path="/mentors/forgot-password" element={<MentorForgotPassword />} />
          <Route path="/mentors/reset-password/:token" element={<MentorResetPassword />} />

          {/* Posts */}
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/posts/create" element={<MentorPost />} />
        </Route>

        {/* ================= NO SIDEBAR ROUTES ================= */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/:id" element={<Onboarding />} />
        <Route path="/mentors/login" element={<MentorsLogin />} />
        <Route path="/mentors/register" element={<MentorRegistration />} />

        {/* Profile Edit Route - outside Layout */}
        <Route
          path="/me/edit"
          element={
            <ProtectedRoute user={user || mentor}>
              {mentor ? <EditMentorProfile /> : <EditProfile />}
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

        <Route
          path="/mentor/chats/:userId"
          element={
            <ProtectedRoute mentor={true}>
              <MentorChat />
            </ProtectedRoute>
          }
        />

        <Route path="/policies" element={<PrivacyPolicy />} />
        <Route path="/t&c" element={<TermsAndConditions />} />
        <Route path="/careers/mentorship/apply" element={<MentorshipForm />} />

        {/* ================= ADMIN (NO SIDEBAR) ================= */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/colleges" element={<ManageColleges />} />
        <Route path="/admin/blogs" element={<ManageBlogs />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/mentors" element={<ManageMentors />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/admin/enrollments" element={<Enrollments />} />
        <Route path="/admin/applications" element={<ManageApplications />} />
        <Route path="/admin/applications/:job" element={<JobApplications />} />
        <Route path="/admin/notes" element={<ManageNotes />} />
        <Route path="/admin/subscription-plans" element={<ManageSubscriptionPlans />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Showing scroll up button on mobiles (not good) */}
      {/* <ScrollUpButton /> */}

      {/* Footer - show on non-Layout, non-admin routes (Layout pages handle their own footer) */}
      {!isAdminRoute && !usesLayout && !isAuthPage && <Footer />}
    </>
  )
}

export default App