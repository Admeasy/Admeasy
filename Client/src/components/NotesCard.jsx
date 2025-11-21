import React from "react";
import { FileText, User, File, Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotesCard = ({ note, compact = false }) => {
  const navigate = useNavigate();
  const noteId = note._id || note.id;
  const isFree = note.isFree ?? true;

  return (
    <div
      onClick={() => noteId && navigate(`/notes/${noteId}`)}
      className={`bg-white cursor-pointer rounded-2xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all border border-gray-100 ${
        compact ? "p-4 min-w-[320px]" : "p-6 mb-6"
      }`}
    >
      <div className={`flex gap-4 ${compact ? "flex-col" : ""}`}>
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className={`${compact ? "w-full h-32" : "w-24 h-24"} rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3A32CF] flex items-center justify-center`}>
            <FileText className={`${compact ? "w-16 h-16" : "w-12 h-12"} text-white drop-shadow-md`} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h2 className={`${compact ? "text-lg" : "text-xl"} font-bold text-gray-900 mb-1`}>
            {note.title}
          </h2>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-2">
            {note.description}
          </p>
          
          {/* Price and Stats */}
          <div className="flex items-center gap-4 mt-3">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                isFree
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {isFree ? "FREE" : typeof note.price === "number" ? `₹${note.price}` : "Paid"}
            </span>
            <span className="flex items-center gap-2 text-pink-600 font-semibold">
              <Heart className="w-5 h-5 fill-pink-500" />
              <span className="text-base">{note.likes ?? 0}</span>
            </span>
            <span className="flex items-center gap-2 text-purple-600 font-semibold">
              <Eye className="w-5 h-5" />
              <span className="text-base">{note.views ?? 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 text-white bg-black px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">
                {note.uploaderName || note.uploader || "Unknown uploader"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <File className="w-4 h-4" />
              <span className="font-medium text-sm">
                {note.pages ? `${note.pages} pages` : "Pages N/A"}
              </span>
            </div>
          </div>

          <div className="text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md bg-red-50 text-red-700 border border-red-200">
            {note.standard || "General"}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesCard;
