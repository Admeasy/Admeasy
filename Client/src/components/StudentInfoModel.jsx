import { useState } from 'react';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function StudentInfoModal({ isOpen, onClose, redirect, onX, setShowModal }) {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [stream, setStream] = useState("");
  const [percentage, setPercentage] = useState("");
  const [skipInfo,setSkipInfo] = useState(false)

  // Error Toast
  const FormErr = (e) => {
    e.preventDefault()
    toast.error("All fields are required!", {
      position: "top-center",
      autoClose: 2000,
      theme: "colored",
    });
  };
  // CheckBox Handler
  const checkboxHandler = (e)=>{
    setSkipInfo(e.target.checked)
  }
  // Form Submission Handler
  const submitHandler = (e) => {
    e.preventDefault();
    if (!name.trim() || !stream.trim() || !percentage.trim()) {
      return FormErr(e);
    }
    setShowModal(false)
    toast.success(`Form submitted successfully ${name}`, {
      position: "top-center",
      autoClose: 1500,
      theme: "colored",
    });

    setName("");
    setStream("");
    setPercentage("");
    setTimeout(() => {
      const finalMessage = `${redirect}\nAbout Me:\n• Name: ${name}\n• Stream: ${stream}\n• Percentage in 12th: ${percentage}`;
      const encoded = encodeURIComponent(finalMessage);
      window.open(`https://wa.me/919243299145?text=${encoded}`, "_blank");
      // Reset after opening link
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
      {/* Form Container */}
      <div className="relative py-6 px-6 md:px-8 bg-primary rounded-2xl border-gray-300 w-full max-w-md mx-auto overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onX}
          aria-label="close"
          className="cursor-pointer absolute font-admeasy-extrabold text-2xl top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>

        <h1 className="text-gray-800 text-xl font-bold mb-4 text-center">Student Information Form</h1>
        <form className="space-y-4">
          {/* Name */}

          <div>
            <label className="block text-sm font-medium text-gray-700">Name*</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="mt-2  w-full h-10 px-3 text-sm text-gray-600 border placeholder:font-admeasy-bold border-gray-300 rounded focus:outline-none focus:ring-2 placeholder:text-[12px] focus:ring-indigo-700"
            />
          </div>

          {/* Stream */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Stream + Optional*</label>
            <input
              type="text"
              placeholder="e.g. Commerce + Maths"
              onChange={(e) => setStream(e.target.value)}
              value={stream}
              className="mt-2 w-full h-10 px-3 text-sm text-gray-600 border placeholder:font-admeasy-bold border-gray-300 rounded focus:outline-none focus:ring-2 placeholder:text-[12px] focus:ring-indigo-700"
            />
          </div>

          {/* Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">11th/12th Percentage*</label>
            <input
              type="text"
              placeholder="e.g. 80%"
              onChange={(e) => setPercentage(e.target.value)}
              value={percentage}
              className="mt-2 w-full h-10 px-3 text-sm text-gray-600 border placeholder:font-admeasy-bold border-gray-300 rounded focus:outline-none focus:ring-2 placeholder:text-[12px] focus:ring-indigo-700"
            />
          </div>
          <label className="container">
            <input type="checkbox" checked={skipInfo} onChange={checkboxHandler} />
              <div className="checkmark"></div>
            <p className='text-[10px] sm:text-[12px] lg:text-[14px] text-gray-600 font-admeasy'>Proceed without providing details</p>
          </label>


          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="submit"
              onClick={(e) => {
                skipInfo ? onClose() : submitHandler(e);
              }}
              className="cursor-pointer transition-all bg-blue-500 text-white rounded-lg border-blue-600 px-6 py-2 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] font-medium"
            >
              Submit
            </button>
          

            {/* <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-300 cursor-pointer text-gray-600 px-6 py-2 text-sm rounded border font-medium transition-colors"
            >
              Skip
            </button> */}
          </div>

          {/* Note */}
          <p className="text-xs text-gray-600 pt-4">
            <strong>Note:</strong> This information will be shared with the UG Mentor. <br />
            <span className="text-[11px] text-gray-500">यह जानकारी UG Mentor के साथ साझा की जाएगी।</span>
          </p>
        </form>

      </div>
    </div>
  );
}
