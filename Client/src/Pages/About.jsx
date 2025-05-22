import React, { useState, useEffect } from 'react'
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
      setFSize('2.5rem')
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
        <h1 className='h-about text-[2.5rem] sm:text-[4rem] md:text-7xl xl:text-8xl m-0 p-0 tracking-wide  lg:tracking-widest z-5 absolute top-16 lg:top-11 left-1/2 transform -translate-x-1/2' style={{ fontSize: fSize }}>About Us</h1>
        <img src={GroupPic} className='w-full md:w-8/10 lg:w-7/10 xl:w-6/10 m-auto relative z-10 rounded-4xl' />
        <h1 className='h-about text-[2.5rem] sm:text-[4rem] md:text-7xl xl:text-8xl m-0 p-0 text-transparent tracking-wide lg:tracking-widest z-15 absolute top-16 lg:top-11 left-1/2 transform -translate-x-1/2' style={{ WebkitTextStroke: stroke, fontSize: fSize }}>About Us</h1>
      </motion.header>
      <main className='w-full p-[1.5625rem] sm:p-[3.125rem] md:p-25 flex flex-col items-center gap-20'>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Who We Are?</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Meet Our Founders</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">What is Admeasy?</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Our Mission</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </Section>
        <Section>
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Our Vision</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </Section>
      </main>
    </div>
  )
}

export default About