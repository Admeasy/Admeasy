import FrontHome from '../HomeComponents/FrontHome'
import CollegeCard from '../HomeComponents/CollegeCard'
import Features from '../components/Features'
import FAQ from '../HomeComponents/FAQ'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
const Home = () => {
   const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash
        const element = document.querySelector(id);
        element?.scrollIntoView();
      }, 0);
    }
  }, [location]);

  return (
    <>
    <div className='bg-[#F2F4F8] mx-auto max-w-screen-xl sm:px-6 lg:px-8'>
   <FrontHome/>
   <Features/>
   <FAQ/>
   <CollegeCard/>
   </div>
    </>
   
  )
}

export default Home