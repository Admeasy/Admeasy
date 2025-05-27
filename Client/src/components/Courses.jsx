import MediCaps from "../assets/CollegesImg/MediCapsUniversityLogo.png";

export default function Courses() {
  const infoItems = [
    { label: "Course Duration", value: "4 Years (2026 July - 2029 May) (8 Semesters)" },
    { label: "Scholarship", value: "MUSAT – Application Open ", linkText: "apply now", link: "#" },
    { label: "Fee Structure", value: "1,20,000 per annum" },
    { label: "Highest Package", value: "18 Lakh rupees (2024)" },
    { label: "Seats offered", value: "1020 (B.Tech CSE)" },
    { label: "Recruiters", value: "78 (includes TCS, Infosys)" },
    { label: "Median Package", value: "7.8 Lakh LPA" },
    { label: "Accepted Exams", value: "MU SAT, JEE, CUET" },
    { label: "Cut Off", value: "", linkText: "Click here", link: "#" },
    { label: "Eligibility", value: "55% – 10+2" },
  ];

  const relatedCourses = [
    "B.Tech in Civil Engineering",
    "B.Tech in Computer Engineering",
    "B.Tech in CS & Engineering (AI)",
  ];

  return (
    <div className="bg-white w-[90%] mx-auto rounded-2xl shadow-3d py-8 px-4 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-3d p-4 sm:p-6">
        {/* Heading */}
        <h2 className="text-lg sm:text-xl font-bold text-[#5A4BFF] mb-4 flex items-center gap-3 flex-wrap">
          <img src={MediCaps} alt="icon" className="w-16 sm:w-20 h-16 sm:h-20 object-contain" />
          About B.Tech CSE
        </h2>

        {/* Info Rows */}
        <div className="space-y-3">
          {infoItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row justify-between gap-1 sm:items-center bg-[#EDF1F8] rounded-xl px-4 py-2 text-sm text-gray-800"
            >
              <span className="font-medium">{item.label}</span>
              {item.link ? (
                <span>
                  {item.value}
                  <a
                    href={item.link}
                    className="ml-1 text-[#5A4BFF] underline hover:text-[#3F37C9]"
                  >
                    {item.linkText}
                  </a>
                </span>
              ) : (
                <span className="sm:text-right">{item.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Related Courses */}
        <div className="bg-[#EDF1F8] mt-4 rounded-xl px-4 py-3 text-sm text-gray-800">
          <span className="font-medium">Related Courses</span>
          <div className="mt-1 space-y-1">
            {relatedCourses.map((course, i) => (
              <div key={i}>{course}</div>
            ))}
            <a
              href="#"
              className="text-[#5A4BFF] underline text-sm hover:text-[#3F37C9] block mt-1"
            >
              More related courses
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}