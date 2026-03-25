import React, { useState } from "react";
import { Send, Loader2, HelpCircle } from "lucide-react";
import { toast } from "react-toastify";

const CreateMcqTab = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionChange = (index, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const resetForm = () => {
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const validate = () => {
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
      formData.append("question", question.trim());
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

      toast.success("Q&A published!");
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
