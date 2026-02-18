import React, { useEffect, useState } from "react";
import { FileText, User, File, Share2, Eye, Heart, ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { Document, Page, pdfjs } from 'react-pdf';

// ✅ FIX 1: Import mandatory styles to prevent "white/blank" PDF
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ✅ FIX 2: Use 'unpkg' and '.mjs' for reliable worker loading
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  
  // PDF State
  const [pdfError, setPdfError] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(null);

  // Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Reset PDF state
  useEffect(() => {
    if (note) {
      setPageNumber(1);
      setScale(1.0);
      setPdfError(false);
      setPdfErrorMessage("");
      setPdfLoading(true);
      setNumPages(null);
    }
  }, [note?._id]);

  // Calculate width
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('[data-pdf-container]');
      if (container) {
        setContainerWidth(container.clientWidth - 32); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [note]);

  // Fetch Note (YOUR ORIGINAL LOGIC KEPT INTACT)
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchNote = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/notes/${id}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error("Unable to load this note right now.");
        }
        const payload = await res.json();
        if (ignore) return;
        let data = payload?.data;
        if (!data) {
          throw new Error("Note not found.");
        }
        
        // Increment view count logic
        let updatedWithView = null;
        try {
          const viewRes = await fetch(`/api/notes/${data._id || id}/view`, { method: "POST" });
          if (viewRes.ok) {
            const viewPayload = await viewRes.json();
            updatedWithView = viewPayload?.data;
          }
        } catch (viewErr) {
          console.error("Error incrementing views:", viewErr);
        }
        
        if (!ignore) {
          if (updatedWithView) {
            data = updatedWithView;
          } else {
            data = { ...data, views: (data.views ?? 0) + 1 };
          }
          setNote(data);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  // Structured Data
  useEffect(() => {
    if (note) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": note.title,
        "description": note.description,
        "educationalLevel": note.standard,
        "learningResourceType": "Study Notes",
        "author": { "@type": "Person", "name": note.uploaderName },
        "provider": { "@type": "Organization", "name": "Admeasy" },
        "inLanguage": "en",
        "isAccessibleForFree": note.isFree || false,
        "offers": note.isFree ? undefined : {
          "@type": "Offer",
          "price": note.price || 0,
          "priceCurrency": "INR"
        }
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      script.id = 'note-structured-data';
      document.head.appendChild(script);
      
      return () => {
        const existingScript = document.getElementById('note-structured-data');
        if (existingScript) document.head.removeChild(existingScript);
      };
    }
  }, [note]);

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
      if (!res.ok) throw new Error("Unable to like this note right now.");
      
      const payload = await res.json();
      setNote(payload?.data ?? { ...note, likes: (note.likes ?? 0) + 1 });
      setLiked(true);
    } catch (err) {
      console.error("Error liking note:", err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  // ✅ FIX 3: Helper to force Cloudinary inline view and handle relative paths
  const getPdfUrl = (url) => {
    if (!url) return null;
    
    // Convert relative path to absolute URL (fixes localhost issues)
    if (url.startsWith('/')) {
       return window.location.origin + url;
    }

    // Cloudinary: Inject fl_inline to prevent download
    try {
      if (url.includes('cloudinary.com')) {
        if (url.includes('/fl_inline/')) return url;
        return url.replace('/upload/', '/upload/fl_inline/');
      }
      return url;
    } catch (err) {
      console.warn("Error formatting PDF URL:", err);
      return url;
    }
  };

  const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");
  const formatLabelValue = (value) =>
    value ? value.toString().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "Not shared";
  const uploaderName = note?.uploaderName || note?.uploader || "Unknown contributor";
  const uploadedAt = note?.publishedAt || note?.uploadDate;
  const uploadedOn = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Recently";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SEO
        title={note ? `${note.title} - Study Notes | Admeasy` : 'Study Notes | Admeasy'}
        description={note?.description || 'Access premium study notes for your courses'}
        keywords={`${note?.title || ''}, ${note?.standard || ''}, study notes, ${note?.course || ''}, ${note?.university || ''}`}
        url={`https://admeasy.in/notes/${id}`}
      />
      
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 text-gray-700 hover:text-[#6C63FF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Notes</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center text-gray-500">
            Loading note…
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center shadow-lg text-red-700">
            <p className="font-semibold mb-2">We couldn&apos;t fetch this note.</p>
            <p className="text-sm mb-6">{error}</p>
            <button onClick={() => navigate("/notes")} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-500 transition">
              Back to Notes
            </button>
          </div>
        ) : !note ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
            <p className="text-gray-600 mb-4">This note is no longer available.</p>
            <button onClick={() => navigate("/notes")} className="px-4 py-2 bg-[#6C63FF] text-white rounded-xl font-semibold shadow-lg hover:bg-[#5A52E8] transition">
              Explore other notes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Note Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Cards */}
              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600 fill-pink-500" />
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

              {/* Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${note.isFree ?? true ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                    {note.isFree ?? true ? "FREE" : note.price ? `₹${note.price}` : "Paid"}
                  </span>
                  {note.standard && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                      {note.standard}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">{note.title}</h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{note.description}</p>

                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#3A32CF] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{uploaderName}</p>
                    <p className="text-xs text-gray-500">Uploaded • {uploadedOn}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-gray-300">
                    <Share2 className="w-5 h-5" /> Share
                  </button>

                  <button onClick={handleLike} disabled={liked || isLiking} className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all border-2 ${liked ? "bg-pink-100 text-pink-600 border-pink-200" : "bg-white text-gray-700 hover:bg-pink-50 border-gray-200"}`}>
                    <Heart className={`w-5 h-5 ${liked ? "fill-pink-500 text-pink-500" : "text-pink-500"}`} />
                    {liked ? "Liked" : isLiking ? "Liking…" : "Like"}
                  </button>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  {[
                    { label: "University", value: note.university ? note.university.toUpperCase() : "Not shared" },
                    { label: "Programme", value: formatLabelValue(note.programme) },
                    { label: "Course", value: formatLabelValue(note.course) },
                    { label: "Total Pages", value: note.pages ?? "Not shared" },
                  ].map((detail) => (
                    <div key={detail.label} className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">{detail.label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - PDF Viewer */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-[#6C63FF] to-[#5A52E8] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Document Preview</h2>
                  </div>
                </div>

                {note.fileUrl ? (
                  <div className="relative">
                    {!pdfError ? (
                      // ✅ FIX 4: Mobile-optimized height (allows pinch-to-zoom)
                      <div className="flex flex-col h-auto lg:h-[calc(100vh-200px)] lg:min-h-[600px] lg:max-h-[800px]">
                        
                        {/* PDF Controls */}
                        <div className="bg-gray-100 border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPageNumber(prev => Math.max(1, prev - 1))} disabled={pageNumber <= 1} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">
                              Page {pageNumber} of {numPages || '...'}
                            </span>
                            <button onClick={() => setPageNumber(prev => Math.min(numPages || 1, prev + 1))} disabled={pageNumber >= (numPages || 1)} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                              <ZoomOut className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(prev => Math.min(4.0, prev + 0.25))} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                              <ZoomIn className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* PDF Viewer */}
                        {/* ✅ FIX 5: Bypassed proxy API to use getPdfUrl() with note.fileUrl directly */}
                        <div className="w-full lg:flex-1 lg:overflow-auto bg-gray-100 flex items-start justify-center p-2 sm:p-4" data-pdf-container>
                          {pdfLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-[#6C63FF]/20 border-t-[#6C63FF] rounded-full animate-spin"></div>
                                <p className="text-gray-600 font-medium">Loading PDF...</p>
                              </div>
                            </div>
                          )}
                          <Document
                            file={getPdfUrl(note.fileUrl)}
                            httpHeaders={{ 'Accept': 'application/pdf' }}
                            withCredentials={false}
                            onLoadSuccess={({ numPages }) => {
                              setNumPages(numPages);
                              setPdfLoading(false);
                              setPdfError(false);
                            }}
                            onLoadError={(error) => {
                              console.error('PDF error:', error);
                              setPdfError(true);
                              setPdfErrorMessage(error.message || "Unknown error");
                              setPdfLoading(false);
                            }}
                            className="flex flex-col items-center"
                          >
                            <Page
                              pageNumber={pageNumber}
                              scale={scale}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="shadow-lg"
                              width={containerWidth || undefined}
                              onRenderError={() => {}}
                            />
                          </Document>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                        <File className="w-20 h-20 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-semibold mb-2">Unable to load PDF</p>
                        <p className="text-gray-500 text-sm mb-4">Error: {pdfErrorMessage}</p>
                        <a 
                          href={getPdfUrl(note.fileUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#6C63FF] underline text-sm hover:text-[#5A52E8]"
                        >
                          Try opening file directly
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                    <p className="text-gray-600">No preview available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;