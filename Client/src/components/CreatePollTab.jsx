import React, { useState } from "react";
import { Plus, Trash2, Send, Loader2, BarChart2 } from "lucide-react";
import { toast } from "react-toastify";

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

const CreatePollTab = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Option Handlers ── */
  const handleOptionChange = (index, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Reset ── */
  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
  };

  /* ── Validation ── */
  const validate = () => {
    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return false;
    }
    const filled = options.filter((o) => o.trim());
    if (filled.length < MIN_OPTIONS) {
      toast.error("At least 2 options are required");
      return false;
    }
    const unique = new Set(filled.map((o) => o.trim().toLowerCase()));
    if (unique.size !== filled.length) {
      toast.error("All options must be unique");
      return false;
    }
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      type: "poll",
      question: question.trim(),
      options: options
        .filter((o) => o.trim())
        .map((text) => ({ text: text.trim(), votes: 0 })),
    };

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create poll");
      }

      toast.success("Poll published! 📊");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── UI ── */
  return (
    <div className="space-y-5">
      {/* Question */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all resize-none text-sm text-slate-800 placeholder:text-slate-400"
          placeholder="Ask something interesting… e.g. Which chapter is hardest in Maths?"
        />
        <p className="text-xs text-slate-400 text-right mt-1">
          {question.length}/300
        </p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Options{" "}
          <span className="text-slate-400 font-normal">
            ({options.length}/{MAX_OPTIONS})
          </span>
        </label>

        <div className="space-y-3">
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Option number badge */}
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#9f3562]/10 text-[#9f3562] text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>

              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                maxLength={100}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm text-slate-800 placeholder:text-slate-400"
                placeholder={`Option ${index + 1}`}
              />

              {/* Remove button — only show if above minimum */}
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Remove option ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add option button */}
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 flex items-center gap-2 text-sm text-[#9f3562] font-semibold hover:text-[#b14270] transition-colors"
          >
            <Plus size={16} />
            Add another option
          </button>
        )}
      </div>

      {/* Poll preview hint */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={15} className="text-[#9f3562]" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Preview
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-800 mb-3">
          {question.trim() || "Your question will appear here…"}
        </p>

        <div className="space-y-2">
          {options.map((opt, index) =>
            opt.trim() ? (
              <div
                key={index}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
              >
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                <span className="text-sm text-slate-700">{opt}</span>
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#9f3562] hover:bg-[#b14270] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Publishing…</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Publish Poll</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CreatePollTab;
