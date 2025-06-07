import { useState, useEffect } from 'react'
import '../App.css'
import { motion } from 'framer-motion'
import Section from '../components/About-section'
import GroupPic from '../assets/CollegesImg/Medicap-Road.webp'
import { useLocation } from 'react-router-dom'
const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}

const About = () => {
     const location = useLocation();
useEffect(() => {

    if (location.hash) {
      // Wait for DOM to render
      setTimeout(() => {
        const sectionId = location.hash.replace('#', '');
        const element = document.getElementById(sectionId);
        if (element) {
          element?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0); // 0ms delay ensures DOM is ready
    }
  }, [location]);



  const [stroke, setStroke] = useState('2px white')
  const [fSize, setFSize] = useState('2rem')
  const [pt, setPt] = useState({ paddingTop: '5.5rem' })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setStroke('4px white')
      } else if (width >= 768) {
        setStroke('3px white')
      } else {
        setStroke('2px white')
      }

      if (width >= 1280) setFSize('6rem')
      else if (width >= 768) setFSize('4.5rem')
      else if (width >= 640) setFSize('4rem')
      else if (width >= 465) setFSize('3rem')
      else if (width > 385) setFSize('2.2rem')
      else setFSize('2rem')

      if (width >= 385) setPt({ paddingTop: '6rem' })
      else setPt({ paddingTop: '5.5rem' })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

   const teamMembers = [
    {
      emoji: '🧠',
      name: 'Aadesh Panwar',
      title: 'Founder & CEO',
      description: 'Manages college partnerships and overall legal operations.',
    },
    {
      emoji: '🎨',
      name: 'Nitish Kr. Yadav',
      title: 'Co-founder & Co-CTO',
      description: 'Frontend expert, UI designer, and student outreach strategist.',
    },
    {
      emoji: '🛠️',
      name: 'Mohd. Ahsan',
      title: 'Co-founder & Co-CTO',
      description: 'Backend developer, R&D lead, and platform architect.',
    },
    {
      emoji: '📋',
      name: 'Divya Yadav',
      title: 'Co-founder & COO',
      description: 'Keeps our day-to-day execution smooth and efficient.',
    },
  ];
  return (
    <>
    
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8 w-full min-h-screen bg-[#F2F4F8]">
      {/* Header Section */}
      <div className='w-full h-full'>
      <motion.header
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="w-full h-fit m-auto p-8 sm:p-12 pt-[6.25rem] sm:pt-[7rem] md:pt-[6.5rem] lg:pt-20 xl:pt-24 text-center relative" style={pt}>
        <h1 className='h-about text-[2.2rem] sm:text-[4rem] md:text-7xl xl:text-8xl m-0 p-0 tracking-wide  lg:tracking-widest z-5 absolute top-16 lg:top-11 left-1/2 transform -translate-x-1/2' style={{ fontSize: fSize }}>About Us</h1>
        <img src={GroupPic} className='w-full md:w-8/10 lg:w-7/10 xl:w-6/10 m-auto relative z-10 rounded-4xl' />
        <h1 className='text-[2.5rem] sm:text-[4rem] md:text-7xl xl:text-8xl m-0 p-0 text-transparent tracking-wide lg:tracking-widest z-15 absolute top-16 lg:top-11 left-1/2 transform -translate-x-1/2' style={{ WebkitTextStroke: stroke, fontSize: fSize }}>About Us</h1>
      </motion.header>
      </div>
      {/* Main Sections */}
      <main className="w-full px-6 sm:px-12 lg:px-28 py-10 flex flex-col items-center gap-10 md:gap-20 relative z-40 bg-[#F2F4F8]">
        <Section>
          <h2 className="text-2xl md:text-4xl font-semibold">What is Admeasy?</h2>
          <p className="text-[12px] md:text-2xl text-gray-700 px-4">
          Admeasy is a student-driven educational startup based in Indore, India, operating under the motto
          <strong> "Made for Students, By Students".</strong> We focus on enhancing the academic experience by providing
          tailored solutions and resources for students. With a small, dedicated team, we aim to bridge gaps in the
          higher education sector through innovation and student-centric services.

          </p>
        </Section>
        <div  id='who-We-Are'>
        <Section>
          <h2 className="text-2xl md:text-4xl font-semibold">Who We Are?</h2>
          <p className="text-[12px] md:text-2xl text-gray-700 px-4">
 At <strong>Admeasy</strong>, we’re not just another college admission platform — we’re a solution born from frustration.
It all started when our founder, <strong> Aadesh Panwar</strong>, completed school and began his college search. Instead of clarity, he found chaos: too many options, too little guidance, and worst of all — endless spam calls after signing up on "big" admission websites that sold his personal data to colleges.
That’s when the idea for Admeasy was born — a platform that connects students with the right colleges <strong> without compromising their privacy</strong>.
          </p>
        </Section>
        </div>
       <div id='Team'>
       <Section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-10 flex justify-center items-center gap-2">
          <span role="img" aria-label="developer">👨‍💻</span>
          Meet Our Team
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {teamMembers.map((member, index) => (
            <div key={index}
              className="flex flex-col bg-white p-3 md:gap-2 rounded-2xl shadow hover:shadow-md w-full sm:w-[45%] lg:w-[22%] transition">
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 flex items-center gap-1 mb-1">
                <span>{member.emoji}</span> {member.name}
              </h3>
              <p className="text-sm text-indigo-600 font-medium mb-2">{member.title}</p>
              <p className="text-gray-700 text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
    </div>
         <Section className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-1xl md:text-4xl font-bold tracking-tight text-gray-900 mb-6 flex items-center justify-center gap-2">
          <span role="img" aria-label="lock">🔐</span> 
          What Makes Us Different
        </h2>
        <ul className="text-[15px] md:text-2xl text-gray-700 space-y-4 text-left">
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-semibold">✔</span>
            <span><strong>We never sell your data</strong> — ever.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-semibold">✔</span>
            <span><strong>No spam calls or annoying emails</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-semibold">✔</span>
            <span><strong>Built by students, for students</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-semibold">✔</span>
            <span><strong>Privacy and transparency first</strong> — always.</span>
          </li>
        </ul>
      </div>
    </Section>
        <Section>
          <h2 className="text-2xl md:text-4xl font-semibold">Our Vision</h2>
          <p className="text-[14px] md:text-xl lg:text-2xl text-gray-700 px-16">
            We’re currently focused on expanding our college network — especially from top institutions like <strong> Delhi University</strong> — so students across India get access to opportunities they deserve.
          </p>
        </Section>
      </main>
    </div>
    </>
  )
}

export default About
