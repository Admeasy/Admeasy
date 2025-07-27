import React from 'react'

const JoiningMentor = () => {
    const url = 'https://forms.gle/kaYR8cHVF1XTq5am9'
  return (
    <div>
    <div className='absolute text-center w-full'>
           <a href={url}
           target='_blank'
           >
           <span className="cursor-pointer bg-gradient-to-r from-red-500 to-red-700 text-white text-[8px] sm:text-[10px] md:text-[14px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider shadow-sm animate-pulse">
         Want to guide students? Click to become a Mentor!              
          </span>
          </a>
      </div>
    </div>
  )
}

export default JoiningMentor