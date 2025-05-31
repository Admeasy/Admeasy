import { useState, useEffect } from 'react'
import '../App.css'
import { motion } from 'framer-motion'
import Section from '../components/About-section'
import GroupPic from '../assets/CollegesImg/Medicap-Road.webp'


const fadeUpVariant = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
}


const About = () => {
  const [stroke, setStroke] = useState()
  const [fSize, setFSize] = useState()
  const [pt, setPt] = useState()
  let width = window.innerWidth

  useEffect(() => {
    if (width >= 1024) {
      setStroke('4px white')
    } else if (width >= 768 && width < 1024) {
      setStroke('3px white')
    } else {
      setStroke('2px white')
    }
  }, [width])

  useEffect(() => {
    if (width >= 1280) {
      setFSize('6rem')
    } else if (width >= 768 && width < 1280) {
      setFSize('4.5rem')
    } else if (width >= 640 && width < 768) {
      setFSize('4rem')
    } else if (width >= 465 && width < 640) {
      setFSize('3rem')
    } else if (width > 385 && width <= 465) {
      setFSize('2.2rem')
    } else {
      setFSize('2rem')
    }
  }, [width])

  useEffect(() => {
    if (width >= 385 && width <= 465) {
      setPt({ paddingTop: '6rem' })
    } else if (width < 385) {
      setPt({ paddingTop: '5.5rem' })
    }
  }, [width])


  return (
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
      <main className='w-full p-[1.5625rem] sm:p-[3.125rem] md:p-25 flex flex-col items-center gap-20'>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">What is Admeasy?</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Admeasy is a peer-powered guidance platform that bridges the gap between aspiring college students and verified undergraduates from a wide range of colleges and universities. We enable one-on-one interactions where seekers can ask real questions and receive honest answers about entrance exams, campus life, academics, placements, and much more. In a space flooded with promotional content and inorganic rankings, Admeasy stands out as a beacon of student-to-student authenticity.<br/><br/>Beyond mentorship, our platform is also evolving into a collaborative hub for educational resources. Students can access and share notes, mock papers, and quizzes, helping each other grow academically. In the near future, we will introduce opportunities for postgraduates and alumni to join the ecosystem, ensuring that the platform remains relevant and valuable at every stage of a student’s academic and professional development.
          </p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Who We Are?</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">We are a dedicated and driven team of students and young professionals who have lived through the complexities and confusion of the Indian college admission landscape. With firsthand experience navigating entrance exams, application hurdles, and the overwhelming sea of misinformation, we recognized a critical gap: the absence of genuine, relatable, and experience-based guidance for college seekers. At Admeasy, we are united by a shared vision—to build a platform that eliminates guesswork from college admissions and replaces it with clarity, authenticity, and real human connection.<br/><br/>Our founding team combines technical expertise, operational insight, and grassroots experience to create a system that is not only scalable but also deeply rooted in the student experience. By connecting aspirants directly with verified undergraduate students from diverse institutions across India, we are redefining how information is accessed and shared during one of the most important transitions in a student’s life. We believe that those who have recently walked the path are best equipped to guide others, and we are committed to creating a trusted ecosystem where peer-to-peer mentorship, shared resources, and transparent communication take center stage.</p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Meet Our Founders</h2>
          <Section>
            <h3 className="w-fit h-fit m-0 p-0 text-xl sm:text-2xl md:text-3xl">Aadesh Panwar – Co-founder & Chief Executive Officer (CEO)</h3>
            <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">As CEO, Aadesh Panwar provides strategic leadership across all major verticals of Admeasy, including institutional networking, funding, and long-term vision execution. With a sharp focus on resource allocation and partnership development, he ensures that the platform scales sustainably while remaining rooted in its student-first philosophy. His hands-on involvement with team coordination and cross-functional operations has been central to translating the founding idea into a functioning and impactful platform. Aadesh’s clarity of mission and ability to align people around a shared goal form the backbone of Admeasy’s momentum and growth.</p>
          </Section>
          <Section>
            <h3 className="w-fit h-fit m-0 p-0 text-xl sm:text-2xl md:text-3xl">Nitish Kumar Yadav – Co-founder & Co-CTO</h3>
            <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Nitish specializes in frontend development and user interface design, creating experiences that are both intuitive and visually compelling. As Co-CTO, he collaborates with Ahsan to ensure seamless communication between the backend systems and the frontend interface. Nitish’s approach focuses on building user experiences that are responsive, accessible, and aligned with the needs of both aspirants and mentors. His deep understanding of user behavior and his ability to translate feedback into functional design play a pivotal role in maintaining Admeasy’s usability and engagement.</p>
          </Section>
          <Section>
            <h3 className="w-fit h-fit m-0 p-0 text-xl sm:text-2xl md:text-3xl">Ahsan – Co-founder, Co-CTO & Chief Development Officer (CDO)</h3>
            <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">As CEO, Aadesh Panwar provides strategic leadership across all major verticals of Admeasy, including institutional networking, funding, and long-term vision execution. With a sharp focus on resource allocation and partnership development, he ensures that the platform scales sustainably while remaining rooted in its student-first philosophy. His hands-on involvement with team coordination and cross-functional operations has been central to translating the founding idea into a functioning and impactful platform. Aadesh’s clarity of mission and ability to align people around a shared goal form the backbone of Admeasy’s momentum and growth.</p>
          </Section>
          <Section>
            <h3 className="w-fit h-fit m-0 p-0 text-xl sm:text-2xl md:text-3xl">Divya – Co-founder & Chief Operating Officer (COO)</h3>
            <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Divya oversees Admeasy’s non-technical operations with a sharp focus on execution, partnerships, and brand logistics. From college collaborations and outreach campaigns to print materials and internal processes, he ensures that everything runs smoothly behind the scenes. As COO, Divya coordinates between cross-functional teams to keep workflows aligned with overall business objectives. His work strengthens the real-world presence of Admeasy and ensures that both the platform and the people behind it are prepared for long-term growth and external engagement.</p>
          </Section>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Our Mission & Vision</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">At Admeasy, we envision a future where every student in India has access to honest, peer-driven support throughout their academic journey. Our goal is to become the country’s most reliable and student-centric admission support network—one that fosters a culture of collaboration, empowerment, and trust. We are working to ensure that decisions about one’s future are not influenced by marketing noise or outdated information, but by authentic student experiences and well-informed guidance.<br/><br/>By empowering undergraduates to share their stories and support those following in their footsteps, we are building more than just a platform—we are nurturing a nationwide community where learning, mentoring, and belonging go hand in hand. Our long-term vision includes expanding beyond undergraduate admissions to support students at every stage—from entrance preparation to alumni networking—providing lifelong value rooted in student solidarity.</p>
        </Section>
      </main>
    </div>
  )
}

export default About