import React from"react";

const FilterSection = ({ title, options, selected, onChange }) => (
 <div className="mb-6">
 <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
 <div className="flex flex-wrap gap-3">
 {options.map((option) => {
 const isSelected = selected === option.id;
 return (
 <label
 key={option.id}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${
 isSelected
 ?"bg-[#6C63FF] text-white border-[#6C63FF] shadow-lg scale-105"
 :"bg-white text-gray-700 border-gray-200 hover:border-[#6C63FF] opacity-60 scale-95"
 }`}
 >
 <input
 type="radio"
 name={title}
 value={option.id}
 checked={isSelected}
 onChange={() => onChange(option.id)}
 className="hidden"
 />
 <span className={`font-medium ${isSelected ?'text-base':'text-sm'}`}>
 {option.label}
 </span>
 </label>
 );
 })}
 </div>
 </div>
);

export default FilterSection;
