import { useState, useEffect } from 'react';
import MentorPortal from '../Pages/MentorsLogin';
import Signup from '../Pages/SignUp';
import LogInComp from '../Pages/LogInComp';
import SEO from '../components/SEO';


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'mentor'
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login' (for students only)

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mt-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <SEO title="Log into Admeasy | Admeasy" description="Log into Admeasy or Create a new account." keywords="Admeasy, Log in, Sign up, Student, Mentor" author="Admeasy" url="https://admeasy.in/login" />
      <div className="max-w-md mx-auto">
        {/* Tab Switcher */}
        <div className="flex justify-center gap-3 mb-2">
          <button
            onClick={() => {
              setActiveTab('student');
              setAuthMode('signup');
            }}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
              activeTab === 'student'
                ? 'bg-blue-900 text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
              activeTab === 'mentor'
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
            <LogInComp setAuthMode={setAuthMode} />
          )
        ) : (
          <MentorPortal />
        )}
      </div>
    </div>
  );
};
export default AuthPage;