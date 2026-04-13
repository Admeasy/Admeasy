import { useState } from'react';
import { toast } from"react-toastify";
import'react-toastify/dist/ReactToastify.css';

export default function StudentInfoModal({ isOpen, onClose, onX, bannerName }) {
 if (!isOpen) return null;

 const [name, setName] = useState("");
 const [number, setNumber] = useState("");
 const [email, setEmail] = useState("");

 // Error Toast
 const FormErr = () => {
 toast.error("All fields are required!", {
 position:"top-center",
 autoClose: 2000,
 theme:"colored",
 });
 };

 // Form Submission Handler
 const submitHandler = async (e) => {
 e.preventDefault();

 if (!name.trim() || !email.trim() || !number.trim()) {
 return FormErr();
 }

 if (!email.trim().endsWith('gmail.com')) {
 toast.error('Email is not valid', { position:'top-center'});
 return;
 }

 if (number.length !== 10 || !/^[6-9]\d{9}$/.test(number)) {
 toast.error('Number Is Not Valid', { position:'top-center'});
 return;
 }

 try {
 const data = { name, email, number, bannerName };

 const res = await fetch('/api/enrollments', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify(data),
 });

 if (!res.ok) {
 const errorMsg = await res.text();
 toast.error(`Ugghhh! Failed: ${errorMsg}`, {
 position:"top-center",
 autoClose: 1500,
 theme:"colored",
 });
 return;
 }

 toast.success(`Our Team Will Contact You Shortly, ${name}`, {
 position:"top-center",
 autoClose: 1500,
 theme:"colored",
 });

 // ✅ Reset form fields
 setName("");
 setEmail("");
 setNumber("");

 // ✅ Close modal
 onX();

 } catch (err) {
 console.error(err);
 toast.error('Ahhh! An Error Occurred...😑', {
 position:"top-center",
 autoClose: 1500,
 theme:"colored",
 });
 }
 };

 return (
 <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
 <div className="relative py-6 px-6 md:px-8 bg-primary rounded-2xl border-gray-300 w-full max-w-md mx-auto overflow-y-auto max-h-[90vh]">
 
 {/* Close Button */}
 <button
 onClick={onX}
 aria-label="close"
 className="cursor-pointer absolute font-admeasy-extrabold text-2xl top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
 >
 ×
 </button>

 <h1 className="text-gray-800 text-xl font-bold mb-4 text-center">
 Student Information Form
 </h1>

 {/* Form */}
 <form className="space-y-4"onSubmit={submitHandler}>
 {/* Name */}
 <div>
 <label className="block text-sm font-medium text-gray-700">
 Name<span className="text-red-600">*</span>
 </label>
 <input
 type="text"
 placeholder="e.g. John Doe"
 onChange={(e) => setName(e.target.value)}
 value={name}
 className="mt-2 w-full h-10 px-3 text-sm text-gray-600 border placeholder:font-admeasy-bold border-gray-300 rounded focus:outline-none focus:ring-2 placeholder:text-[12px] focus:ring-indigo-700"
 />
 </div>

 {/* Number */}
 <div>
 <label className="block text-sm font-medium text-gray-700">
 Your Number<span className="text-red-600">*</span>
 </label>
 <div className="flex items-center gap-1">
 {/* Country Code */}
 <span className="bg-gray-100 py-2 px-3 text-gray-700 text-sm font-admeasy-bold border border-gray-300 rounded-l">
 +91
 </span>

 {/* Input Field */}
 <input
 type="tel"
 placeholder="Your Number"
 onChange={(e) => setNumber(e.target.value)}
 value={number}
 className="w-full h-10 px-3 text-sm text-gray-700 border border-gray-300 rounded-r placeholder:font-admeasy-bold placeholder:text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-700"
 />
 </div>
 </div>

 {/* Email */}
 <div>
 <label className="block text-sm font-medium text-gray-700">
 Your Email <span className="text-red-600">*</span>
 </label>
 <input
 type="email"
 placeholder="Your Email"
 onChange={(e) => setEmail(e.target.value)}
 value={email}
 className="mt-2 w-full h-10 px-3 text-sm text-gray-600 border placeholder:font-admeasy-bold border-gray-300 rounded focus:outline-none focus:ring-2 placeholder:text-[12px] focus:ring-indigo-700"
 />
 </div>

 {/* Buttons */}
 <div className="flex justify-center gap-4 mt-8">
 <button
 type="submit"
 className="cursor-pointer transition-all bg-blue-500 text-white rounded-lg border-blue-600 px-6 py-2 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] font-medium"
 >
 Submit
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
