import { useState } from "react";
import { CheckCircle2, Loader2, XCircle, HelpCircle, BarChart2 } from "lucide-react";
import { toast } from "react-toastify";

const McqCard = ({ post, onAnswer }) => {
  const [submitting, setSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const mcq = localPost.mcq;
  if (!mcq) return null;

  const { options = [], question, hasAnswered, userSelectedOptionId, isUserCorrect } = mcq;
  const showResults = Boolean(hasAnswered);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
      className="mt-2 group/mcq w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#9f3562] p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <HelpCircle className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-0.5">
              ADMEASY MCQ
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight break-words">
              {question}
            </h3>
          </div>
        </div>

        {/* Options Section */}
        <div className="p-3 sm:p-4 space-y-2.5">
          {options.map((opt, index) => {
            const idStr = opt._id?.toString?.() ?? opt._id;
            const isSelected = userSelectedOptionId?.toString() === idStr?.toString();
            const isCorrect = opt.isCorrect;
            const percentage = opt.percentage ?? 0;
            const letter = letters[index] || "?";

            // State-based styles
            let badgeStyle = "bg-white border-blue-400 text-blue-500 group-hover:border-[#9f3562] group-hover:text-[#9f3562]";
            let trackStyle = "bg-slate-50";
            let fillStyle = "bg-blue-100";
            let textStyle = "text-slate-700";
            let percentageStyle = "text-blue-500";

            if (showResults) {
              if (isCorrect) {
                badgeStyle = "bg-emerald-500 border-emerald-500 text-white";
                trackStyle = "bg-emerald-50 border-emerald-100";
                fillStyle = "bg-emerald-100";
                textStyle = "text-emerald-900";
                percentageStyle = "text-emerald-600";
              } else if (isSelected && !isCorrect) {
                badgeStyle = "bg-red-500 border-red-500 text-white";
                trackStyle = "bg-red-50 border-red-100";
                fillStyle = "bg-red-100";
                textStyle = "text-red-900";
                percentageStyle = "text-red-600";
              }
            } else if (submitting) {
              badgeStyle = "bg-slate-100 border-slate-200 text-slate-400";
            }

            return (
              <div key={idStr} className="relative">
                <button
                  type="button"
                  disabled={submitting || showResults}
                  onClick={() => handleAnswer(opt._id)}
                  className={`w-full group relative flex items-center gap-2.5 p-0.5 rounded-xl transition-all duration-300 ${
                    submitting || showResults ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  {/* Alphabet Circle */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 shadow-sm border-2 ${badgeStyle}`}>
                    {letter}
                  </div>

                  {/* Progress Bar and Label */}
                  <div className={`flex-1 relative h-8 sm:h-9 rounded-full border overflow-hidden shadow-inner transition-all duration-300 ${trackStyle}`}>
                    {/* The "Liquid" Progress Fill */}
                    {showResults && (
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full ${fillStyle}`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </div>
                    )}

                    {/* Content over progress */}
                    <div className="absolute inset-0 px-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {showResults && isCorrect && <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />}
                        {showResults && isSelected && !isCorrect && <XCircle size={12} className="text-red-600 shrink-0" />}
                        <span className={`text-[11px] sm:text-[13px] font-semibold truncate ${textStyle}`}>
                          {opt.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {showResults && (
                          <span className={`text-[10px] sm:text-[12px] font-bold tabular-nums ${percentageStyle}`}>
                            {percentage}%
                          </span>
                        )}
                        {!showResults && submitting && (
                          <Loader2 size={12} className="animate-spin text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-4 pb-3 flex items-center justify-between text-[9px] sm:text-[10px] font-medium border-t border-slate-50 pt-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <BarChart2 size={12} className="text-slate-300" />
            <span>{mcq.totalAnswers || 0} participants</span>
          </div>
          {showResults ? (
            <div className="flex items-center gap-1.5">
               <span className={isUserCorrect ? "text-emerald-600" : "text-red-600"}>
                {isUserCorrect ? "Correct answer!" : "Wrong answer"}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 animate-pulse">Select the correct option</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default McqCard;
