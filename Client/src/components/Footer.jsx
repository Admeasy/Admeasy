import { useState } from 'react'
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoLinkedin, IoLogoWhatsapp } from "react-icons/io";
import logo from '../assets/Admeasy/LOGO.webp'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


const Footer = () => {
  // Define Position
  const notify = () => toast("Message Sent Buddy 😎! Thanks for your showing your interest....");
  const [form, setForm] = useState({
    email: '',
    msg: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.email === "") {
      toast.error("Awwww! Buddy! We need your Email for contacting you! 🫤")
    }

    if (form.msg === "") {
      toast.error("We want to hear from you?! Drop your message in the field.... 🫠");
    }

    const data = JSON.stringify({ email: form.email, msg: form.msg });
    console.log(data);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data
      });

      if (res.ok) {
        notify();
      } else {
        toast.error('Ugghhh! Failed to send message. 😫');
        console.log(res.json());
      }
    } catch (err) {
      toast.error('Ahhh! An Error Occurred... 😑')
    }
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
                  Your feedback matters.
                  Suggestions, questions, or comments — we’re listening.
                  Drop us a message anytime.
                </p>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-3 lg:flex lg:items-end">
              <form onSubmit={handleSubmit} className="w-fit mx-auto border border-gray-100 p-2 sm:flex sm:flex-col sm:items-center space-y-4 sm:space-y-0 sm:gap-4 dark:border-gray-800">
                <input
                  value={form.email}
                  onChange={handleChange}
                  name='email'
                  type="email"
                  id="email"
                  placeholder="Enter Your Email"
                  className="w-full sm:w-100 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm placeholder-gray-400  dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
                <textarea
                  value={form.msg}
                  onChange={handleChange}
                  name='msg'
                  id="message"
                  placeholder="Send Your Message"
                  className="w-full sm:w-100 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm placeholder-gray-400  dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"></textarea>
                <button type='submit' className="cursor-pointer transition-all bg-blue-500 text-white px-4 py-1.5 rounded-lg border-blue-600 w-full mt-0 sm:w-max border-b-[4px] hover:brightness-110 hover:-translate-zy-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                  Send
                </button>
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


            {/* Social/proffesional Links In foooter */}
            <ul className="col-span-2 flex justify-start gap-6 lg:col-span-5 lg:justify-end">
              {/* Instagram */}
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
                  <IoLogoLinkedin className='size-6' />
                </a>
              </li>
              {/* Twitter (Yeah I'll call it twitter(MuskMelon😏)) */}
              <li>
                <a
                  href="https://x.com/admeasy_in?s=08"
                  rel="noreferrer"
                  target="_blank"
                  aria-label='X/Twitter'
                  className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
                >
                  <FaXTwitter className="size-6" />
                </a>
              </li>
              {/* Github */}
              <li>
                <a
                  href="https://instagram.com/admeasy.in"
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
              &copy; 2025. Admeasy Admission Solutions Private Limited. All Rights Reserved.
            </p>

            <ul className="mt-8 flex flex-wrap justify-start gap-4 text-xs sm:mt-0 lg:justify-end">
              <li>
                <Link
                  onClick={handleClick("/t&c")}
                  to={'/t&c'}
                  title='Terms & Conditions Of Admeasy' className="text-gray-500 transition hover:opacity-75 dark:text-gray-400">Terms & Conditions</Link>
              </li>

              <li>
                <Link title='View Our Privacy & Policies' className="text-gray-500 transition hover:opacity-75 dark:text-gray-400" onClick={handleClick("/policies")} to={'/policies'} >Privacy & Policy</Link>
              </li>

              <li>
                <Link
                  to="/policies#Cookies"
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