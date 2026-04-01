import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Prism from '../components/Prism'
import LogInComp from './LogInComp'
import MobileBg from "../assets/Others/login-mb-bg.webp"
import Ballpit from '../components/Ballpit'
import Guide from "../assets/Icons/guide.gif"
import Mentor from "../assets/Icons/Mentor.gif"
import SignUp from './SignUp.jsx'
import World from "../assets/Icons/world.gif"
import { toast } from 'react-toastify'
const LogIn = () => {
  const navigate = useNavigate()
  /** true = show SignUp, false = show LogInComp (legacy page layout). */
  const [showLogin, setShowLogin] = useState(true)
  const setAuthMode = (mode) => {
    if (mode === 'signup') setShowLogin(true)
    else if (mode === 'login') setShowLogin(false)
  }
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const pathname = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Handle OAuth errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'google_auth_failed') {
      toast.error('Google authentication failed. Please try again.');
      // Remove error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  return (
    <>

      <div className="flex justify-center gap-4 md:gap-0 z-20 flex-col lg:flex-row p-4 lg:p-6">
        {/* Left Side - Login */}
        <div className=" w-full lg:w-1/3 flex">
          {showLogin ? (
            <SignUp setAuthMode={setAuthMode} />
          ) : (
            <LogInComp setAuthMode={setAuthMode} />
          )}

        </div>
        {/* Right Side - Hero */}
        <div className="w-full lg:w-[60%]">
          <div className="relative overflow-hidden bg-black rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10 min-h-[625px]">
            {isMobile ? (
              <div className="w-full h-[380px] xs:h-[420px] sm:h-[480px] relative">
                <Prism
                  animationType="rotate"
                  timeScale={0.9}
                  height={3.5}
                  baseWidth={2.5}
                  scale={4}
                  hueShift={0.1}
                  colorFrequency={1}
                  noise={0.1}
                  glow={0.8}
                />
              </div>
            ) : (
              <Ballpit
                count={70}
                gravity={0.4}
                friction={1}
                wallBounce={0.95}
                followCursor={false}
              />
            )}
            {/* Background */}

            {/* Foreground */}
            <div className="z-10 absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12 text-center">
              {/* Heading */}
              <h1 className="text-[18px] sm:text-2xl lg:text-4xl font-admeasy-bold text-white drop-shadow-md select-none leading-snug max-w-3xl">
                Find clarity in your college journey with real stories, real
                experiences, and mentors who care.
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2">
                <div className="flex items-center gap-2 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl shadow-lg px-4 py-2 sm:px-5 sm:py-3">
                  <img src={Guide} draggable='false' alt="Guided" className="select-none w-5 sm:w-6 shrink-0" />
                  <p className="text-[12px] sm:text-base font-admeasy-bold text-white select-none">
                    150+ Students Guided
                  </p>
                </div>

                <div className="flex items-center gap-2 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl shadow-lg px-4 py-2 sm:px-5 sm:py-3">
                  <img src={Mentor} draggable='false' alt="Mentors" className="select-none w-5 sm:w-6 shrink-0" />
                  <p className="text-[12px] sm:text-base font-admeasy-bold text-white select-none">
                    100+ Mentors Onboard
                  </p>
                </div>

                <div className="flex items-center gap-2 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl shadow-lg px-4 py-2 sm:px-5 sm:py-3">
                  <img src={World} draggable='false' alt="World" className="select-none w-5 sm:w-6 shrink-0" />
                  <p className="text-[12px] sm:text-base font-admeasy-bold text-white select-none">
                    Trusted by Students Across India
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-2 backdrop-blur-md bg-white/20 border border-white/30 sm:px-4 p-2 sm:py-3 rounded-2xl w-full max-w-lg">
                <h2 className="text-[16px] sm:text-xl lg:text-2xl font-admeasy-bold text-gray-200 drop-shadow-md mb-2 select-none">
                  Want to Guide Students? Become a Mentor Now!
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/careers/mentorship/apply")}
                  className="w-full sm:w-auto font-admeasy-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-2 sm:px-6 sm:py-3 shadow-lg hover:scale-105 transition-transform duration-200 select-none"
                >
                  Become Mentor
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </>
  )
}

export default LogIn
