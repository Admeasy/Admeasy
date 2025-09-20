import React, { useState } from "react";
import StudentInfoModal from "./StudentInfoModel";

// MGCI Banner IMgs
import MGCIBannerTwo from "../assets/Banner/MGCI-Banner-Neet.webp";
import Bannerimg from "../assets/Banner/NEET.webp";
import MGCIBrochure from "../assets/Banner/MGCIbrochure.pdf";

// UDAAN
import UdaanBannerJee from "../assets/Banner/UDAAN-Banner-JEE.webp";
import UdaanBannerNeet from "../assets/Banner/UDAAN-Banner-NEET.webp";
import UdaanBanner from "../assets/Banner/UDAAN-Banner.webp";

const CollabBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);

  const Banners = [
    {
      Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
      Subheadline: "Expert-led Online Classes",
      SubheadlineO: "Dedicated Offline Programs in Indore",
      imgSrc: Bannerimg,
      brochure: MGCIBrochure,
      bannerName: "MGCI",
    },
    {
      Headline: "Crack JEE, NEET & CUET — Join MGCI Indore Today!",
      Subheadline: "Expert-led Online Classes",
      SubheadlineO: "Dedicated Offline Programs in Indore",
      imgSrc: MGCIBannerTwo,
      brochure: MGCIBrochure,
      bannerName: "MGCI",
    },
    {
      Headline: "Crack JEE & NEET with Udaan — Your Success, Our Mission",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today!!",
      imgSrc: UdaanBanner,
      brochure: false,
      bannerName: "UDAAN",
    },
    {
      Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today!!",
      imgSrc: UdaanBannerJee,
      brochure: false,
      bannerName: "UDAAN",
    },
    {
      Headline: "Crack JEE/IIT, NEET with Udaan Coaching",
      Subheadline: "Experienced Faculty | Daily Doubt-Clearing",
      SubheadlineO: "Join Udaan Today — Where Aspirations Take Flight",
      imgSrc: UdaanBannerNeet,
      brochure: false,
      bannerName: "UDAAN",
    },
  ];

  const handleEnroll = (banner) => {
    setActiveBanner(banner);
    setIsOpen(true);
  };

  return (
    <section className="py-14 px-6 bg-gradient-to-br from-white to-blue-50">
      {/* Section Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
        <h2 className="text-3xl font-admeasy-extrabold text-gray-900 tracking-tight">
          OUR <span className="text-blue-600">Brand Collaborator</span>
        </h2>
        <a
          href="https://forms.gle/zShtayAGBWxthf6z6"
          className="text-sm sm:text-base mt-3 sm:mt-0 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
        >
          Become a brand collaborator
        </a>
      </div>

      {/* Cards */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Banners.map((banner, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 flex flex-col overflow-hidden max-w-sm mx-auto"
          >
            {/* Image */}
            <div className="h-40 flex items-center justify-center bg-gray-50">
              <img
                src={banner.imgSrc}
                alt={banner.bannerName}
                className="rounded-2xl max-h-36 object-contain mx-auto transform group-hover:scale-105 transition duration-500"
                draggable="false"
              />
            </div>

            {/* Text */}
            <div className="flex-1 flex flex-col p-5 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {banner.Headline}
              </h3>
              <p className="text-sm text-gray-600">{banner.Subheadline}</p>
              <p className="text-sm text-gray-600 mb-4">
                {banner.SubheadlineO}
              </p>

              {/* Buttons */}
              <div className="mt-auto flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleEnroll(banner)}
                  className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
                >
                  Enroll Now
                </button>
                {banner.brochure && (
                  <a
                    href={banner.brochure}
                    download={`${banner.bannerName}-Brochure.pdf`}
                    className="w-full sm:w-auto cursor-pointer px-5 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium border border-blue-200 hover:bg-blue-200 transition"
                  >
                    Prospectus
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isOpen && activeBanner && (
        <StudentInfoModal
          isOpen={isOpen}
          onX={()=>setIsOpen(false)}
          bannerName={activeBanner.bannerName}
        />
      )}
    </section>
  );
};

export default CollabBanner;
