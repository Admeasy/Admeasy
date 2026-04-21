import React, { useEffect, useState } from "react";
import { FileText, User, File, Share2, Eye, Heart, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Lock, School, GraduationCap } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import PaymentModal from "../components/PaymentModal";
import WelcomeCoinPopup from "../components/popups/WelcomeCoinPopup";
import { useUser } from "../context/UserContext";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "react-toastify";

// CSS for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
  cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
};

const pdfHeaders = {
  Accept: 'application/pdf',
};

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, mentor, isLoading: userLoading } = useUser();

  const [note, setNote] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWelcomeCoinPopup, setShowWelcomeCoinPopup] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refetchNote = () => setReloadKey(prev => prev + 1);

  // Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Reset PDF state when note changes
  useEffect(() => {
    if (note) {
      setPageNumber(1);
      setScale(1.0);
      setPdfError(false);
      setPdfLoading(true);
      setNumPages(null);
    }
  }, [note?._id]);

  // Escape key for full screen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFullScreen]);

  // Container width for responsive PDF
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('[data-pdf-container]');
      if (container) setContainerWidth(container.clientWidth - 32);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [note]);

  // Fetch Note
  useEffect(() => {
    const controller = new AbortController();

    const fetchNote = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/notes/${id}`, { signal: controller.signal });
        const data = await response.json();

        if (data.success) {
          setNote(data.data);
          // Note: Backend 'likes' is currently a Number, not an array of IDs.
          // For now, we set liked based on a local flag or similar, 
          // but true persistence would require an array in the DB.
          setLiked(false); 
          // Increment view
          fetch(`/api/notes/${id}/view`, { method: "POST" });
        } else {
          setError(data.message || "Note not found");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setError("Something went wrong while fetching the note");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
    return () => controller.abort();
  }, [id, reloadKey, user?._id, mentor?._id]);

  const handleLike = async () => {
    if (!user && !mentor) {
      toast.info("Please login to like notes");
      return;
    }
    if (isLiking) return;

    try {
      setIsLiking(true);
      const response = await fetch(`/api/notes/${id}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.success) {
        setLiked(!liked);
        setNote(prev => ({
          ...prev,
          likes: !liked 
            ? (prev.likes || 0) + 1
            : Math.max(0, (prev.likes || 0) - 1)
        }));
      }
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note?.title || "Study Note",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");

  const uploaderName = note?.uploaderName || note?.uploader?.name || "Unknown contributor";
  const uploadedOn = note?.publishedAt || note?.uploadDate
    ? new Date(note.publishedAt || note.uploadDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "Recently";

  const canViewPdf = note?.isFree || note?.requiresPurchase === false || note?.isPurchased;

  if (loading || userLoading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading notes...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{error}</h3>
        <button 
          onClick={() => navigate("/notes")}
          className="text-[#9f3562] font-semibold hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SEO
        title={note ? `${note.title} - Study Notes | Admeasy` : 'Study Notes | Admeasy'}
        description={note?.description || 'Access premium study notes'}
        keywords={`${note?.title || ''}, ${note?.standard || ''}, study notes`}
        url={`https://admeasy.in/notes/${id}`}
      />

      {/* Back Button Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 text-gray-700 hover:text-[#9f3562] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back to Notes</span>
          </button>
          
          <div className="flex items-center gap-3">
             <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <Share2 className="w-5 h-5 text-gray-600" />
             </button>
             <button onClick={handleLike} className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${liked ? "text-red-500" : "text-gray-600"}`}>
               <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {!note ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            This note is no longer available.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Info */}
            <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                   <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${note.isFree ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                     {note.isFree ? "FREE" : "PREMIUM"}
                   </span>
                   <div className="flex items-center gap-4 text-gray-500">
                     <div className="flex items-center gap-1">
                       <Eye className="w-4 h-4" />
                       <span className="text-xs font-bold">{formatNumber(note.views)}</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Heart className="w-4 h-4" />
                       <span className="text-xs font-bold">{formatNumber(note.likes || 0)}</span>
                     </div>
                   </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">{note.title}</h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-8">{note.description}</p>

                <div className="space-y-5 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                      <School className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">University</p>
                      <p className="text-sm font-bold text-gray-800">{note.university || "Public Study"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                      <GraduationCap className="w-5 h-5 text-[#9f3562]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Course/Programme</p>
                      <p className="text-sm font-bold text-gray-800">{note.course || note.programme || "General"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#9f3562] to-[#b14270] rounded-2xl flex items-center justify-center shadow-lg shadow-[#9f3562]/20">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Contributor</p>
                      <p className="text-sm font-bold text-gray-900">{uploaderName}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{uploadedOn}</p>
                    </div>
                  </div>
                </div>
              </div>

              {!canViewPdf && (
                <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl">
                  <Lock className="w-12 h-12 text-[#9f3562] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Unlock Full Note</h3>
                  <p className="text-gray-400 text-sm mb-6">Support the contributor and get complete access to this premium study resource.</p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#9f3562] hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    Purchase for ₹{note.price || 49}
                  </button>
                </div>
              )}
            </div>

            {/* Right Content - PDF Viewer */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[600px] flex flex-col">
                {canViewPdf ? (
                  <div className="relative flex flex-col h-full" data-pdf-container>
                    {/* Viewer Sub-Header */}
                    <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-white border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">PDF</span>
                          <p className="text-xs font-medium opacity-60">Page {pageNumber} of {numPages || "..."}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ZoomOut size={14} /></button>
                          <span className="text-[10px] font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                          <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ZoomIn size={14} /></button>
                          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1"><Maximize2 size={14} /></button>
                        </div>
                    </div>

                    <div className={`flex-1 overflow-auto bg-slate-200 p-4 sm:p-8 flex justify-center ${isFullScreen ? "fixed inset-0 z-[100] bg-slate-950 pt-16" : ""}`}>
                      {isFullScreen && (
                        <button onClick={() => setIsFullScreen(false)} className="fixed top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md text-white transition-all">
                          <X size={24} />
                        </button>
                      )}
                      
                      <div className="shadow-2xl h-fit">
                        <Document
                          file={note.fileUrl}
                          httpHeaders={pdfHeaders}
                          options={pdfOptions}
                          onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages);
                            setPdfLoading(false);
                          }}
                          onLoadError={(err) => {
                            console.error("PDF load error:", err);
                            setPdfError(true);
                          }}
                          loading={(
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin" />
                              <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Opening PDF...</p>
                            </div>
                          )}
                          className="flex flex-col items-center"
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            width={containerWidth || undefined}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            loading={null}
                            className="transition-all duration-300"
                          />
                        </Document>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-center gap-8">
                      <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="p-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 rounded-2xl transition-all border border-gray-200"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-900" />
                      </button>
                      
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Progress</span>
                        <span className="text-sm font-black text-gray-900">{pageNumber} <span className="opacity-30">/</span> {numPages || "?"}</span>
                      </div>

                      <button
                        onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
                        disabled={pageNumber >= (numPages || 1)}
                        className="p-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 rounded-2xl transition-all border border-gray-200"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-900" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[500px] p-12 text-center bg-slate-50/50">
                    <div className="w-20 h-20 bg-[#9f3562]/10 rounded-3xl flex items-center justify-center mb-6">
                      <Lock className="w-10 h-10 text-[#9f3562]" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Access Restricted</h3>
                    <p className="text-gray-500 max-w-sm mb-8">This is a premium study note. Please purchase to view the full document.</p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-10 py-4 bg-[#9f3562] text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-[#9f3562]/20 hover:scale-105 transition-transform"
                    >
                      Unlock for ₹{note.price || 49}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        note={note}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={() => {
          refetchNote();
          const alreadyShown = localStorage.getItem("admeasy:welcomeCoinsShown");
          if (!alreadyShown) setShowWelcomeCoinPopup(true);
        }}
      />
      
      <WelcomeCoinPopup
        isOpen={showWelcomeCoinPopup}
        onClose={() => setShowWelcomeCoinPopup(false)}
      />
    </div>
  );
};

export default NotesPage; 