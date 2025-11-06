// src/components/SmartSearchInput.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaChevronUp } from "react-icons/fa";
import axios from "axios";
import Universities from "../assets/Admeasy/world_universities_and_domains.json";

export default function SmartSearchInput({
  label,
  placeholder,
  type = "city", // city | college | school
  register,
  name,
  errors,
  requiredMsg = "This field is required",
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // 🧩 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 🌍 Fetch suggestions dynamically
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        if (type === "city") {
          // ✅ Fetch Indian cities
          const res = await axios.get(
            "https://wft-geo-db.p.rapidapi.com/v1/geo/cities",
            {
              params: { namePrefix: query, countryIds: "IN", limit: 6 },
              headers: {
                "X-RapidAPI-Key": "6fa46a8610mshe02ec2fbdfecb4fp16267djsn02ca1ff6e44f",
                "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
              },
            }
          );
          const cityNames = res.data.data.map((city) => city.name);
          setSuggestions(cityNames);
        } 
        
        else if (type === "college" || type === "school") {
          // ✅ Filter Indian universities from local JSON
          const indianUniversities = Universities.filter(
            (u) => u.country && u.country.toLowerCase() === "india"
          );

          const filtered = indianUniversities
            .map((u) => u.name)
            .filter((name) =>
              name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 6);

          setSuggestions(filtered);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(delay);
  }, [query, type]);

  const handleSelect = (item) => {
    setQuery(item);
    setSuggestions([]);
    if (onSelect) onSelect(item);
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block mb-2 text-gray-700 font-medium">
          {label}
        </label>
      )}

      <div className="relative">
              <input
                  {...register(name, { required: requiredMsg })}
                  value={query}
                  onChange={(e) => {
                      setQuery(e.target.value);
                      register(name).onChange(e); // ✅ sync with RHF
                  }}
                  type="text"
                  placeholder={placeholder}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  autoComplete="off"
              />
        <button
          type="button"
          onClick={() => setSuggestions([])}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-transform duration-300"
        >
          <FaChevronUp
            className={`transform transition-transform duration-300 ${
              suggestions.length > 0 ? "rotate-180 text-blue-600" : ""
            }`}
            size={16}
          />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-xl shadow-lg max-h-52 overflow-y-auto animate-fadeIn">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
            >
              {item}
            </div>
          ))}
        </div>
      )}

      {errors[name] && (
        <p className="text-red-500 text-sm mt-2">{errors[name].message}</p>
      )}
    </div>
  );
}
