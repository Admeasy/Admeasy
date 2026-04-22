import React, { useState } from "react";
import { Send, Loader2, HelpCircle, X, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

const CreateMcqTab = ({ spaces = [], spacesLoading = false, category = "study", setCategory, spaceId = "", setSpaceId }) => {
  const [question, setQuestion] = useState("");
  const [headline, setHeadline] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
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

  const handleOptionChange = (index, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const resetForm = () => {
    setQuestion("");
    setHeadline("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setHashtags([]);
  };

  const validate = () => {
    if (!headline.trim()) {
      toast.error("Please enter a headline for the MCQ");
      return false;
    }
    if (!question.trim()) {
      toast.error("Please enter a question");
      return false;
    }
    const filled = options.map((o) => o.trim());
    if (filled.some((o) => !o)) {
      toast.error("All 4 options are required");
      return false;
    }
    const unique = new Set(filled.map((o) => o.toLowerCase()));
    if (unique.size !== filled.length) {
      toast.error("All options must be unique");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const payloadOptions = options.map((text, i) => ({
        text: text.trim(),
        isCorrect: i === correctIndex,
      }));

      const formData = new FormData();
      formData.append("type", "mcq");
      formData.append("headline", headline.trim());
      formData.append("content", question.trim());
      formData.append("question", question.trim());
      formData.append("category", category);
      if (spaceId) formData.append("spaceId", spaceId);
      if (hashtags.length > 0) {
        formData.append("hashtags", JSON.stringify(hashtags));
      }
      formData.append("options", JSON.stringify(payloadOptions));

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to publish Q&A");
      }

      toast.success("Q&A published! 📚");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          placeholder="e.g., 'A quick calculus challenge!'"
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

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          MCQ Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562]/50 transition-all resize-none text-sm text-slate-800 placeholder:text-slate-400"
          placeholder="e.g. What is the derivative of x²?"
        />
        <p className="text-xs text-slate-400 text-right mt-1">
          {question.length}/300
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Four options — select the correct one
        </label>
        <div className="space-y-3">
          {options.map((opt, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <label className="flex items-center gap-2 pt-2.5 shrink-0 cursor-pointer">
                <input
                  type="radio"
                  name="mcq-correct"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  className="accent-[#9f3562] w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-500 w-5">
                  {String.fromCharCode(65 + index)}
                </span>
              </label>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                maxLength={100}
                className="flex-1 px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={15} className="text-[#9f3562]" />
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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
                  correctIndex === index
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <span className="font-bold text-slate-400 w-5">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{opt}</span>
                {correctIndex === index && (
                  <span className="ml-auto text-xs font-semibold text-emerald-700">
                    Correct
                  </span>
                )}
              </div>
            ) : null,
          )}
        </div>
      </div>

      <button
        type="button"
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
            <span>Publish Q&A</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CreateMcqTab;
