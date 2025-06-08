import FrontHome from '../HomeComponents/FrontHome'
import CollegeCard from '../HomeComponents/CollegeCard'
import Features from '../HomeComponents/Features'
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
    <main>
      <FrontHome />
      <Features />
      <FAQ />
      <CollegeCard />
    </main>

  )
}

export default Home