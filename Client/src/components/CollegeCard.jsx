export default function CollegeCard() {
  return (
    <div className="bg-white w-[90%] text-center mx-auto mt-6 rounded-2xl shadow-3d px-6 py-4">
      <div className="text-sm sm:text-base  text-gray-800 space-y-2">
        <h3 className="font-admeasy font-bold text-[22px] md:text-2xl ">More Info</h3>
        <p>
          <span className="font-semibold">Website :</span>{" "}
          <a
            href="mailto:info@medicaps.ac.in"
            className="text-[#5A4BFF] hover:underline"
          >
            info@medicaps.ac.in
          </a>
        </p>
        <p>
          <span className="font-semibold">Email :</span>{" "}
          <a
            href="mailto:info@medicaps.ac.in"
            className="text-[#5A4BFF] hover:underline"
          >
            info@medicaps.ac.in
          </a>
        </p>
        <p>
          <span className="font-semibold">Contact :</span>{" "}
          +91 99XXX XXXXX
        </p>
      </div>
    </div>
  );
}
