import React from "react";
import { FileText, File, Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveNoteAuthor } from "../utils/noteAuthor";

/* ---------- SAFE TEXT HELPER ---------- */
const renderText = (value) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") return value.name ?? value.title ?? null;
  return null;
};

const NotesCard = ({ note, compact = false }) => {
  const navigate = useNavigate();
  const noteId = note?._id || note?.id;
  const isFree = note?.isFree ?? true;
  const authorInfo = resolveNoteAuthor(note);

  return (
    <div
      onClick={() => noteId && navigate(`/notes/${noteId}`)}
      className={`
        w-full
        bg-white cursor-pointer rounded-2xl
        border border-gray-100
        shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-300
        ${compact ? "p-4" : "p-4 sm:p-6"}
      `}
    >
      {/* ================= TOP CONTENT ================= */}
      <div className="flex gap-4 items-start">
        {/* Thumbnail (fixed size, never square card) */}
        <div className="flex-shrink-0">
          <div
            className="
              w-20 h-20 sm:w-24 sm:h-24
              rounded-xl
              bg-gradient-to-br from-[#9f3562] to-[#b8447a]
              flex items-center justify-center
            "
          >
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 mb-1">
            {renderText(note.title) || "Untitled Notes"}
          </h2>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {renderText(note.description)}
          </p>

          {/* NEW: Clickable Hashtags Display */}
          {note.hashtags && note.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {note.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents opening the note detail page
                    navigate(`/explore?tag=${encodeURIComponent(tag)}`); // Navigates to feed with filter
                  }}
                  className="text-[#9f3562] bg-[#9f3562]/10 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[#9f3562] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Price + Stats */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Price */}
            <span
              className={`
                px-2.5 py-1 rounded-lg text-xs font-semibold
                ${
                  isFree
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }
              `}
            >
              {isFree
                ? "FREE"
                : typeof note?.price === "number"
                ? `₹${note.price}`
                : "Paid"}
            </span>

            {/* Likes */}
            <span className="flex items-center gap-1.5 text-pink-600 font-semibold text-xs sm:text-sm">
              <Heart className="w-4 h-4 fill-pink-500" />
              {note?.likes ?? 0}
            </span>

            {/* Views */}
            <span className="flex items-center gap-1.5 text-[#9f3562] font-semibold text-xs sm:text-sm">
              <Eye className="w-4 h-4" />
              {note?.views ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left Meta */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Uploader — same attribution pattern as posts */}
            <button
              type="button"
              disabled={!authorInfo.profilePath}
              onClick={(e) => {
                e.stopPropagation();
                if (authorInfo.profilePath) navigate(authorInfo.profilePath);
              }}
              className={`flex items-center gap-3 min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left transition-colors ${
                authorInfo.profilePath
                  ? "hover:bg-slate-100 hover:border-[#9f3562]/30 cursor-pointer"
                  : "cursor-default opacity-90"
              }`}
            >
              <img
                src={authorInfo.image}
                alt=""
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm flex-shrink-0 bg-white"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {authorInfo.displayName}
                </p>
                {authorInfo.username ? (
                  <p className="text-xs text-[#9f3562] font-semibold truncate">
                    @{authorInfo.username}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Uploader</p>
                )}
              </div>
            </button>

            {/* Pages */}
            <div className="flex items-center gap-2 text-gray-700">
              <File className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {note?.pages ? `${note.pages} pages` : "Pages N/A"}
              </span>
            </div>
          </div>

          {/* Standard / Tag */}
          <span className="self-start sm:self-auto text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-[#9f3562]/10 text-[#9f3562] border border-[#9f3562]/20">
            {renderText(note.standard) || "General"}
          </span>
        </div>
      )}
    </div>
  );
};

export default NotesCard;