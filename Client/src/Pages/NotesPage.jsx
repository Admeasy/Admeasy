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
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [pdfError, setPdfError] = useState(false);

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
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-10">
      <SEO
        title={note ? `${note.title} - Study Notes | Admeasy` : "Study Notes | Admeasy"}
        description={note?.description || "Access premium study notes for your courses"}
        keywords={`${note?.title || ""}, ${note?.standard || ""}, study notes, ${note?.course || ""}, ${note?.university || ""}`}
        url={`https://admeasy.in/notes/${id}`}
      />

      <header className="relative border-b border-slate-200 bg-gradient-to-b from-[#6C63FF] via-[#6C63FF]/90 to-[#6C63FF]/5">
        <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light">
          <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-purple-400 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-72 w-72 rounded-full bg-indigo-400 blur-3xl" />
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
            <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
              <div className="space-y-4">
                <div className="h-7 w-40 animate-pulse rounded-full bg-white/30" />
                <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/40" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-white/30" />
                <div className="h-4 w-5/6 animate-pulse rounded-lg bg-white/30" />
              </div>
              <div className="hidden lg:flex items-end justify-end">
                <div className="h-24 w-56 animate-pulse rounded-2xl bg-white/20" />
              </div>
            </div>
          ) : error || !note ? (
            <div className="mt-6">
              <div className="mx-auto max-w-xl rounded-2xl bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                <p className="mb-2 text-sm font-semibold text-red-600">We couldn&apos;t fetch this note.</p>
                <p className="mb-4 text-sm text-slate-600">{error || "This note is no longer available."}</p>
                <button
                  onClick={() => navigate("/notes")}
                  className="inline-flex items-center justify-center rounded-xl bg-[#6C63FF] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#5A52E8] transition"
                >
                  Go back to Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
              <div className="space-y-3 sm:space-y-4">
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

                <h1 className="text-balance text-xl sm:text-2xl lg:text-4xl font-semibold tracking-tight text-slate-50 break-words">
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
              </div>

              <div className="hidden lg:flex items-end justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-white/50 bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick actions</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDownload}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2.5 text-sm cursor-pointer font-semibold text-white shadow-md hover:bg-[#5A52E8] transition"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={handleShare}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 cursor-pointer bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button
                      onClick={handleLike}
                      disabled={liked || isLiking}
                      className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        liked ? "border-pink-200 bg-pink-50 text-pink-600" : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-pink-500 text-pink-500" : "text-pink-500"}`} />
                      {liked ? "Liked!" : isLiking ? "..." : "Like"}
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700 mb-1">Why Admeasy?</p>
                    <ul className="space-y-0.5">
                      <li>• Curated by students & mentors</li>
                      <li>• Clean, exam-focused content</li>
                      <li>• 100% privacy-first platform</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {!loading && !error && note && (
        <main className="mx-auto mt-4 sm:mt-6 lg:mt-10 max-w-7xl px-4">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="order-1 lg:col-span-1">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-[#6C63FF]/10">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#6C63FF]" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Document preview
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600">
                        {note.pages ? `${note.pages} pages` : "PDF file"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </button>
                </div>

                {note.fileUrl ? (
                  <div className="relative bg-slate-900/5">
                    {!pdfError ? (
                      <iframe
                        src={`${note.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-[65vh] sm:h-[70vh] lg:h-[75vh] min-h-[450px]"
                        title={note.title}
                        onError={() => setPdfError(true)}
                      />
                    ) : (
                      <div className="flex min-h-[450px] flex-col items-center justify-center bg-slate-50 px-6 py-10 text-center">
                        <File className="mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-300" />
                        <p className="mb-2 text-xs sm:text-sm font-semibold text-slate-700">Unable to display PDF</p>
                        <p className="mb-4 max-w-md text-[10px] sm:text-xs text-slate-500">
                          Download to view on your device.
                        </p>
                        <button
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#5A52E8] transition"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[450px] flex-col items-center justify-center bg-slate-50 px-6 py-10 text-center">
                    <File className="mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-300 animate-pulse" />
                    <p className="mb-1 text-xs sm:text-sm font-semibold text-slate-700">Processing...</p>
                    <p className="mb-2 max-w-md text-[10px] sm:text-xs text-slate-500">
                      PDF is being processed. Check back soon.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <aside className="order-2 space-y-4 sm:space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-900/5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Note details</p>

                <div className="space-y-2.5 sm:space-y-3">
                  {[
                    { label: "University", value: note.university ? note.university.toUpperCase() : "Not shared" },
                    { label: "Programme", value: formatLabelValue(note.programme) },
                    { label: "Course", value: formatLabelValue(note.course) },
                    { label: "Total pages", value: note.pages ?? "Not shared" },
                    { label: "Access", value: isFree ? "Free to access" : "Paid access" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="max-w-[60%] text-right font-semibold text-slate-800 break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-5 shadow-sm shadow-slate-900/5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance stats</p>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1">Student engagement metrics</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-purple-100 bg-purple-50/80 px-3 py-3">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-600">Views</p>
                    <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900">{formatNumber(note.views)}</p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Students</p>
                  </div>
                  <div className="rounded-xl border border-pink-100 bg-pink-50/90 px-3 py-3">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-600">Likes</p>
                    <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900">{formatNumber(note.likes)}</p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Found helpful</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] sm:text-[11px] text-slate-500">
                  <p className="mb-1 font-semibold text-slate-700">Pro tip 👇</p>
                  <p>Add your own notes. Active revision beats passive reading.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 sm:p-4 text-[10px] sm:text-xs text-slate-600">
                <p className="mb-1 font-semibold text-slate-800">Want to upload your notes?</p>
                <p className="mb-2">Help others and build your profile on Admeasy.</p>
                <button
                  onClick={() => navigate("/add-note")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/20 bg-white px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold text-[#6C63FF] hover:bg-[#6C63FF]/5 transition"
                >
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Upload notes
                </button>
              </div>
            </aside>
          </div>
        </main>
      )}

      {!loading && !error && note && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex flex-col text-[10px] sm:text-[11px] text-slate-500 min-w-0 flex-1">
              <span className="font-semibold text-slate-800 truncate">{note.title}</span>
              <span>{isFree ? "Free download" : "Premium"}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleLike}
                disabled={liked || isLiking}
                className={`inline-flex h-9 w-9 items-center cursor-pointer justify-center rounded-full border transition ${
                  liked ? "border-pink-200 bg-pink-50" : "border-pink-200 bg-white hover:bg-pink-50"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-pink-500 text-pink-500" : "text-pink-500"}`} />
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#6C63FF] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#5A52E8] transition"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;