const fs = require('fs');
const path = 'c:/Users/91908/OneDrive/Desktop/Admeasy/Client/src/components/PostCard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure import is there
if (!content.includes('react-zoom-pan-pinch')) {
    content = content.replace(
        'import { createPortal } from "react-dom";',
        'import { createPortal } from "react-dom";\nimport { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";'
    );
}

// Ensure zoomLevel usage is gone or replaced safely without breaking state
// Let's replace the whole modal block:
const startIndex = content.indexOf('{/* Fullscreen Image View uses createPortal');
const endIndex = content.indexOf('</AnimatePresence>,', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const originalModal = content.substring(startIndex, endIndex);

    const newModal = `{/* Fullscreen Image View uses createPortal to break out of PostCard layout */}
  {showFullscreenImage && createPortal(
  <AnimatePresence>
   <motion.div
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   exit={{ opacity: 0 }}
   className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-0"
   onClick={(e) => {
    e.stopPropagation();
    setShowFullscreenImage(false);
    setZoomLevel(1);
   }}
   style={{ overflow: 'hidden' }}
   >
   {/* Close Button */}
   <motion.button
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-5 right-5 z-[1001] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg"
    onClick={(e) => {
     e.stopPropagation();
     setShowFullscreenImage(false);
     setZoomLevel(1);
    }}
   >
    <X className="w-6 h-6" />
   </motion.button>
   
   <div className="w-full h-full flex items-center justify-center relative cursor-move" onClick={(e) => e.stopPropagation()}>
     <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit>
       {({ zoomIn, zoomOut, resetTransform, scale }) => (
         <>
           <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
             <img
               src={post.image}
               alt="Fullscreen view"
               className="w-full h-full object-contain"
             />
           </TransformComponent>

           {/* Controls Overlay */}
           <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl z-[1001]"
           >
             <button
             onClick={() => zoomOut()}
             className="p-2.5 bg-white/10 hover:bg-white/20 text-white flex-shrink-0 flex items-center justify-center rounded-full transition-all"
             title="Zoom Out"
             >
             <ZoomOut className="w-5 h-5" />
             </button>
             
             <button onClick={() => resetTransform()} className="text-white text-sm font-semibold min-w-10 text-center select-none pt-0.5 px-2 hover:text-[#9f3562]">
               {Math.round(scale * 100)}%
             </button>

             <button
             onClick={() => zoomIn()}
             className="p-2.5 bg-white/10 hover:bg-white/20 text-white flex-shrink-0 flex items-center justify-center rounded-full transition-all"
             title="Zoom In"
             >
             <ZoomIn className="w-5 h-5" />
             </button>
             
             <div className="w-px h-6 bg-white/20 mx-1"></div>

             <button
             onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = post.image;
              link.download = \`post-image-\${post._id}.jpg\`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
             }}
             className="px-4 py-2 hover:bg-white/10 text-white rounded-full text-sm font-medium transition-all flex items-center gap-2"
             title="Download Image"
             >
             <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
             </button>
           </motion.div>
         </>
       )}
     </TransformWrapper>
   </div>
  `;
    content = content.replace(originalModal, newModal);
    fs.writeFileSync(path, content);
    console.log("react-zoom-pan-pinch implemented.");
} else {
    console.log("Could not find modal section");
}
