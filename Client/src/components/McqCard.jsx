import { useState } from "react";
import { CheckCircle2, Loader2, XCircle, HelpCircle } from "lucide-react";
import { toast } from "react-toastify";

const McqCard = ({ post, onAnswer }) => {
  const [submitting, setSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const mcq = localPost.mcq;
  if (!mcq) return null;

  const { options = [], question, hasAnswered, userSelectedOptionId, isUserCorrect } =
    mcq;

  // Only show scores / correct highlight after this viewer has answered (not from leaked fields)
  const showResults = Boolean(hasAnswered);

  const handleAnswer = async (optionId) => {
    if (hasAnswered || submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/posts/${localPost._id}/mcq-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ optionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not submit answer");
      }

      const updated = {
        ...localPost,
        mcq: data.mcq,
      };
      setLocalPost(updated);
      if (onAnswer) onAnswer(updated);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <HelpCircle size={14} className="text-[#9f3562]" />
        <span>Multiple choice</span>
      </div>

      <p className="text-[15px] font-semibold text-slate-800 mb-4 leading-snug">
        {question}
      </p>

      <div className="space-y-3">
        {options.map((opt) => {
          const idStr = opt._id?.toString?.() ?? opt._id;
          const isSelected =
            userSelectedOptionId?.toString() === idStr?.toString();

          if (showResults) {
            const isCorrect = opt.isCorrect;
            return (
              <div
                key={idStr}
                className={`relative overflow-hidden rounded-xl border px-4 py-3 ${
                  isCorrect
                    ? "border-emerald-400 bg-emerald-50"
                    : isSelected && !isCorrect
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-700 ease-out ${
                    isCorrect ? "bg-emerald-100/60" : "bg-slate-100"
                  }`}
                  style={{
                    width: `${opt.percentage ?? 0}%`,
                  }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCorrect && (
                      <CheckCircle2
                        className="text-emerald-600 shrink-0"
                        size={18}
                      />
                    )}
                    {isSelected && !isCorrect && (
                      <XCircle className="text-red-500 shrink-0" size={18} />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isCorrect
                          ? "text-emerald-900"
                          : isSelected
                          ? "text-red-900"
                          : "text-slate-700"
                      }`}
                    >
                      {opt.text}
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-600 shrink-0">
                    {opt.percentage ?? 0}%
                  </span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={idStr}
              type="button"
              onClick={() => handleAnswer(opt._id)}
              disabled={submitting}
              className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white
                hover:border-[#9f3562]/50 hover:bg-[#9f3562]/5 hover:text-[#9f3562]
                transition-all duration-200 text-sm font-medium text-slate-700
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-between group"
            >
              <span>{opt.text}</span>
              {submitting && (
                <Loader2 size={14} className="animate-spin text-[#9f3562]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>
          {showResults
            ? `${mcq.totalAnswers ?? 0} answer${
                mcq.totalAnswers !== 1 ? "s" : ""
              }`
            : "Tap an option to answer"}
        </span>
        {showResults && hasAnswered && isUserCorrect !== null && (
          <>
            <span className="text-slate-300">·</span>
            <span
              className={
                isUserCorrect
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-red-600"
              }
            >
              {isUserCorrect ? "Correct" : "Incorrect"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default McqCard;
