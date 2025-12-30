import FrontHome from '../HomeComponents/FrontHome'
import CollegeCard from '../HomeComponents/CollegeCard'
import Features from '../HomeComponents/Features'
import CollabBanner from '../components/CollabBanner'
import FAQ from '../HomeComponents/FAQ'
import BlogSwiper from '../HomeComponents/BlogsSwiper'
import StudentSwiper from '../HomeComponents/StudentSwiper'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import SEO from '../components/SEO'

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

  // Add structured data for homepage
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Admeasy",
      "url": "https://admeasy.in",
      "description": "Discover top colleges in India, connect with verified mentors, and access premium study notes. Your complete guide to college admissions and academic success.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://admeasy.in/colleges?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <main className="w-full min-h-screen overflow-x-hidden max-w-full">
      <SEO
        title="Admeasy - Find Your Dream College | Connect with Mentors | Study Notes"
        description="Discover top colleges in India, connect with verified mentors, and access premium study notes. Your complete guide to college admissions and academic success."
        keywords="colleges in India, college admissions, mentors, study notes, education, IIT, IIM, DU colleges, engineering colleges, medical colleges, college search"
        url="https://admeasy.in"
      />
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="w-full">
          <FrontHome />
        </div>
        <div className="w-full">
          <StudentSwiper/>
        </div>
        <div className="w-full">
          <CollabBanner/>
        </div>
        <div className="w-full">
          <CollegeCard />
        </div>
        <div className="w-full">
          <BlogSwiper/>
        </div>
        <div className="w-full">
          <Features />
        </div>
        <div className="w-full">
          <FAQ />
        </div>
      </div>
    </main>

  )
}

export default Home