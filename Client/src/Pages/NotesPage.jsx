import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FileText,
  File,
  Share2,
  Eye,
  Heart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Lock,
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SEO from "../components/SEO";
import PaymentModal from "../components/PaymentModal";
import WelcomeCoinPopup from "../components/popups/WelcomeCoinPopup";
import { useUser } from "../context/UserContext";
import { resolveNoteAuthor } from "../utils/noteAuthor";
import { Document, Page, pdfjs } from "react-pdf";

// ✅ CSS imports to fix Blank/White Screen
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ Worker URL to prevent Vite ES module error
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ✅ Options aur Headers ko component ke bahar rakha hai
// (Isse "sendWithPromise" aur worker crash hamesha ke liye theek ho jayega)
const pdfOptions = {
  cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
};

const pdfHeaders = {
  Accept: "application/pdf",
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

  // Scroll to top when component mounts or note ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Reset PDF viewer state when note changes
  useEffect(() => {
    if (note) {
      setPageNumber(1);
      setScale(1.0);
      setPdfError(false);
      setPdfLoading(true);
      setNumPages(null);
    }
  }, [note?._id]);

  // Calculate container width for responsive PDF rendering
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector("[data-pdf-container]");
      if (container) {
        setContainerWidth(container.clientWidth - 32); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [note]);

  useEffect(() => {
    if (userLoading) return;
    let ignore = false;
    const controller = new AbortController();

    const fetchNote = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/notes/${id}`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Unable to load this note right now.");
        }
        const payload = await res.json();
        if (ignore) return;
        let data = payload?.data;
        if (!data) {
          throw new Error("Note not found.");
        }

        // Increment view count
        let updatedWithView = null;
        try {
          const viewRes = await fetch(`/api/notes/${data._id || id}/view`, {
            method: "POST",
          });
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
        }
        setNote(data);
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
  }, [id, userLoading]);

  const refetchNote = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { credentials: "include" });
      if (!res.ok) return;
      const payload = await res.json();
      const data = payload?.data;
      if (data) setNote(data);
    } catch {
      /* ignore */
    }
  }, [id]);

  /** Backend sets hasAccess; legacy notes may omit it — treat missing as free-only. */
  const canViewPdf =
    note &&
    (note.hasAccess === true ||
      (note.hasAccess === undefined && note.isFree !== false));

  const pdfSource =
    canViewPdf && id
      ? `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/api/notes/${id}/pdf`
      : null;

  // Add structured data for note
  useEffect(() => {
    if (note) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: note.title,
        description: note.description,
        educationalLevel: note.standard,
        learningResourceType: "Study Notes",
        author: {
          "@type": "Person",
          name: resolveNoteAuthor(note).displayName,
        },
        provider: {
          "@type": "Organization",
          name: "Admeasy",
        },
        inLanguage: "en",
        isAccessibleForFree: note.isFree || false,
        offers: note.isFree
          ? undefined
          : {
              "@type": "Offer",
              price: note.price || 0,
              priceCurrency: "INR",
            },
      };

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      script.id = "note-structured-data";
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById("note-structured-data");
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
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
      navigator.share(shareData).catch(() => {
        // Error sharing
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  };

  const handleLike = async () => {
    if (!note || liked || isLiking) return;

    try {
      setIsLiking(true);
      const res = await fetch(`/api/notes/${note._id || id}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Unable to like this note right now.");
      }
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

  const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");
  const formatLabelValue = (value) =>
    value
      ? value
          .toString()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "Not shared";

  const authorAttribution = useMemo(
    () => (note ? resolveNoteAuthor(note) : null),
    [note],
  );

  const uploadedAt = note?.publishedAt || note?.uploadDate;
  const uploadedOn = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SEO
        title={
          note
            ? `${note.title} - Study Notes | Admeasy`
            : "Study Notes | Admeasy"
        }
        description={
          note?.description || "Access premium study notes for your courses"
        }
        keywords={`${note?.title || ""}, ${
          note?.standard || ""
        }, study notes, ${note?.course || ""}, ${note?.university || ""}`}
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center text-gray-500">
            Loading note…
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center shadow-lg text-red-700">
            <p className="font-semibold mb-2">
              We couldn&apos;t fetch this note.
            </p>
            <p className="text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate("/notes")}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-500 transition"
            >
              Back to Notes
            </button>
          </div>
        ) : !note ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
            <p className="text-gray-600 mb-4">
              This note is no longer available.
            </p>
            <button
              onClick={() => navigate("/notes")}
              className="px-4 py-2 bg-[#9f3562] text-white rounded-xl font-semibold shadow-lg hover:bg-[#b14270] transition"
            >
              Explore other notes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Note Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Cards */}
              <div className="bg-[#9f3562]/5 rounded-2xl p-5 border border-[#9f3562]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#9f3562]/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#9f3562] fill-[#9f3562]/30" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(note.likes)}
                    </p>
                    <p className="text-base text-gray-600">likes</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#9f3562]/5 rounded-2xl p-5 border border-[#9f3562]/15">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#9f3562]/10 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-[#9f3562]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(note.views)}
                    </p>
                    <p className="text-base text-gray-600">views</p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
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
                    <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                      {note.standard}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {note.title}
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {note.description}
                </p>

                {/* Uploader — profile image, full name, @username (like posts) */}
                {authorAttribution && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <button
                      type="button"
                      disabled={!authorAttribution.profilePath}
                      onClick={() =>
                        authorAttribution.profilePath &&
                        navigate(authorAttribution.profilePath)
                      }
                      className={`flex items-center gap-3 w-full text-left rounded-xl p-1 -m-1 transition-colors ${
                        authorAttribution.profilePath
                          ? "hover:bg-slate-50 cursor-pointer"
                          : "cursor-default"
                      }`}
                    >
                      <img
                        src={authorAttribution.image}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-base truncate">
                          {authorAttribution.displayName}
                        </p>
                        {authorAttribution.username ? (
                          <p className="text-sm text-[#9f3562] font-semibold truncate">
                            @{authorAttribution.username}
                          </p>
                        ) : null}
                        <p className="text-xs text-gray-500 mt-0.5">
                          Uploaded • {uploadedOn}
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-gray-300"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>

                  <button
                    onClick={handleLike}
                    disabled={liked || isLiking}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all border-2 ${
                      liked
                        ? "bg-[#9f3562]/10 text-[#9f3562] border-[#9f3562]/25"
                        : "bg-white text-gray-700 hover:bg-[#9f3562]/5 border-gray-200 hover:border-[#9f3562]/20"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        liked
                          ? "fill-[#9f3562] text-[#9f3562]"
                          : "text-[#9f3562]"
                      }`}
                    />
                    {liked ? "Liked" : isLiking ? "Liking…" : "Like"}
                  </button>
                </div>

                {/* Note Details */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  {[
                    {
                      label: "University",
                      value: note.university
                        ? note.university.toUpperCase()
                        : "Not shared",
                    },
                    {
                      label: "Programme",
                      value: formatLabelValue(note.programme),
                    },
                    { label: "Course", value: formatLabelValue(note.course) },
                    { label: "Total Pages", value: note.pages ?? "Not shared" },
                  ].map((detail) => (
                    <div
                      key={detail.label}
                      className="flex justify-between items-center"
                    >
                      <p className="text-sm text-gray-600">{detail.label}</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - PDF Viewer */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-[#9f3562] to-[#b14270] px-6 py-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">
                      Document Preview
                    </h2>
                  </div>
                </div>

                {!canViewPdf &&
                (note.requiresPurchase === true || note.isFree === false) ? (
                  <div className="p-8 sm:p-12 text-center min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-[#9f3562]/5 to-gray-50">
                    <div className="w-16 h-16 rounded-2xl bg-[#9f3562]/10 flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-[#9f3562]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Premium note
                    </h3>
                    <p className="text-gray-600 text-sm max-w-md mb-6">
                      Purchase this note for ₹{note.price ?? "—"} to view the
                      full PDF. Your access is saved to your account.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {userLoading ? (
                        <button
                          disabled
                          className="px-6 py-3 rounded-xl font-semibold text-white bg-[#9f3562]/50 cursor-wait"
                        >
                          Loading...
                        </button>
                      ) : user || mentor ? (
                        <button
                          type="button"
                          onClick={() => setShowPaymentModal(true)}
                          className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#9f3562] to-[#b14270] shadow-lg hover:shadow-[#9f3562]/30 transition-all"
                        >
                          Purchase & unlock
                        </button>
                      ) : (
                        <Link
                          to={`/login?redirect=${encodeURIComponent(
                            `/notes/${id}`,
                          )}`}
                          className="px-6 py-3 rounded-xl font-semibold text-center text-white bg-gradient-to-r from-[#9f3562] to-[#b14270]"
                        >
                          Log in to purchase
                        </Link>
                      )}
                    </div>
                  </div>
                ) : pdfSource ? (
                  <div className="relative">
                    {!pdfError ? (
                      <div className="flex flex-col h-auto lg:h-[calc(100vh-200px)] min-h-[600px] max-h-[800px]">
                        {/* PDF Controls */}
                        <div className="bg-gradient-to-b from-[#9f3562]/5 to-gray-100 border-b border-[#9f3562]/10 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setPageNumber((prev) => Math.max(1, prev - 1))
                              }
                              disabled={pageNumber <= 1}
                              className="p-2 rounded-lg hover:bg-[#9f3562]/15 text-gray-700 hover:text-[#9f3562] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Previous page"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">
                              Page {pageNumber} of {numPages || "..."}
                            </span>
                            <button
                              onClick={() =>
                                setPageNumber((prev) =>
                                  Math.min(numPages || 1, prev + 1),
                                )
                              }
                              disabled={pageNumber >= (numPages || 1)}
                              className="p-2 rounded-lg hover:bg-[#9f3562]/15 text-gray-700 hover:text-[#9f3562] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Next page"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setScale((prev) => Math.max(0.5, prev - 0.25))
                              }
                              className="p-2 rounded-lg hover:bg-[#9f3562]/15 text-gray-700 hover:text-[#9f3562] transition-colors"
                              title="Zoom out"
                            >
                              <ZoomOut className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2 min-w-[60px] text-center">
                              {Math.round(scale * 100)}%
                            </span>
                            <button
                              onClick={() =>
                                setScale((prev) => Math.min(2.5, prev + 0.25))
                              }
                              className="p-2 rounded-lg hover:bg-[#9f3562]/15 text-gray-700 hover:text-[#9f3562] transition-colors"
                              title="Zoom in"
                            >
                              <ZoomIn className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* PDF Viewer */}
                        <div
                          className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-2 sm:p-4"
                          data-pdf-container
                        >
                          {pdfLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin"></div>
                                <p className="text-gray-600 font-medium">
                                  Loading PDF...
                                </p>
                              </div>
                            </div>
                          )}
                          <Document
                            file={pdfSource}
                            httpHeaders={pdfHeaders}
                            withCredentials
                            options={pdfOptions}
                            onLoadSuccess={({ numPages }) => {
                              setNumPages(numPages);
                              setPdfLoading(false);
                              setPdfError(false);
                            }}
                            onLoadError={(error) => {
                              console.error("PDF load error:", error);
                              setPdfError(true);
                              setPdfLoading(false);
                            }}
                            loading={
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin"></div>
                                <p className="text-gray-600 font-medium">
                                  Loading PDF...
                                </p>
                              </div>
                            }
                            error={
                              <div className="p-8 text-center flex flex-col items-center justify-center">
                                <File className="w-20 h-20 text-gray-300 mb-4" />
                                <p className="text-gray-600 font-semibold mb-2">
                                  Unable to load PDF
                                </p>
                                <p className="text-gray-500 text-sm">
                                  The PDF file may be corrupted, inaccessible,
                                  or blocked by CORS policy.
                                </p>
                              </div>
                            }
                            className="flex flex-col items-center"
                          >
                            <div className="mb-4">
                              <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="shadow-lg"
                                width={containerWidth || undefined}
                                loading={
                                  <div className="flex items-center justify-center p-8 min-h-[400px]">
                                    <div className="w-8 h-8 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin"></div>
                                  </div>
                                }
                                onRenderError={(error) => {
                                  console.error("Page render error:", error);
                                }}
                              />
                            </div>
                          </Document>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                        <File className="w-20 h-20 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-semibold mb-2">
                          Unable to display PDF in browser
                        </p>
                        <p className="text-gray-500 text-sm">
                          Some PDFs cannot be previewed directly.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                    <File className="w-20 h-20 text-gray-300 mb-4" />
                    <p className="text-gray-600 font-semibold">
                      No preview available
                    </p>
                    <p className="text-gray-500 text-sm">
                      The PDF file is being processed
                    </p>
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
