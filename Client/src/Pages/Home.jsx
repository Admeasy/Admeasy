import FrontHome from '../HomeComponents/FrontHome'
import CollegeCard from '../HomeComponents/CollegeCard'
import Features from '../HomeComponents/Features'
import FAQ from '../HomeComponents/FAQ'


const Home = () => {

  document.addEventListener('onload', () => {
    window.scrollTo(0, 0)
  })

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