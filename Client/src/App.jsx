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
// Vartalaap Banner Imgs
function App() {
  const location = useLocation();
  const [randomBanner, SetRandomBanner] = useState(null)
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, setUser, fetchUser } = useUser();
  const { mentor } = useMentor();

  // Username warning toast
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('usernameWarningDismissed');
    const loggedInAccount = user || mentor;
    const hasNoUsername = loggedInAccount && !loggedInAccount.username;

    // Don't show on auth pages or if already dismissed
    const authPages = ['/login', '/mentors/login', '/mentors/register', '/mentors/forgot-password', '/mentors/reset-password', '/onboarding', '/forgot-password', '/reset-password'];
    const isAuthPage = authPages.some(path => location.pathname.startsWith(path));

    if (hasNoUsername && !isDismissed && !isAuthPage) {
      toast.info(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Add username to make yourself visible</p>
          <Link
            to="/me"
            className="text-xs underline font-bold hover:text-white transition-colors"
            onClick={() => toast.dismiss('username-warning')}
          >
            Go to Profile
          </Link>
        </div>,
        {
          toastId: 'username-warning',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          position: "top-center",
          className: "bg-[#9f3562] text-white",
          progressClassName: "bg-white",
          onClose: () => sessionStorage.setItem('usernameWarningDismissed', 'true'),
        }
      );
    } else if (!hasNoUsername || isAuthPage) {
      toast.dismiss('username-warning');
    }
  }, [user, mentor, location.pathname]);

  // Notification Permission Trigger
  useEffect(() => {
    const loggedInAccount = user || mentor;
    const role = mentor ? 'mentor' : 'user';

    if (loggedInAccount && Notification.permission !== 'granted') {
      // Small delay to not interfere with initial page load
      const timer = setTimeout(() => {
        enableNotifications(loggedInAccount._id, role);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, mentor, location.pathname]);

  // Handle foreground notifications (when app is open)
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground notification received:', payload);

      // Show a toast notification
      toast.info(
        <div
          onClick={() => navigate('/notifications')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ fontWeight: 'bold' }}>{payload.notification?.title}</div>
          <div style={{ fontSize: '0.9em' }}>{payload.notification?.body}</div>
        </div>,
        {
          onClick: () => navigate('/notifications'),
          autoClose: 5000,
        }
      );
    });

    return () => unsubscribe();
  }, [navigate]);

  // Listen for navigation messages from service worker (when notification is clicked)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'NAVIGATE_TO_NOTIFICATIONS') {
          navigate('/notifications');
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [navigate]);


  // Routes that use Layout component (Layout already includes Navbar and Sidebar)
  const layoutRoutes = [
    '/',
    '/subscription-plans',
    '/my-subscriptions',
    '/:username',
    '/explore',
    '/spaces',
    '/spaces/:id',
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

  // Known single-segment routes that are NOT username routes
  const knownSingleSegmentRoutes = ['/about', '/contact', '/login', '/signup', '/policies', '/t&c'];

  // Check if current route uses Layout
  const usesLayout = layoutRoutes.some(path => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/:username') {
      // Check if pathname is a single segment and not a known route
      const isSingleSegment = /^\/[^\/]+$/.test(location.pathname);
      const isKnownRoute = knownSingleSegmentRoutes.includes(location.pathname) ||
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/mentors/') ||
        location.pathname.startsWith('/reset-password') ||
        location.pathname.startsWith('/verify-email') ||
        location.pathname.startsWith('/onboarding') ||
        location.pathname.startsWith('/forgot-password');
      return isSingleSegment && !isKnownRoute;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });

  // Auth pages that should hide navbar
  const authPages = [
    '/login',
    '/mentors/login',
    '/mentors/register',
    '/mentors/forgot-password',
    '/mentors/reset-password',
    '/onboarding',
    '/forgot-password',
    '/reset-password',
    '/verify-email'
  ];

  const isAuthPage = authPages.some(path =>
    location.pathname.startsWith(path)
  );

  // Show old Navbar only on non-Layout, non-admin, non-auth routes
  const shouldShowOldNavbar = !isAdminRoute && !usesLayout && !isAuthPage && location.pathname !== '/me/edit';

  return (
    <>
      {!isAdminRoute && <Navbar />}


      {!isAuthPage && <OnboardingReminderBanner />}

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
                {<Profile />}
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute user={user || mentor}>
                <Notification />
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

          {/* Subscriptions */}
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route
            path="/my-subscriptions"
            element={
              <ProtectedRoute user={true}>
                <MySubscriptions />
              </ProtectedRoute>
            }
          />

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

          {/* Posts */}
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/posts/create" element={<CreatePost />} />
          {/* Spaces */}
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/spaces/:id" element={<Space />} />
        </Route>

        {/* ================= NO SIDEBAR ROUTES ================= */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/:id" element={<Onboarding />} />
        <Route path="/mentors/login" element={<MentorsLogin />} />
        <Route path="/mentors/forgot-password" element={<MentorForgotPassword />} />
        <Route path="/mentors/reset-password/:token" element={<MentorResetPassword />} />
        <Route path="/mentors/register" element={<MentorRegistration />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Profile Edit Route - outside Layout */}
        <Route
          path="/mentor/chats/:userId"
          element={
            <ProtectedRoute mentor={true}>
              <MentorChat />
            </ProtectedRoute>
          }
        />
        <Route path='/policies' element={<PrivacyPolicy />}></Route>
        <Route path='/t&c' element={<TermsAndConditions />}></Route>
        <Route path='/reset-password/:token' element={<ResetPassword />}></Route>
        <Route path='/reset-password' element={<ResetPassword />}></Route>
        <Route path='/forgot-password' element={<ForgotPassword />}></Route>
        {/* We don't need Signup route */}
        <Route path='/login' element={<AuthPage />}></Route>

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
        <Route path='/onboarding' element={<Onboarding />}></Route>
        <Route path='/onboarding/:id' element={<Onboarding />}></Route>
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
        <Route path='/blogs' element={<Blogs />}></Route>
        <Route path='/blogs/:id' element={<BlogDetail />}></Route>
        {/* Notes */}
        <Route path='/notes' element={<Notes />}></Route>
        <Route path="/notes/:id" element={<NotesPage />} />
        <Route path="/notes-search" element={<NotesSearch />} />
        <Route path="/add-note" element={<AddNote />} />

        <Route path='/admin/enrollments' element={<Enrollments />}></Route>
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