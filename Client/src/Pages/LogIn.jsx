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
import SignUp from './SignUp'
import World from "../assets/Icons/World.gif"
const LogIn = () => {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(true)
  const isMobile = window.innerWidth <1024
  const pathname = useLocation();
  useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return (
        <>

   <div className="flex justify-center gap-7 md:gap-0 z-20 flex-col lg:flex-row p-6">
  {/* Left Side - Login */}
  <div className=" w-full lg:w-1/3 flex">
{showLogin ?(
  <LogInComp setShowLogin={setShowLogin} showLogin={showLogin} />
  ):(
      <SignUp setShowLogin={setShowLogin} showLogin={showLogin} />
      )}

  </div>
  {/* Right Side - Hero */}
  <div className="w-full lg:w-[60%]">
    <div className="cursor-grab active:cursor-grabbing relative overflow-hidden min-h-[400px] md:min-h-[500px] w-full bg-black rounded-2xl shadow-xl">
  {isMobile ? (
   <div style={{ width: '100%', height: '600px', position: 'relative' }}>
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