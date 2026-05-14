import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const ReplyBox = ({ onSubmit, placeholder = 'Write a reply...', initial = '' }) => {
  const [value, setValue] = useState(initial);
  const [sending, setSending] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.style.height = 'auto';
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!value.trim()) return;
    try {
      setSending(true);
      await onSubmit(value.trim());
      setValue('');
    } finally {
      setSending(false);
    }
  }, [onSubmit, value]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // auto growth
          const el = e.target;
          el.style.height = 'auto';
          el.style.height = `${Math.min(300, el.scrollHeight)}px`;
        }}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20"
        rows={1}
      />

      <div className="flex items-center justify-end gap-3">
        <div className="text-xs text-slate-500 mr-auto">{value.length}/1000</div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={sending || !value.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b14270] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Posting...' : 'Reply'}
        </button>
      </div>
    </motion.div>
  );
};

export default ReplyBox;
