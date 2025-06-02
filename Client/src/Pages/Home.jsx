import { useEffect } from 'react'
import FrontHome from '../HomeComponents/FrontHome'
import CollegeCard from '../HomeComponents/CollegeCard'
import Features from '../HomeComponents/Features'
import FAQ from '../HomeComponents/FAQ'


const Home = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

return (
  <>
    <FrontHome />
    <Features />
    <FAQ />
    <CollegeCard />
  </>
)
}

export default Home