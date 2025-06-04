import { FaBuilding, FaEnvelope, FaPhone } from "react-icons/fa";

export default function CollegeCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-primary w-[80%] text-center mx-auto my-6 rounded-2xl shadow-3d px-6 py-4">
      <div className="text-sm sm:text-base  text-tprimary space-y-2">
        <h3 className="font-admeasy font-bold text-[22px] md:text-2xl ">More Info</h3>
        <p>
          <span className="font-semibold">Website :</span>{" "}
          <a
            href={data.website}
            className="text-thead2 hover:underline"
          >
            {data.website || 'Not available'}
          </a>
        </p>
        <p>
          <span className="font-semibold">Email :</span>{" "}
          <a
            href={`mailto:${data?.contact?.email}`}
            className="text-thead2 hover:underline"
          >
            {data?.contact?.email || 'Not available'}
          </a>
        </p>
        <p>
          <span className="font-semibold">Contact :</span>{" "}
          <a
            href={`tel:${data?.contact?.phone}`}
            className="text-thead2 hover:underline"
          >
            {data?.contact?.phone || 'Not available'}
          </a>
        </p>
      </div>
    </div>
  );
}
