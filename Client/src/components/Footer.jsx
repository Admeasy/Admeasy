import { useState } from 'react'
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoLinkedin, IoLogoWhatsapp } from "react-icons/io";
import logo from '../assets/Admeasy/LOGO.webp'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


const Footer = () => {
  const notify = () => toast("Message Sent Buddy😎!");
  const toastErr = () => toast.error("Message cannot be empty, bro😅!");
  const [message, setMessage] = useState(""); // 1️⃣ Fix typo

  const InputHandler = (e) => {
    setMessage(e.target.value); // 2️⃣ Match the corrected state name
  };

  const FormHandler = (e) => {
    e.preventDefault();
    
    if (message.trim() === "") {
      toastErr();
      return;
    }

    notify();
    setMessage(""); // 3️⃣ Reset input after success
  };
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (targetPath) => (e) => {
    if (location.pathname === targetPath) {
      // Already on the target page — scroll to top
      e.preventDefault(); // Prevent re-navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // else: React Router <Link> will handle the route change
  };

  return (
    <footer className="mt-25 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:gap-8">
          <div className="text-teal-600 dark:text-teal-300">
            <img src={logo} className='md:w-80 lg:w-120  w-50' draggable='false' alt={logo} />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 lg:mt-0 lg:grid-cols-5 lg:gap-y-16">
            <div className="col-span-2">
              <div>
                <h2 className="text-2xl font-admeasy-extrabold text-gray-900 dark:text-white ">Got something on your mind?!</h2>

                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Whether it’s feedback, a suggestion, or just a quick “hello” — we’re all ears!
                  Drop your message and let’s keep the conversation going. 🚀
                </p>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-3 lg:flex lg:items-end">
              <form onSubmit={FormHandler} className="w-full">

                <div
                  className="border border-gray-100 p-2 sm:flex sm:items-center sm:gap-4 dark:border-gray-800"
                >
                  <input
                    value={message}
                    onChange={InputHandler}
                    name='msg'

                    type="text"
                    id="message"
                    placeholder="Send Your Message"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm placeholder-gray-400  dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                  />
                  <button type='submit' className="cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg
border-blue-600 w-full mt-5 sm:mt-0 sm:w-max
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                    Send
                  </button>
                  <ToastContainer />
                </div>
              </form>
            </div>

            {/* <div className="col-span-2 sm:col-span-1">
              <p className="font-medium text-gray-900 dark:text-white">Services</p>

              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    1on1 Coaching
                  </a>
                </li>

                <li>
                  <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    Company Review
                  </a>
                </li>

                <li>
                  <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    Accounts Review
                  </a>
                </li>

                <li>
                  <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    HR Consulting
                  </a>
                </li>

                <li>
                  <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    SEO Optimisation
                  </a>
                </li>
              </ul>
            </div> */}

            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium text-gray-900 dark:text-white">Company</p>

              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <Link onClick={handleClick("/About")} to="/About" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    About
                  </Link>
                </li>

                <li>
                  <Link to="/About#Team" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    Meet the Team
                  </Link>
                </li>

                <li>
                  <Link to="/About#who-We-Are" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    Who We Are?
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium text-gray-900 dark:text-white">Helpful Links</p>

              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <a href="/contact" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    Contact
                  </a>
                </li>

                <li>
                  <Link to="/#FAQ" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                    FAQs
                  </Link>
                </li>
                {/* 
            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Live Chat
              </a>
            </li> */}
              </ul>
            </div>
            {/* 
        <div className="col-span-2 sm:col-span-1">
          <p className="font-medium text-gray-900 dark:text-white">Legal</p>

          <ul className="mt-6 space-y-4 text-sm">
            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Accessibility
              </a>
            </li>

            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Returns Policy
              </a>
            </li>

            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Refund Policy
              </a>
            </li>

            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Hiring-3 Statistics
              </a>
            </li>
          </ul>
        </div> */}
            {/* 
        <div className="col-span-2 sm:col-span-1">
          <p className="font-medium text-gray-900 dark:text-white">Downloads</p>

          <ul className="mt-6 space-y-4 text-sm">
            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                Marketing Calendar
              </a>
            </li>

            <li>
              <a href="#" className="text-gray-700 transition hover:opacity-75 dark:text-gray-200">
                SEO Infographics
              </a>
            </li>
          </ul>
        </div> */}

            <ul className="col-span-2 flex justify-start gap-6 lg:col-span-5 lg:justify-end">
              <li>
                <a
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                  aria-label='Facebook'
                  className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
                >
                  <FaFacebook className="size-6" />
                </a>
              </li>

              <li>
                <a
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                  aria-label='LinkedIn'
                  className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
                >
                  <IoLogoLinkedin className='size-6'/>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                  aria-label='X/Twitter'
                  className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
                >
                  <FaXTwitter className="size-6" />
                </a>
              </li>

              <li>
                <a
                  href="#"
                  rel="noreferrer"
                  target="_blank"
                  aria-label='Instagram'
                  className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
                >
                  <FaInstagram className="size-6" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; 2025. Campii Addmission solution LLP. All rights reserved.
            </p>

            <ul className="mt-8 flex flex-wrap justify-start gap-4 text-xs sm:mt-0 lg:justify-end">
              <li>
                <Link
                  onClick={handleClick("/Terms")}
                  to={'/Terms'}
                  title='Terms & Conditions Of Admeasy' className="text-gray-500 transition hover:opacity-75 dark:text-gray-400">Terms & Conditions</Link>
              </li>

              <li>
                <Link title='View Our Privacy & Policies' className="text-gray-500 transition hover:opacity-75 dark:text-gray-400" onClick={handleClick("/Policies")} to={'/Policies'} >Privacy & Policy</Link>
              </li>

              <li>
                <Link
                  to="/Policies#Cookies"
                  className="text-gray-500 transition hover:opacity-75 dark:text-gray-400">
                  Cookies
                </Link>
              </li>

            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer