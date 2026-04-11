import { useState } from"react";
import { AnimatePresence, motion } from"framer-motion";
import { CircleAlert } from"lucide-react";

export default function LoginModal({ modalSize ="lg"}) {
 const [isOpen, setIsOpen] = useState(false);

 return (
 <div>
 <button
 onClick={() => setIsOpen(true)}
 className="rounded bg-indigo-800 p-2 font-medium text-white transition-opacity hover:opacity-90"
 >
 Open Modal
 </button>

 <AnimatePresence>
 {isOpen && (
 <div
 onClick={() => setIsOpen(false)}
 className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-scroll bg-slate-900/20 p-8 backdrop-blur"
 >
 <motion.div
 initial={{ scale: 0, rotate:"180deg"}}
 animate={{
 scale: 1,
 rotate:"0deg",
 transition: {
 type:"spring",
 bounce: 0.25,
 },
 }}
 exit={{ scale: 0, rotate:"180deg"}}
 onClick={(e) => e.stopPropagation()}
 className={`relative w-full cursor-default overflow-hidden rounded-xl 
 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 
 p-6 text-white shadow-2xl 
 ${modalSize ==="sm"?"max-w-sm":"max-w-lg"}`}
 >
 <div className="flex flex-col gap-3">
 <CircleAlert className="mx-auto text-white"size={48} />
 {/* Modal Content */}

 
 <div className="flex gap-2">
 <button
 onClick={() => setIsOpen(false)}
 className="w-full rounded bg-transparent py-2 font-semibold text-white transition-colors hover:bg-white/30"
 >
 Close!
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="w-full rounded bg-white py-2 font-semibold text-indigo-600 transition-opacity hover:opacity-80"
 >
 Understood!
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
