import React from 'react'
import { FaLinkedin } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import logo from '../assets/Admeasy/LOGO.webp'
const Footer = () => {
  return (
   <footer className="px-4 divide-y border-t-[1px] border-black mt-5 dark:bg-gray-100 dark:text-gray-800">
	<div className="container flex flex-col justify-between py-10 mx-auto space-y-8 lg:flex-row lg:space-y-0">
		<div className="lg:w-1/3">
			<a rel="noopener noreferrer" href="#" className="flex justify-center space-x-3 lg:justify-start">
				
				<span className="self-center text-2xl font-semibold"> <img draggable='false' className='w-50' src={logo} alt="logo" /></span>
			</a>
		</div>
		<div className="grid grid-cols-2 text-sm gap-x-3 gap-y-8 lg:w-2/3 sm:grid-cols-4">
			<div className="space-y-3">
				<h3 className="tracking-wide uppercase dark:text-gray-900">Product</h3>
				<ul className="space-y-1">
					<li>
						<a rel="noopener noreferrer" href="#">Features</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">Integrations</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">Pricing</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">FAQ</a>
					</li>
				</ul>
			</div>
			<div className="space-y-3">
				<h3 className="tracking-wide uppercase dark:text-gray-900">Company</h3>
				<ul className="space-y-1">
					<li>
						<a rel="noopener noreferrer" href="#">Privacy</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">Terms of Service</a>
					</li>
				</ul>
			</div>
			<div className="space-y-3">
				<h3 className="uppercase dark:text-gray-900">Developers</h3>
				<ul className="space-y-1">
					<li>
						<a rel="noopener noreferrer" href="#">Public API</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">Documentation</a>
					</li>
					<li>
						<a rel="noopener noreferrer" href="#">Guides</a>
					</li>
				</ul>
			</div>
			<div className="space-y-3">
				<div className="uppercase dark:text-gray-900">Social media</div>
				<div className="flex justify-start space-x-3">
					<a rel="noopener noreferrer" href="#" title="Facebook" className="flex items-center p-1">
						<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" className="w-5 h-5 fill-current">
							<path d="M32 16c0-8.839-7.167-16-16-16-8.839 0-16 7.161-16 16 0 7.984 5.849 14.604 13.5 15.803v-11.177h-4.063v-4.625h4.063v-3.527c0-4.009 2.385-6.223 6.041-6.223 1.751 0 3.584 0.312 3.584 0.312v3.937h-2.021c-1.984 0-2.604 1.235-2.604 2.5v3h4.437l-0.713 4.625h-3.724v11.177c7.645-1.199 13.5-7.819 13.5-15.803z"></path>
						</svg>
					</a>
					<a rel="noopener noreferrer" href="https://www.linkedin.com/company/admeasy-in/" title="LinkedIn" className="flex items-center text-2xl p-1">
						<FaLinkedin />
					</a>
					<a rel="noopener noreferrer" href="https://wa.me/+919410451807" title="Instagram" className="flex text-2xl items-center p-1">
					<IoLogoWhatsapp />
					</a>
				</div>
			</div>
		</div>
	</div>
	<div className="py-6 text-sm text-center dark:text-gray-600 font-bold">© 2025 Company Co. All rights reserved.</div>
</footer>
  )
}

export default Footer