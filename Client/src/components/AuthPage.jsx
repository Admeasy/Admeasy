import { useState, useEffect } from 'react';
import MentorPortal from '../Pages/MentorsLogin';
import Signup from '../Pages/SignUp';
import LogInComp from '../Pages/LogInComp';
import SEO from '../components/SEO';
import EmailVerificationModal from '../components/EmailVerificationModal';


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'mentor'
  const [authMode, setAuthMode] = useState('login'); // 'signup' or 'login' (for students only)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNotVerified = (email) => {
    setUserEmail(email);
    setShowVerifyModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 p-6 relative overflow-x-hidden">
      <SEO title="Log into Admeasy | Admeasy" description="Log into Admeasy or Create a new account." keywords="Admeasy, Log in, Sign up, Student, Mentor" author="Admeasy" url="https://admeasy.in/login" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-brand-light/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="max-w-md mx-auto relative z-10 pt-8">
        {/* Tab Switcher */}
        <div className="flex justify-center gap-3 mb-2">
          <button
            onClick={() => {
              setActiveTab('student');
              setAuthMode('login');
            }}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${activeTab === 'student'
              ? 'bg-brand-light text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            Student
          </button>
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${activeTab === 'mentor'
              ? 'bg-purple-900 text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            Mentor
          </button>
        </div>

        {/* Content */}
        {activeTab === 'student' ? (
          authMode === 'signup' ? (
            <Signup setAuthMode={setAuthMode} />
          ) : (
            <LogInComp setAuthMode={setAuthMode} onNotVerified={handleNotVerified} />
          )
        ) : (
          <MentorPortal />
        )}
      </div>

      {/* Email Verification Pop-up */}
      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={userEmail}
      />
    </div>
  );
};
export default AuthPage;