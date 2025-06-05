import React from 'react';

const PrivacyPBtn = ({ text = "", LinkTo = "" }) => {
  return (
    <a
      href={LinkTo}
      target="_blank"
      rel="noopener noreferrer"
      className="relative bg-[#7079f0] text-white font-medium text-[17px] px-4 pr-12 py-2 rounded-[0.9em] border-none cursor-pointer tracking-wide flex items-center shadow-[inset_0_0_1.6em_-0.6em_#714da6] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[0.15em_0.15em_#5566c2] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0.05em_0.05em_#5566c2] transition-transform duration-150"
    >
      {text}
      <div
        className="absolute right-[0.3em] ml-4 h-[2.2em] w-[2.2em] flex items-center justify-center rounded-[0.7em] shadow-[0.1em_0.1em_0.6em_0.2em_#7a8cf3] transition-all duration-300"
      >
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
            fill="currentColor"
          />
        </svg>
      </div>
    </a>
  );
};

export default PrivacyPBtn;
