import './App.css';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './Pages/Home';
import ScrollUpButton from './components/ScrollUpButton';
import Footer from './components/Footer';
import MentorRegistration from './Pages/MentorRegistration';
import MentorsLogin from './Pages/MentorsLogin';
import EditProfile from './Pages/EditProfile';
import EditMentorProfile from './Pages/EditMentorProfile';
import MentorProfile from './Pages/MentorProfile';
import LoginEncouragementModal from './components/LoginEncouragementModal';
import Contact from './Pages/Contact';
import About from './Pages/About';
import Mentors from './Pages/Mentors';
import Colleges from './Pages/Colleges';
import CollegeDetailed from './Pages/CollegeDetailed';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsAndConditions from './Pages/TermsAndConditions';
import ResetPassword from './Pages/ResetPassword';
import Course from './Pages/Course';
import Notes from './Pages/Notes';
import NotesSearch from './Pages/NotesSearch';
import AddNote from './Pages/AddNote';
import Profile from './Pages/Profile';
import Admin from './Pages/Admin';
import ForgotPassword from './Pages/ForgotPassword';
import Onboarding from './Pages/Onboarding';
import ManageColleges from './Pages/ManageColleges';
import ManageUsers from './Pages/ManageUsers';
import ManageApplications from './Pages/ManageApplications';
import JobApplications from './Pages/JobApplications';
import MentorshipForm from './Pages/MentorshipForm';
import Blogs from './Pages/Blogs';
import Messages from './Pages/Messages';
import Enrollments from './Pages/Enrollments';
import NotesPage from './Pages/NotesPage';
import Chatpage from './Pages/Chatpage';
import Chats from './Pages/Chats';
import MentorChats from './Pages/MentorChats';
import MentorChat from './Pages/MentorChat';
import ManageMentors from './Pages/ManageMentors';
import { useEffect, useRef, useState } from 'react';
import { useUser } from './context/UserContext';
import { useMentor } from './context/MentorContext';
import { NotFound } from './Pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ManageBlogs from './Pages/ManageBlogs';
import ManageNotes from './Pages/ManageNotes';
import BlogDetail from './Pages/BlogDetail';
import ManageAdvertisers from './Pages/ManageAdvertisers';
import ManageAds from './Pages/ManageAds';
import Notification from './Pages/Notification';
import AuthPage from './components/AuthPage';
import Feed from './Pages/Feed';
import PostDetail from './Pages/PostDetail';
import CreatePost from './Pages/CreatePost';
import Layout from './components/Layout';
import Explore from "./Pages/Explore";
import VerifyEmail from './Pages/VerifyEmail';
import CuetCalculator from './Pages/CuetCalculator';
import { enableNotifications } from './Firebase/enableNotifications';
import { onMessage } from 'firebase/messaging';
import { messaging } from './Firebase/Firebase';
import SubscriptionPlans from './Pages/SubscriptionPlans';
import MySubscriptions from './Pages/MySubscriptions';
import CheckPayments from './Pages/CheckPayments';
import Spaces from './Pages/Spaces';
import SpacesExplore from './Pages/SpacesExplore';
import Space from './Pages/Space';
import AdvertiseLanding from './Pages/AdvertiseLanding';
import AdvertiserSignup from './Pages/AdvertiserSignup';
import AdvertiserLogin from './Pages/AdvertiserLogin';
import AdvertiserLayout from './components/AdvertiserLayout';
import AdvertiserDashboard from './Pages/AdvertiserDashboard';
import AdvertiserProfile from './Pages/AdvertiserProfile';
import EditAdvertiserProfile from './Pages/EditAdvertiserProfile';
import CreateAd from './Pages/CreateAd';
import EditAd from './Pages/EditAd';
import MyAds from './Pages/MyAds';
import OnboardingReminderBanner from './components/OnboardingReminderBanner';
import ManagePosts from './Pages/ManagePosts';
import ManageSpaces from './Pages/ManageSpaces';
import ManageSubscriptionPlans from './Pages/ManageSubscriptionPlans';
import MentorForgotPassword from './Pages/MentorForgotPassword';
import MentorResetPassword from './Pages/MentorResetPassword';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import MentorLeaderboard from './Pages/MentorLeaderboard';
import GoogleSignInBootstrap from "./components/GoogleSignInBootstrap";
import Wallet from "./Pages/Wallet";
import Referral from "./Pages/Referral";

function App() {
  const location = useLocation();
  const { user } = useUser();
  const { mentor } = useMentor();
  const navigate = useNavigate();
  const lastBackPressRef = useRef(0);
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Android hardware back button: history back or double-tap to exit
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const backHandler = CapacitorApp.addListener("backButton", () => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPressRef.current = now;
        toast.info("Press back again to exit", {
          position: "bottom-center",
          autoClose: 2000,
          toastId: "back-to-exit",
        });
      }
    });

    return () => {
      backHandler.remove();
    };
  }, []);

  // Username warning toast
  useEffect(() => {
    const isDismissed = sessionStorage.getItem("usernameWarningDismissed");
    const loggedInAccount = user || mentor;
    const hasNoUsername = loggedInAccount && !loggedInAccount.username;

    const authPages = [
      "/login",
      "/mentors/login",
      "/mentors/register",
      "/mentors/forgot-password",
      "/mentors/reset-password",
      "/onboarding",
      "/forgot-password",
      "/reset-password",
    ];
    const isAuthPage = authPages.some((path) =>
      location.pathname.startsWith(path),
    );

    if (hasNoUsername && !isDismissed && !isAuthPage) {
      toast.info(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">
            Add username to make yourself visible
          </p>
          <Link
            to="/me"
            className="text-xs underline font-bold hover:text-white transition-colors"
            onClick={() => toast.dismiss("username-warning")}
          >
            Go to Profile
          </Link>
        </div>,
        {
          toastId: "username-warning",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          position: "top-center",
          className: "bg-[#9f3562] text-white",
          progressClassName: "bg-white",
          onClose: () =>
            sessionStorage.setItem("usernameWarningDismissed", "true"),
        },
      );
    } else if (!hasNoUsername || isAuthPage) {
      toast.dismiss("username-warning");
    }
  }, [user, mentor, location.pathname]);

  // Notification Permission Trigger
  useEffect(() => {
    const loggedInAccount = user || mentor;
    const role = mentor ? "mentor" : "user";

    if (
      loggedInAccount &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      window.Notification.permission !== "granted"
    ) {
      const timer = setTimeout(() => {
        enableNotifications(loggedInAccount._id, role);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, mentor, location.pathname]);

  // Handle foreground notifications
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      toast.info(
        <div
          onClick={() => navigate("/notifications")}
          style={{ cursor: "pointer" }}
        >
          <div style={{ fontWeight: "bold" }}>
            {payload.notification?.title}
          </div>
          <div style={{ fontSize: "0.9em" }}>{payload.notification?.body}</div>
        </div>,
        {
          onClick: () => navigate("/notifications"),
          autoClose: 5000,
        },
      );
    });

    return () => unsubscribe();
  }, [navigate]);

  // Listen for navigation messages from service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleMessage = (event) => {
        if (event.data && event.data.type === "NAVIGATE_TO_NOTIFICATIONS") {
          navigate("/notifications");
        }
      };
      navigator.serviceWorker.addEventListener("message", handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
  }, [navigate]);

  const knownSingleSegmentRoutes = [
    "/about",
    "/contact",
    "/login",
    "/signup",
    "/policies",
    "/t&c",
    "/cuet-calculator",
  ];

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
    '/mentor/leaderboard',
    '/posts',
    '/cuet-calculator',
  ];

  const usesLayout = layoutRoutes.some((path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/:username") {
      const isSingleSegment = /^\/[^\/]+$/.test(location.pathname);
      const isKnownRoute =
        knownSingleSegmentRoutes.includes(location.pathname) ||
        location.pathname.startsWith("/admin") ||
        location.pathname.startsWith("/mentors/") ||
        location.pathname.startsWith("/reset-password") ||
        location.pathname.startsWith("/verify-email") ||
        location.pathname.startsWith("/onboarding") ||
        location.pathname.startsWith("/forgot-password");
      return isSingleSegment && !isKnownRoute;
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  });

  const authPages = [
    "/login",
    "/mentors/login",
    "/mentors/register",
    "/mentors/forgot-password",
    "/mentors/reset-password",
    "/onboarding",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  const isAuthPage = authPages.some((path) =>
    location.pathname.startsWith(path),
  );

  const shouldShowOldNavbar =
    !isAdminRoute &&
    !usesLayout &&
    !isAuthPage &&
    !location.pathname.startsWith("/advertiser") &&
    location.pathname !== "/me/edit";

  return (
    <>
      {shouldShowOldNavbar && <Navbar />}

      {!isAuthPage && <OnboardingReminderBanner />}
      {!isAuthPage && <LoginEncouragementModal />}

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
      <GoogleSignInBootstrap />

      <Routes>
        {/* ================= SIDEBAR LAYOUT ROUTES ================= */}
        <Route element={<Layout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/colleges/:id" element={<CollegeDetailed />} />
          <Route path="/colleges/:collegeId/courses/:courseId" element={<Course />} />
          <Route path="/cuet-calculator" element={<CuetCalculator />} />

          <Route path="/me" element={<ProtectedRoute user={user || mentor}><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user || mentor}><Notification /></ProtectedRoute>} />
          <Route path="/:username" element={<Profile />} />

          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />

          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<NotesPage />} />
          <Route path="/notes-search" element={<NotesSearch />} />
          <Route path="/add-note" element={<AddNote />} />

          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/my-subscriptions" element={<ProtectedRoute user={true}><MySubscriptions /></ProtectedRoute>} />

          <Route path="/chats" element={<ProtectedRoute user={true}><Chats /></ProtectedRoute>} />
          <Route path="/mentor/chats" element={<ProtectedRoute mentor={true}><MentorChats /></ProtectedRoute>} />

          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/posts/create" element={<CreatePost />} />

          <Route path="/spaces" element={<Spaces />} />
          <Route path="/spaces/explore" element={<SpacesExplore />} />
          <Route path="/spaces/:id" element={<Space />} />

          <Route path="/wallet" element={<ProtectedRoute user={user}><Wallet /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute user={user}><Referral /></ProtectedRoute>} />

          <Route path="/mentor/leaderboard" element={<ProtectedRoute mentor={true}><MentorLeaderboard /></ProtectedRoute>} />
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
        <Route path="/mentors/:username" element={<MentorProfile />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/chats/:id" element={<ProtectedRoute user={true}><Chatpage /></ProtectedRoute>} />
        <Route path="/mentor/chats/:id" element={<ProtectedRoute mentor={true}><MentorChat /></ProtectedRoute>} />

        <Route path="/policies" element={<PrivacyPolicy />} />
        <Route path="/t&c" element={<TermsAndConditions />} />

        {/* Profile Edit Route */}
        <Route path="/me/edit" element={<ProtectedRoute user={user || mentor}>{mentor ? <EditMentorProfile /> : <EditProfile />}</ProtectedRoute>} />

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
        <Route path="/admin/posts" element={<ManagePosts />} />
        <Route path="/admin/spaces" element={<ManageSpaces />} />
        <Route path="/admin/subscription-plans" element={<ManageSubscriptionPlans />} />
        <Route path="/admin/payments" element={<CheckPayments />} />
        <Route path="/admin/advertisers" element={<ManageAdvertisers />} />
        <Route path="/admin/ads" element={<ManageAds />} />

        {/* ================= ADVERTISER ROUTES ================= */}
        <Route path="/advertise" element={<AdvertiseLanding />} />
        <Route path="/advertiser/signup" element={<AdvertiserSignup />} />
        <Route path="/advertiser/login" element={<AdvertiserLogin />} />

        <Route element={<AdvertiserLayout />}>
          <Route path="/advertiser" element={<AdvertiserDashboard />} />
          <Route path="/advertiser/dashboard" element={<AdvertiserDashboard />} />
          <Route path="/advertiser/create-ad" element={<CreateAd />} />
          <Route path="/advertiser/ads/:adId/edit" element={<EditAd />} />
          <Route path="/advertiser/myads" element={<MyAds />} />
          <Route path="/advertiser/profile" element={<AdvertiserProfile />} />
          <Route path="/advertiser/profile/edit" element={<EditAdvertiserProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Footer */}
      {
        !isAdminRoute &&
        !usesLayout &&
        !isAuthPage &&
        !location.pathname.startsWith("/advertiser") &&
        location.pathname !== "/me" &&
        location.pathname !== "/me/edit" && <Footer />
      }
    </>
  );
}

export default App;
