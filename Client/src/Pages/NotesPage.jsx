import React, { useEffect, useState } from "react";
import {
  FileText,
  User,
  File,
  Download,
  Share2,
  Eye,
  Heart,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  School,
  BookOpen,
  Upload,
  TrendingUp,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { useUser } from "../context/UserContext";
import PaymentModal from "../components/PaymentModal";

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [note, setNote] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

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
        }

        setNote(data);

        if (data && !data.isFree && user) {
          checkPurchaseStatus(data);
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

  useEffect(() => {
    if (note) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: note.title,
        description: note.description,
        educationalLevel: note.standard,
        learningResourceType: "Study Notes",
        author: { "@type": "Person", name: note.uploaderName },
        provider: { "@type": "Organization", name: "Admeasy" },
        inLanguage: "en",
        isAccessibleForFree: note.isFree || false,
        offers: note.isFree ? undefined : { "@type": "Offer", price: note.price || 0, priceCurrency: "INR" },
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

  const handleDownload = () => {
    if (!note?.fileUrl) {
      alert("Download link is not available yet.");
      return;
    }
    window.open(note.fileUrl, "_blank", "noopener,noreferrer");
  };

  const checkPurchaseStatus = async (noteData) => {
    if (!user || !noteData || noteData.isFree) return;

    try {
      setCheckingPurchase(true);
      const res = await fetch(`/api/payments/check/${noteData._id}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setHasPurchased(data.hasPurchased);
      } else {
        console.error("Failed to check purchase status");
        setHasPurchased(false);
      }
    } catch (error) {
      console.error("Error checking purchase status:", error);
      setHasPurchased(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleShare = () => {
    if (!note) return;
    const shareData = { title: note.title, text: note.description, url: window.location.href };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log("Error sharing", err));
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

  const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");
  const formatLabelValue = (value) =>
    value
      ? value.toString().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
      : "Not shared";

  const uploaderName = note?.uploaderName || note?.uploader || "Unknown contributor";
  const uploadedAt = note?.publishedAt || note?.uploadDate;
  const uploadedOn = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Recently";

  const isFree = note?.isFree ?? true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 pb-20 lg:pb-10 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <SEO
        title={note ? `${note.title} - Study Notes | Admeasy` : "Study Notes | Admeasy"}
        description={note?.description || "Access premium study notes for your courses"}
        keywords={`${note?.title || ""}, ${note?.standard || ""}, study notes, ${note?.course || ""}, ${note?.university || ""}`}
        url={`https://admeasy.in/notes/${id}`}
      />

      {/* Header kept as original */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-[#9f3562] via-[#9f3562]/90 to-[#9f3562]/5 relative z-10">
        <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light">
          <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-pink-400 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-72 w-72 rounded-full bg-[#b14270] blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-6 pt-4 sm:pb-8 sm:pt-6 lg:pb-10">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/notes")}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-100 backdrop-blur hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to All Notes</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="h-3 sm:h-4 w-3 sm:w-4 text-amber-300" />
              <span className="rounded-full bg-white/15 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-100">
                Admeasy Notes
              </span>
            </div>
          </div>

          {loading ? (
            <div className="mt-2 space-y-4">
              <div className="h-7 w-40 animate-pulse rounded-full bg-white/30" />
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/40" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-white/30" />
              <div className="h-4 w-5/6 animate-pulse rounded-lg bg-white/30" />
            </div>
          ) : error || !note ? (
            <div className="mt-6">
              <div className="mx-auto max-w-xl rounded-2xl bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                <p className="mb-2 text-sm font-semibold text-red-600">We couldn&apos;t fetch this note.</p>
                <p className="mb-4 text-sm text-slate-600">{error || "This note is no longer available."}</p>
                <button
                  onClick={() => navigate("/notes")}
                  className="inline-flex items-center justify-center rounded-xl bg-[#9f3562] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#b86286] transition"
                >
                  Go back to Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold ${
                    isFree
                      ? "border-emerald-300 bg-emerald-50/90 text-emerald-700"
                      : "border-amber-300 bg-amber-50/90 text-amber-700"
                  }`}
                >
                  {isFree ? "Free Notes" : note.price ? `Paid • ₹${note.price}` : "Premium"}
                </span>
                {note.standard && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-slate-100">
                    <School className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {note.standard}
                  </span>
                )}
                {note.course && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/10 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-slate-100">
                    <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="max-w-[120px] truncate">{formatLabelValue(note.course)}</span>
                  </span>
                )}
              </div>

              <h1 className="text-balance text-xl sm:text-2xl lg:text-4xl font-bold tracking-tight text-slate-50 break-words">
                {note.title}
              </h1>

              <p className="max-w-2xl text-xs sm:text-sm lg:text-base text-slate-100/85 break-words">
                {note.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-100/90">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/15">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[150px]">{uploaderName}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-100/80">{uploadedOn}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-slate-100/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-xs">{formatNumber(note.views)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-300" />
                    <span className="text-[10px] sm:text-xs">{formatNumber(note.likes)}</span>
                  </span>
                </div>
              </div>

              {/* Mobile Action Buttons in Header */}
              <div className="flex lg:hidden gap-2 pt-2">
                <button
                  onClick={handleLike}
                  disabled={liked || isLiking}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                    liked
                      ? "border-pink-300 bg-pink-50/20 text-white"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
                  {liked ? "Liked!" : "Like"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#6C63FF] hover:bg-white transition shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {!loading && !error && note && (
        <main className="mx-auto mt-6 sm:mt-8 lg:mt-10 max-w-7xl px-4 relative z-10">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* PDF Preview Section */}
            <section className="order-1">
              <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="flex items-center justify-between border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-5 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9f3562] to-[#b8447a]">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Document Preview</p>
                      <p className="text-xs text-gray-600">
                        {note.pages ? `${note.pages} pages` : "PDF file"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="hidden sm:inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-[#9f3562]/30 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Full
                  </button>
                </div>

                {note.fileUrl ? (
                  <div className="relative bg-gray-100">
                    {!pdfError ? (
                      <iframe
                        src={`${note.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-[500px] sm:h-[600px] lg:h-[700px]"
                        title={note.title}
                        onError={() => setPdfError(true)}
                      />
                    ) : (
                      <div className="flex min-h-[500px] flex-col items-center justify-center bg-gray-50 px-6 py-10 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <File className="h-10 w-10 text-gray-400" />
                        </div>
                        <p className="mb-2 text-base font-bold text-gray-900">Unable to display PDF</p>
                        <p className="mb-6 max-w-md text-sm text-gray-600">
                          Download to view on your device.
                        </p>
                        <button
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b8447a] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                          <Download className="h-5 w-5" />
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[500px] flex-col items-center justify-center bg-gray-50 px-6 py-10 text-center">
                    <div className="w-16 h-16 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mb-4"></div>
                    <p className="mb-2 text-base font-bold text-gray-900">Processing...</p>
                    <p className="max-w-md text-sm text-gray-600">
                      PDF is being processed. Check back soon.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Sidebar */}
            <aside className="order-2 space-y-6">
              {/* Quick Actions - Desktop Only */}
              <div className="hidden lg:block rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">Quick Actions</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDownload}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b8447a] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Download className="h-5 w-5" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-[#9f3562]/30 transition"
                  >
                    <Share2 className="h-5 w-5" />
                    Share Note
                  </button>
                  <button
                    onClick={handleLike}
                    disabled={liked || isLiking}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      liked
                        ? "border-pink-300 bg-pink-50 text-pink-700"
                        : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-pink-600" : ""}`} />
                    {liked ? "Liked!" : isLiking ? "..." : "Like Note"}
                  </button>
                </div>

                <div className="mt-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 px-4 py-3 text-xs text-gray-700">
                  <p className="font-bold text-gray-900 mb-2">✨ Why Admeasy?</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-[#9f3562]">•</span>
                      <span>Curated by students & mentors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#9f3562]">•</span>
                      <span>Clean, exam-focused content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#9f3562]">•</span>
                      <span>100% privacy-first platform</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Note Details */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#9f3562]" />
                  <p className="text-sm font-bold text-gray-900">Note Details</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "University", value: note.university ? note.university.toUpperCase() : "Not shared" },
                    { label: "Programme", value: formatLabelValue(note.programme) },
                    { label: "Course", value: formatLabelValue(note.course) },
                    { label: "Total Pages", value: note.pages ?? "Not shared" },
                    { label: "Access", value: isFree ? "Free to access" : "Paid access" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 text-sm pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="max-w-[60%] text-right font-semibold text-gray-900 break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-purple-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#9f3562]" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Performance Stats</p>
                    <p className="text-xs text-gray-600">Student engagement metrics</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <p className="text-xs font-semibold text-gray-600">Views</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(note.views)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Students</p>
                  </div>
                  <div className="rounded-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-pink-600" />
                      <p className="text-xs font-semibold text-gray-600">Likes</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(note.likes)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Found helpful</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-gray-700">
                  <p className="mb-1 font-bold text-gray-900">💡 Pro tip</p>
                  <p>Add your own notes. Active revision beats passive reading.</p>
                </div>
              </div>

              {/* Upload CTA */}
              <div className="rounded-2xl border-2 border-dashed border-[#9f3562]/30 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-5 text-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#9f3562] to-[#b8447a] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Want to upload your notes?</p>
                    <p className="text-xs text-gray-600">Help others and build your profile on Admeasy.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/add-note")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b8447a] px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  Upload Notes
                </button>
              </div>
            </aside>
          </div>
        </main>
      )}

      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} noteId={note?._id} />}
    </div>
  );
};

export default NotesPage;