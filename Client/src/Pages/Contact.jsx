import React from 'react'

const Contact = () => {
  return (
    <div className="w-2/3 p-5 pb-3 bg-[#f6f5f5] flex flex-col gap-4 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 border-[1px] border-black rounded-3xl shadow-[2px_2px_7.5px_#00000060]">
      <h2 className="text-6xl font-poppins">Contact Us</h2>
      <div className="w-full m-0 p-2 bg-[#ffffff] border-[1px] border-black rounded-2xl shadow-[2px_2px_5px_#00000060]">
        <h2 className="text-xl font-semibold">Need help or have any queries? You're just a mail or call away</h2>
        <ul className="">
          <li className=""><a href="" className=""></a></li>
          <li className=""><a href="" className=""></a></li>
        </ul>
      </div>
    </div>
  )
}

export default Contact