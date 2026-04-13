import React, { useState, useEffect } from"react";
import axios from"axios";
import { MapPin } from"lucide-react";

export default function CityInput({ value, onChange, error, placeholder ="Type your city..."}) {
 const [suggestions, setSuggestions] = useState([]);
 const [loading, setLoading] = useState(false);
 const [showSuggestions, setShowSuggestions] = useState(false);

 // Debounced fetch for autocomplete
 useEffect(() => {
 const fetchCities = async () => {
 // If value is short or undefined, don't fetch
 if (!value || value.trim().length < 3) {
 setSuggestions([]);
 return;
 }

 setLoading(true);
 try {
 const response = await axios.get(
`https://wft-geo-db.p.rapidapi.com/v1/geo/cities`,
 {
 params: { namePrefix: value, limit: 5, countryIds:'IN'},
 headers: {
"X-RapidAPI-Key":'6fa46a8610mshe02ec2fbdfecb4fp16267djsn02ca1ff6e44f',
"X-RapidAPI-Host":"wft-geo-db.p.rapidapi.com",
 },
 }
 );
 setSuggestions(response.data.data.map((c) => c.city));
 } catch (error) {
 console.error("Error fetching cities:", error);
 }
 setLoading(false);
 };

 const delay = setTimeout(() => {
 if (showSuggestions) fetchCities();
 }, 400);

 return () => clearTimeout(delay);
 }, [value, showSuggestions]);

 const handleSelect = (city) => {
 onChange(city);
 setSuggestions([]);
 setShowSuggestions(false);
 };

 const handleChange = (e) => {
 onChange(e.target.value);
 setShowSuggestions(true);
 };

 const handleBlur = () => {
 // Delay hiding suggestions to allow click event to register
 setTimeout(() => setShowSuggestions(false), 200);
 };

 return (
 <div className="relative">
 <div className="relative">
 <input
 type="text"
 value={value ||""}
 onChange={handleChange}
 onFocus={() => setShowSuggestions(true)}
 onBlur={handleBlur}
 placeholder={placeholder}
 className={`w-full border-2 rounded-lg p-3 pr-10 outline-none transition ${error ?"border-red-500 focus:ring-red-200":"border-gray-300 focus:ring-blue-500 hover:border-blue-400"
 }`}
 autoComplete="off"
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
 <MapPin size={18} />
 </div>
 </div>

 {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}

 {showSuggestions && (suggestions.length > 0 || loading) && (
 <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
 {loading ? (
 <div className="p-3 text-sm text-gray-500 text-center">
 Loading...
 </div>
 ) : (
 suggestions.map((city, index) => (
 <div
 key={index}
 onClick={() => handleSelect(city)}
 className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
 >
 {city}
 </div>
 ))
 )}
 </div>
 )}
 </div>
 );
}
