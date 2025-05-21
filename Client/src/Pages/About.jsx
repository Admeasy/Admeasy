import React, { useState, useEffect } from 'react'
import '../App.css'
import Section from '../components/About-section'
import GroupPic from '../assets/CollegesImg/Medicap-Road.webp'


const About = () => {
  const [stroke, setStroke] = useState({})
  let width = window.innerWidth

  useEffect(() => {
    if (width >= 1024) {
      setStroke({ WebkitTextStroke: '6px white' })
    } else if (width >= 768 && width < 1024) {
      setStroke({ WebkitTextStroke: '4px white' })
    } else {
      setStroke({ WebkitTextStroke: '2px white' })
    }
  }, [width])

  return (
    <div className='w-full h-full'>
      <header id="hero" className='w-full h-fit m-auto p-8 lg:p-12 pt-[5.375rem] lg:pt-28 text-center relative'>
        <h1 className='h-about text-4xl sm:text-6xl xl:text-[8rem] m-0 p-0 tracking-wide  lg:tracking-widest z-5 absolute top-16 lg:top-10 left-1/2 transform -translate-x-1/2'>About Us</h1>
        <img src={GroupPic} className='w-full md:w-8/10 lg:w-7/10 xl:w-6/10 m-auto relative z-10 rounded-4xl' />
        <h1 className='h-about text-4xl sm:text-6xl xl:text-[8rem] m-0 p-0 text-transparent tracking-wide lg:tracking-widest z-15 absolute top-16 lg:top-10 left-1/2 transform -translate-x-1/2' style={stroke}>About Us</h1>
      </header>
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