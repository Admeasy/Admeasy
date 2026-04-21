import { useState } from "react";
import { BarChart2, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";

const PollCard = ({ post, onVote }) => {
  const [voting, setVoting] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const { poll, hasVoted, userVotedOption } = localPost;

  // ── Cast Vote ──────────────────────────────────────────────
  const handleVote = async (optionId) => {
    if (hasVoted || voting) return;

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

      // Update local state immediately — no refetch needed
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

      // Tell parent (feed) to update this post in its list
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
      className="mt-1"
      onClick={(e) => e.stopPropagation()} // prevent card navigation when clicking options
    >
      {/* Question */}
      <p className="text-[15px] font-semibold text-slate-800 mb-4 leading-snug">
        {poll.question}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((opt) => {
          const isVoted =
            localPost.userVotedOption?.toString() === opt._id?.toString();
          const percentage = opt.percentage ?? 0;

          // ── Results view (after voting) ──────────────────────
          if (showResults) {
            return (
              <div key={opt._id} className="relative">
                <div
                  className={`relative overflow-hidden rounded-xl border px-4 py-3 ${
                    isVoted
                      ? "border-[#9f3562] bg-[#9f3562]/5"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {/* Progress bar fill */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-all duration-700 ease-out ${
                      isVoted ? "bg-[#9f3562]/10" : "bg-slate-100"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  {/* Text row */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Voted indicator */}
                      {isVoted && (
                        <span className="w-2 h-2 rounded-full bg-[#9f3562] flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isVoted ? "text-[#9f3562]" : "text-slate-700"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isVoted ? "text-[#9f3562]" : "text-slate-500"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // ── Voting view (before voting) ──────────────────────
          return (
            <button
              key={opt._id}
              onClick={() => handleVote(opt._id)}
              disabled={voting}
              className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white
                hover:border-[#9f3562]/50 hover:bg-[#9f3562]/5 hover:text-[#9f3562]
                transition-all duration-200 text-sm font-medium text-slate-700
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-between group"
            >
              <span>{opt.text}</span>
              {voting && (
                <Loader2 size={14} className="animate-spin text-[#9f3562]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer — vote count */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <BarChart2 size={13} />
        <span>
          {showResults
            ? `${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""}`
            : "Tap an option to vote"}
        </span>
        {showResults && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-[#9f3562] font-medium">You voted</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PollCard;
