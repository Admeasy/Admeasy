import { useState } from "react";


const ButtonIcon = ({ text, icon, ...props }) => {
  return (
    <button
      className="cursor-pointer group relative overflow-hidden bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-[12px] font-medium px-2 py-1 pl-1 rounded-2xl flex items-center gap-1 border-none transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-[#9f3562]/30"
      {...props}
    >
      <div className="relative">
        <div className="svg-wrapper animate-none group-hover:animate-fly">
          {icon || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 md:w-6 md:h-6 transition-transform duration-300 ease-in-out group-hover:translate-x-1 group-hover:rotate-45 group-hover:scale-110"
              viewBox="0 0 24 24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="block ml-1 transition-all duration-300 ease-in-out group-hover:translate-x-1">
        {text}
      </span>
    </button>
  );
};

export default ButtonIcon;
