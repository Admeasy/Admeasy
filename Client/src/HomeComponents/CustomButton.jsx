import React from "react";

const CustomButton = ({ children }) => {
  // Custom shadow styles from your CSS
  const baseShadow =
    "0 2px 4px rgba(45, 35, 66, 0.2), 0 7px 13px -3px rgba(45, 35, 66, 0.15), inset 0 -3px 0 #d6d6e7";
  const focusShadow =
    "inset 0 0 0 1.5px #d6d6e7, 0 2px 4px rgba(45, 35, 66, 0.4), 0 7px 13px -3px rgba(45, 35, 66, 0.3), inset 0 -3px 0 #d6d6e7";
  const hoverShadow =
    "0 4px 8px rgba(45, 35, 66, 0.3), 0 7px 13px -3px rgba(45, 35, 66, 0.2), inset 0 -3px 0 #d6d6e7";
  const activeShadow = "inset 0 3px 7px #d6d6e7";

  return (
    <button
      type="button"
      role="button"
      className="
        inline-flex items-center justify-center
        px-4
        h-12
        rounded-[13px]
        bg-[#fcfcfd]
        text-[#36395a]
        text-[18px]
        font-normal
        cursor-pointer
        select-none
        whitespace-nowrap
        transition-transform transition-shadow duration-150
        outline-none
        "
      style={{
        boxShadow: baseShadow,
      }}
      onFocus={e => (e.currentTarget.style.boxShadow = focusShadow)}
      onBlur={e => (e.currentTarget.style.boxShadow = baseShadow)}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = baseShadow;
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onMouseDown={e => {
        e.currentTarget.style.boxShadow = activeShadow;
        e.currentTarget.style.transform = "translateY(2px)";
      }}
      onMouseUp={e => {
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      >
      {children}
    </button>
  );
};

export default CustomButton;
