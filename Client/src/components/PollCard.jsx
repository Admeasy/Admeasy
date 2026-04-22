import { useState } from "react";
import { BarChart2, Loader2, Users, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

const PollCard = ({ post, onVote }) => {
  const [voting, setVoting] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const { poll, hasVoted, userVotedOption } = localPost;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // ── Cast Vote ──────────────────────────────────────────────
  const handleVote = async (optionId) => {
    if (voting) return;
    if (userVotedOption?.toString() === optionId?.toString()) return;

    try {
      setVoting(true);

      const res = await fetch(`/api/posts/${localPost._id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ optionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cast vote");
      }

      const updatedPost = {
        ...localPost,
        hasVoted: true,
        userVotedOption: optionId,
        poll: {
          ...localPost.poll,
          options: data.poll.options,
          totalVotes: data.poll.totalVotes,
        },
      };

      setLocalPost(updatedPost);
      if (onVote) onVote(updatedPost);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not cast vote");
    } finally {
      setVoting(false);
    }
  };

  if (!poll) return null;

  const showResults = hasVoted || localPost.hasVoted;

  return (
    <div
      className="mt-2 group/poll w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#9f3562] p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Users className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-0.5">
              ADMEASY POLL
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight break-words">
              {poll.question}
            </h3>
          </div>
        </div>

        {/* Options Section */}
        <div className="p-3 sm:p-4 space-y-2.5">
          {poll.options.map((opt, index) => {
            const isVoted = localPost.userVotedOption?.toString() === opt._id?.toString();
            const percentage = opt.percentage ?? 0;
            const letter = letters[index] || "?";

            return (
              <div key={opt._id} className="relative">
                <button
                  disabled={voting}
                  onClick={() => handleVote(opt._id)}
                  className={`w-full group relative flex items-center gap-2.5 p-0.5 rounded-xl transition-all duration-300 ${
                    voting ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                  }`}
                >
                  {/* Alphabet Circle */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 shadow-sm border-2 ${
                    isVoted 
                      ? "bg-[#9f3562] border-[#9f3562] text-white" 
                      : "bg-white border-blue-400 text-blue-500 group-hover:border-[#9f3562] group-hover:text-[#9f3562]"
                  }`}>
                    {letter}
                  </div>

                  {/* Progress Bar and Label */}
                  <div className="flex-1 relative h-8 sm:h-9 bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
                    {/* The "Liquid" Progress Fill */}
                    {showResults && (
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full ${
                          isVoted ? "bg-[#9f3562]/20" : "bg-blue-100"
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </div>
                    )}

                    {/* Content over progress */}
                    <div className="absolute inset-0 px-3 flex items-center justify-between pointer-events-none">
                      <span className={`text-[11px] sm:text-[13px] font-semibold truncate pr-2 ${
                        isVoted ? "text-[#9f3562]" : "text-slate-700"
                      }`}>
                        {opt.text}
                      </span>
                      {showResults && (
                        <div className="flex items-center gap-1">
                          {isVoted && <CheckCircle2 size={10} className="text-[#9f3562]" />}
                          <span className={`text-[10px] sm:text-[12px] font-bold tabular-nums ${
                            isVoted ? "text-[#9f3562]" : "text-blue-500"
                          }`}>
                            {percentage}%
                          </span>
                        </div>
                      )}
                      {!showResults && voting && (
                        <Loader2 size={12} className="animate-spin text-slate-400" />
                      )}
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
            <span>{poll.totalVotes || 0} participants</span>
          </div>
          {showResults ? (
            <span className="text-[#9f3562]">Voting updated</span>
          ) : (
            <span className="text-slate-400 animate-pulse">Select an option to vote</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCard;
