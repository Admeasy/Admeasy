import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CityInput() {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      if (query.trim().length < 2) {
        setCities([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `https://wft-geo-db.p.rapidapi.com/v1/geo/cities`,
          {
            params: { namePrefix: query, limit: 5 },
            headers: {
              "X-RapidAPI-Key": '6fa46a8610mshe02ec2fbdfecb4fp16267djsn02ca1ff6e44f',
              "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
            },
          }
        );
        setCities(response.data.data.map((c) => c.city));
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
      setLoading(false);
    };

    const delay = setTimeout(fetchCities, 400); // debounce (wait for typing)
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (city) => {
    setSelectedCity(city);
    setQuery(city);
    setCities([]);
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="relative w-80">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your city..."
          className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading && (
          <div className="absolute top-full mt-1 w-full text-center text-gray-500 text-sm">
            Loading...
          </div>
        )}

        {cities.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {cities.map((city, index) => (
              <div
                key={index}
                onClick={() => handleSelect(city)}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
              >
                {city}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCity && (
        <p className="mt-4 text-lg font-medium text-gray-700">
          Selected City: <span className="text-blue-600">{selectedCity}</span>
        </p>
      )}
    </div>
  );
}
