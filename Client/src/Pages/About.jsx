import React from 'react'
import Boy from '../assets/Others/About_boy.webp'


const About = () => {
  return (
    <div className='w-full h-full'>
      <header id="hero" className='w-full h-3/10 md:h-4/10 bg-[url("./assets/CollegesImg/college-bg.webp")] bg-no-repeat bg-center bg-cover'>
        <div id="hero-shade" className='w-full h-full flex items-center justify-evenly md:justify-center md:gap-25 lg:gap-50 xl:gap-75 shade'>
          <h1 className='text-4xl sm:text-6xl md:text-7xl text-white text-center'>About Us</h1>
          <img src={Boy} className='h-full' />
        </div>
      </header>
      <main className='w-full p-[1.5625rem] sm:p-[3.125rem] md:p-25 shadow-[0_-5px_10px_#000000] flex flex-col items-center gap-20'>
        <section className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]">
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Who We Are?</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </section>
        <section className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]">
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Meet Our Founders</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </section>
        <section className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]">
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">What is Admeasy</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </section>
        <section className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]">
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Our Mission</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </section>
        <section className="p-5 md:p-10 text-center flex flex-col items-center gap-5 sm:gap-10  border-[0.25px] border-white rounded-4xl shadow-[2px_3px_15px_#00000079]">
          <h2 className="w-fit h-fit m-0 p-0 text-2xl sm:text-3xl md:text-4xl font-semibold">Our Vision</h2>
          <p className="w-fit h-fit m-0 p-0 text-lg sm:text-xl md:text-2xl">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut molestias at perferendis eaque maxime fugit, voluptates sapiente necessitatibus ipsa ipsum odio error illo repudiandae? Sequi perferendis quisquam commodi fugit quasi expedita omnis molestiae debitis tempora officia, ducimus corporis adipisci explicabo quidem magnam maxime provident aperiam dolor rem voluptas suscipit porro quae eaque? Autem labore harum nemo officiis odio? Eius aut possimus, incidunt quos numquam consequuntur deleniti odit odio cumque accusamus non quibusdam. Magnam, blanditiis mollitia.</p>
        </section>
      </main>
    </div>
  )
}

export default About