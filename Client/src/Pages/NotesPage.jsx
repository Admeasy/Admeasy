import React, { useEffect, useState } from "react";
import { FileText, User, File, Download, Share2, Eye, Heart, ArrowLeft, ExternalLink } from "lucide-react";
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

  // Scroll to top when component mounts or note ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
        
        // Increment view count
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

  // Add structured data for note
  useEffect(() => {
    if (note) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": note.title,
        "description": note.description,
        "educationalLevel": note.standard,
        "learningResourceType": "Study Notes",
        "author": {
          "@type": "Person",
          "name": note.uploaderName
        },
        "provider": {
          "@type": "Organization",
          "name": "Admeasy"
        },
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
    const shareData = {
      title: note.title,
      text: note.description,
      url: window.location.href,
    };

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
            <button
              onClick={() => navigate("/notes")}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-500 transition"
            >
              Back to Notes
            </button>
          </div>
        ) : !note ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
            <p className="text-gray-600 mb-4">This note is no longer available.</p>
            <button
              onClick={() => navigate("/notes")}
              className="px-4 py-2 bg-[#6C63FF] text-white rounded-xl font-semibold shadow-lg hover:bg-[#5A52E8] transition"
            >
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
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      note.isFree ?? true
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
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

                {/* Uploader Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#3A32CF] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{uploaderName}</p>
                    <p className="text-xs text-gray-500">Uploaded • {uploadedOn}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#6C63FF] text-white rounded-xl font-semibold hover:bg-[#5A52E8] transition-all shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>

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
                        ? "bg-pink-100 text-pink-600 border-pink-200"
                        : "bg-white text-gray-700 hover:bg-pink-50 border-gray-200"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-pink-500 text-pink-500" : "text-pink-500"}`} />
                    {liked ? "Liked" : isLiking ? "Liking…" : "Like"}
                  </button>
                </div>

                {/* Note Details */}
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
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open Full</span>
                  </button>
                </div>

                {note.fileUrl ? (
                  <div className="relative">
                    {!pdfError ? (
                      <iframe
                        src={`${note.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                        className="w-full h-[calc(100vh-200px)] min-h-[600px]"
                        title={note.title}
                        onError={() => setPdfError(true)}
                      />
                    ) : (
                      <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                        <File className="w-20 h-20 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-semibold mb-2">Unable to display PDF in browser</p>
                        <p className="text-gray-500 text-sm mb-6">Some PDFs cannot be previewed directly. Please download to view.</p>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-6 py-3 bg-[#6C63FF] text-white rounded-xl font-semibold hover:bg-[#5A52E8] transition-all shadow-lg"
                        >
                          <Download className="w-5 h-5" />
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center min-h-[600px] flex flex-col items-center justify-center bg-gray-50">
                    <File className="w-20 h-20 text-gray-300 mb-4" />
                    <p className="text-gray-600 font-semibold">No preview available</p>
                    <p className="text-gray-500 text-sm">The PDF file is being processed</p>
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