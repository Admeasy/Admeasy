import React, { useState } from "react";
import { Plus, Trash2, Send, Loader2, BarChart2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

const CreatePollTab = ({ spaces = [], spacesLoading = false, category = "study", setCategory, spaceId = "", setSpaceId }) => {
  const [question, setQuestion] = useState("");
  const [headline, setHeadline] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");

  const handleHashtagKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newTag = hashtagInput.trim().replace(/^#/, "");
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

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
    setHeadline("");
    setOptions(["", ""]);
    setHashtags([]);
  };

  /* ── Validation ── */
  const validate = () => {
    if (!headline.trim()) {
      toast.error("Please enter a headline for the poll");
      return false;
    }
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

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("type", "poll");
      formData.append("headline", headline.trim());
      formData.append("question", question.trim());
      formData.append("category", category);
      if (spaceId) formData.append("spaceId", spaceId);
      if (hashtags.length > 0) {
        formData.append("hashtags", JSON.stringify(hashtags));
      }
      formData.append(
        "options",
        JSON.stringify(
          options
            .filter((o) => o.trim())
            .map((text) => ({ text: text.trim(), votes: 0 })),
        ),
      );

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        body: formData,
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
      {/* ─── Headline ──────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Headline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g., 'Which city is best for JEE prep?'"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm"
          maxLength={150}
        />
        <div className="text-[10px] text-gray-300 text-right mt-0.5">{headline.length}/150</div>
      </div>

      {/* ─── Category & Space ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Post to Category</label>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 gap-1 w-full">
            {[
              { key: 'study', label: '📚 Study' },
              { key: 'masti', label: '😎 Masti' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${category === key
                  ? 'bg-white text-[#9f3562] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Space</label>
          <select
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
            disabled={spacesLoading}
          >
            <option value="">🌐 Select a Space (Optional)</option>
            {spaces.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Hashtags ─────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
        <div className="w-full p-2.5 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#9f3562]/20 focus-within:border-[#9f3562]/50 min-h-[46px] bg-white flex flex-wrap gap-2 items-center transition-all">
          {hashtags.map((tag, index) => (
            <span key={index} className="bg-[#9f3562]/10 text-[#9f3562] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              #{tag}
              <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-red-500"><X size={12} /></button>
            </span>
          ))}
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            className="flex-1 outline-none border-none bg-transparent min-w-[120px] text-sm text-slate-700 placeholder:text-slate-400"
            placeholder="Add tags..."
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Poll Question <span className="text-red-500">*</span>
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
