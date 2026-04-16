import React, { useEffect, useState } from "react";
import { FileText, User, File, Share2, Eye, Heart, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Lock } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import PaymentModal from "../components/PaymentModal";
import WelcomeCoinPopup from "../components/popups/WelcomeCoinPopup";
import { useUser } from "../context/UserContext";
import { Document, Page, pdfjs } from "react-pdf";

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

        const res = await fetch(`/api/notes/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Unable to load this note.");

        const payload = await res.json();
        let data = payload?.data || payload;

        // Increment view count
        try {
          const viewRes = await fetch(`/api/notes/${data._id || id}/view`, { method: "POST" });
          if (viewRes.ok) {
            const viewData = await viewRes.json();
            data = viewData?.data || data;
          }
        } catch (viewErr) {
          console.error("View increment failed:", viewErr);
        }

        setNote(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNote();

    return () => controller.abort();
  }, [id]);

  const handleShare = () => {
    if (!note) return;
    const shareData = {
      title: note.title,
      text: note.description,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  };

  const handleLike = async () => {
    if (!note || liked || isLiking) return;

    try {
      setIsLiking(true);
      const res = await fetch(`/api/notes/${note._id || id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like");

      const payload = await res.json();
      setNote(payload?.data || { ...note, likes: (note.likes ?? 0) + 1 });
      setLiked(true);
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setIsLiking(false);
    }
  };

  const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");

  const uploaderName = note?.uploaderName || note?.uploader || "Unknown contributor";
  const uploadedOn = note?.publishedAt || note?.uploadDate
    ? new Date(note.publishedAt || note.uploadDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "Recently";

  const canViewPdf = note?.isFree || note?.requiresPurchase === false;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SEO
        title={note ? `${note.title} - Study Notes | Admeasy` : 'Study Notes | Admeasy'}
        description={note?.description || 'Access premium study notes'}
        keywords={`${note?.title || ''}, ${note?.standard || ''}, study notes`}
        url={`https://admeasy.in/notes/${id}`}
      />

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 text-gray-700 hover:text-[#9f3562] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Notes</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">Loading note...</div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-8 text-center text-red-700">
            <p className="font-semibold mb-2">Couldn't load this note</p>
            <p className="text-sm mb-6">{error}</p>
            <button onClick={() => navigate("/notes")} className="px-4 py-2 bg-red-600 text-white rounded-xl">
              Back to Notes
            </button>
          </div>
        ) : !note ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            This note is no longer available.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Likes & Views */}
              <div className="bg-[#9f3562]/5 rounded-2xl p-5 border border-[#9f3562]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#9f3562]/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#9f3562] fill-[#9f3562]/30" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(note.likes)}</p>
                    <p className="text-base text-gray-600">likes</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(note.views)}</p>
                    <p className="text-base text-gray-600">views</p>
                  </div>
                </div>
              </div>

              {/* Note Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      (note.isFree ?? true)
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {(note.isFree ?? true)
                      ? "FREE"
                      : note.price
                        ? `₹${note.price}`
                        : "Paid"}
                  </span>
                  {note.standard && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700">
                      {note.standard}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">{note.title}</h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{note.description}</p>

                {/* Uploader */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9f3562] to-[#b14270] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{uploaderName}</p>
                    <p className="text-xs text-gray-500">Uploaded • {uploadedOn}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 border border-gray-300"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>

                  <button
                    onClick={handleLike}
                    disabled={liked || isLiking}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition-all ${
                      liked ? "bg-[#9f3562]/10 text-[#9f3562] border-[#9f3562]" : "bg-white hover:bg-[#9f3562]/5 border-gray-200"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-[#9f3562]" : ""}`} />
                    {liked ? "Liked" : isLiking ? "Liking..." : "Like"}
                  </button>
                </div>
              </div>
            </div>

            {/* PDF Viewer Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-[#9f3562] to-[#b14270] px-6 py-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Document Preview</h2>
                </div>

                {!canViewPdf ? (
                  <div className="p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                    <Lock className="w-16 h-16 text-[#9f3562] mb-4" />
                    <h3 className="text-xl font-bold mb-2">Premium Note</h3>
                    <p className="text-gray-600 mb-6">Purchase to unlock the full PDF</p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-8 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold"
                    >
                      Purchase for ₹{note.price}
                    </button>
                  </div>
                ) : (
                  <div className="relative" data-pdf-container>
                    <Document
                      file={note.fileUrl}
                      httpHeaders={pdfHeaders}
                      options={pdfOptions}
                      onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages);
                        setPdfLoading(false);
                      }}
                      onLoadError={() => setPdfError(true)}
                      loading={<div className="p-10 text-center">Loading PDF...</div>}
                      className="flex flex-col items-center"
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        width={containerWidth || undefined}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>

                    {/* PDF Controls */}
                    <div className="sticky bottom-4 flex justify-center gap-4 mt-4">
                      <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber <= 1}>
                        <ChevronLeft />
                      </button>
                      <span>Page {pageNumber} of {numPages}</span>
                      <button onClick={() => setPageNumber(p => Math.min(numPages || 1, p+1))} disabled={pageNumber >= (numPages || 1)}>
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {note && (
        <PaymentModal
          note={note}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={(data) => {
            refetchNote();
            //show welcome coin popup only once every
            const alreadyShown = localStorage.getItem(
              "admeasy:welcomeCoinsShown",
            );
            if (!alreadyShown) {
              setShowWelcomeCoinPopup(true);
            }
          }}
        />
      )}
      <WelcomeCoinPopup
        isOpen={showWelcomeCoinPopup}
        onClose={() => setShowWelcomeCoinPopup}
      />
    </div>
  );
};

export default NotesPage;