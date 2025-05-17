// It is the component of Home page
import SearchLogo from '../assets/Others/Search-logo.webp'
const FrontHome = () => {
  return (
    <div>
      {/* Background image Div */}
      <div className="bg h-3/6">
        <div className="bgshadefronthome h-3/6">

          {/* Main div*/}
          <div className="home-main flex justify-center items-center">

            {/* div for background */}
            <div className='bg-shade w-full'>
              {/* Div of finding colleges in indore */}
              <div id='college-contain' className="flex flex-col text-center justify-center w-full md:w-1/2 xl:gap-5 gap-4 sm:gap-8 lg:gap-6">
                <h1 id='CollegeHeading' className='xl:text-7xl lg:text-6xl text-2xl sm:text-3xl md:text-4xl font-bold text-white'>
                  Find the <span className="text-orange-400">Best</span><br />
                  <span className="text-orange-400">College</span> in INDORE</h1>
                <p id='college-para' className='text-[14px] md:text-[18px] text-gray-300'>Discover top-rated colleges near you and connect with alumni to make the right choice for your future.</p>
                <div className="college-search  flex items-center w-full flex-row">
                  {/* <i className="fa-solid fa-magnifying-glass text-[12px] lg:text-[16px] xl:text-[17px] absolute opacity-50" style={{padding:"15px"}}></i> */}
                  <input className='md:pl-6 outline-0 bg-white rounded-3xl h-12 w-full placeholder:text-gray-800 text-[12px] sm:text-[14px] lg:text-[18px]' type="text" placeholder='Search Best B.Tech colleges near me...' />
                  <button className='text-[12px] lg:text-[16px] xl:text-[17px] absolute right-8 w-10'><img src={SearchLogo} /></button>
                </div>
              </div>
              {/* girl-bg */}
              <div className="girl-bg md:h-100 md:w-96"></div>
            </div>
            {/* Front Page */}
          </div>
        </div>{/* Background img div ends here*/}

      </div>
    </div>
  )
}

export default FrontHome