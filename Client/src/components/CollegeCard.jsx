export default function CollegeCard(college) {

  return (
    <div className="bg-white w-[90%] text-center mx-auto my-6 rounded-2xl shadow-3d px-6 py-4">
      <div className="text-sm sm:text-base  text-tprimary space-y-2">
        <h3 className="font-admeasy font-bold text-[22px] md:text-2xl ">More Info</h3>
        <p>
          <span className="font-semibold">Website :</span>{" "}
          <a
            href={`${college.data.website}`}
            className="text-thead2 hover:underline"
          >
            {college.data.website}
          </a>
        </p>
        <p>
          <span className="font-semibold">Email :</span>{" "}
          <a
            href={`mailto:${college.data.contact.email}`}
            className="text-thead2 hover:underline"
          >
            {college.data.contact.email}
          </a>
        </p>
        <p>
          <span className="font-semibold">Contact :</span>{" "}
          <a
            href={`tel:${college.data.contact.phone}`}
            className="text-thead2 hover:underline"
          >
            {college.data.contact.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
