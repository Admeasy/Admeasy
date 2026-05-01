import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const AISidebar = ({ isOpen, onClose, noteId, noteTitle, sidebarWidth = 420, setSidebarWidth }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > window.innerWidth - 100) newWidth = window.innerWidth - 100;
      if (setSidebarWidth) setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging, setSidebarWidth]);

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);
  
  // Suggested questions
  const suggestedChips = [
    "Explain simply",
    "Important questions",
    "Make MCQs",
    "Viva questions",
    "Key formulas",
  ];

  useEffect(() => {
    if (isOpen && noteId && !summary && !loadingSummary && !summaryError) {
      fetchSummary();
    }
  }, [isOpen, noteId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatting]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setSummaryError("");
    try {
      const res = await fetch("/api/ai/summarize-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth headers if using Bearer token, else cookies will be sent automatically
        },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        setSummaryError(data.message || "Failed to generate summary.");
      }
    } catch (err) {
      setSummaryError("Network error. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSendChat = async (text = prompt) => {
    if (!text.trim()) return;

    const newMessage = { role: "user", content: text };
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);
    setPrompt("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/ai/chat-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          prompt: text,
          history: chatHistory.slice(-6), // Send last 6 messages for context
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.message || "Failed to get response"}` },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error while connecting to AI." },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/20 z-[90] lg:hidden backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className="fixed top-0 right-0 h-full w-full bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-100"
        style={{ width: window.innerWidth >= 1024 ? sidebarWidth : '100%' }}
      >
        {/* Resize Handle */}
        <div 
          className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-[#9f3562]/50 active:bg-[#9f3562] z-50 transition-colors hidden lg:block"
          onMouseDown={() => setIsDragging(true)}
        />
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#9f3562] blur-md opacity-30 rounded-xl"></div>
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#9f3562] to-[#d6578a] flex items-center justify-center shadow-lg shadow-[#9f3562]/30 border border-white/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-gray-900 leading-tight text-lg tracking-tight">AI Assistant</h2>
              <p className="text-xs text-gray-500 font-semibold truncate max-w-[200px]">{noteTitle || "Current Note"}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-200 rounded-full transition-all text-gray-500 hover:text-gray-900 hover:rotate-90 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 flex flex-col p-4 gap-6 custom-scrollbar">
          
          {/* Summary Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#9f3562]" /> 
              PDF Summary
            </h3>
            
            {loadingSummary ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ) : summaryError ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex flex-col items-center gap-2 text-center">
                <AlertCircle className="w-5 h-5" />
                <p>{summaryError}</p>
                <button 
                  onClick={fetchSummary}
                  className="mt-2 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none prose-headings:text-[#9f3562] prose-headings:font-black prose-strong:text-gray-900 prose-strong:font-black prose-strong:bg-yellow-100/50 prose-a:text-[#9f3562] prose-li:marker:text-[#9f3562] text-gray-700 leading-relaxed">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No summary available.</p>
            )}
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="flex flex-col gap-4 pb-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-slate-200" : "bg-[#9f3562]/10"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-[#9f3562]" />}
                  </div>
                  <div className={`px-4 py-3.5 rounded-3xl max-w-[85%] ${msg.role === "user" ? "bg-gradient-to-br from-[#9f3562] to-[#c24b7a] text-white rounded-tr-sm shadow-md shadow-[#9f3562]/20 border border-[#9f3562]/50" : "bg-white border border-[#9f3562]/10 shadow-md shadow-[#9f3562]/5 text-gray-700 rounded-tl-sm"}`}>
                    <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "text-white prose-p:text-white prose-strong:text-white prose-strong:font-black" : "prose-strong:text-gray-900 prose-strong:font-black prose-strong:bg-yellow-100/50 prose-li:marker:text-[#9f3562] leading-relaxed text-gray-700"}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#9f3562]/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#9f3562]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#9f3562] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#9f3562] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-[#9f3562] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(chip)}
                className="text-[11px] sm:text-xs font-bold px-3 py-1.5 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border border-slate-200 text-slate-700 rounded-full transition-all whitespace-nowrap shadow-sm hover:shadow"
              >
                {chip}
              </button>
            ))}
          </div>
          
          <div className="relative flex items-end gap-2 bg-white border border-slate-200 rounded-3xl p-1.5 focus-within:border-[#9f3562]/50 focus-within:ring-4 focus-within:ring-[#9f3562]/10 focus-within:shadow-md transition-all">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this PDF..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm text-gray-800 font-medium custom-scrollbar placeholder:text-gray-400"
              rows={1}
            />
            <button
              onClick={() => handleSendChat()}
              disabled={!prompt.trim() || isChatting}
              className="p-3 bg-gradient-to-br from-[#9f3562] to-[#c24b7a] hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 text-white rounded-2xl transition-all flex-shrink-0 shadow-md shadow-[#9f3562]/20"
            >
              {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">
            AI can make mistakes. Verify important information.
          </p>
        </div>

      </div>
    </>
  );
};

export default AISidebar;
