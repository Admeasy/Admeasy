import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Sparkles, Loader2 } from 'lucide-react';
import CommentCard from './CommentCard';

const PAGE_SIZE = 10;

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-200 to-pink-400" />
          <div className="flex-1">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="mt-3 h-4 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Minimal toast helper: prefer react-hot-toast if available, otherwise use a tiny fallback
const toast = {
  async success(msg) {
    try {
      const rh = await import('react-hot-toast');
      rh.toast.success(msg, { style: { background: 'linear-gradient(90deg,#9f3562,#b14270)', color: 'white' } });
      return;
    } catch (e) {
      // fallback: simple DOM toast
      _fallbackToast(msg, 'success');
    }
  },
  async error(msg) {
    try {
      const rh = await import('react-hot-toast');
      rh.toast.error(msg);
      return;
    } catch (e) {
      _fallbackToast(msg, 'error');
    }
  },
};

function _fallbackToast(msg, type = 'info') {
  const rootId = 'admeasy-toast-root';
  let root = document.getElementById(rootId);
  if (!root) {
    root = document.createElement('div');
    root.id = rootId;
    root.style.position = 'fixed';
    root.style.right = '16px';
    root.style.top = '16px';
    root.style.zIndex = '9999';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.innerText = msg;
  el.style.marginTop = '8px';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '12px';
  el.style.boxShadow = '0 6px 18px rgba(16,24,40,0.06)';
  el.style.color = '#08203A';
  el.style.background = type === 'error' ? 'rgba(254,226,226,0.95)' : 'linear-gradient(90deg,#9f3562,#b14270)';
  el.style.fontWeight = '600';
  el.style.fontSize = '13px';
  root.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

const CuetDiscussionSection = ({ selectedCourse, stream, category, score }) => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [composer, setComposer] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const loaderRef = useRef(null);

  const fetchComments = useCallback(async (p = 1) => {
    try {
      if (p === 1) setLoading(true);
      const res = await axios.get('/api/cuet-discussions', { params: { page: p, limit: PAGE_SIZE, course: selectedCourse?.label, stream, category } });
      const data = res?.data || {};
      const items = Array.isArray(data.comments) ? data.comments : [];
      const pagination = data.pagination || {};
      
      setComments((prev) => (p === 1 ? items : [...prev, ...items]));
      setHasMore(pagination.hasMore !== false);
    } catch (e) {
      console.error('Failed to fetch comments', e);
      toast.error(e?.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, stream, category]);

  useEffect(() => {
    // reset when context changes
    setPage(1);
    fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.label, stream, category]);

  // infinite loader
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      });
    }, { rootMargin: '200px' });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loaderRef, hasMore, loading]);

  useEffect(() => {
    if (page === 1) return;
    fetchComments(page);
  }, [page, fetchComments]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const postComment = useCallback(async (content, parentId = null) => {
    if (!content || posting || cooldown > 0) return;
    setPosting(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      content,
      displayName: null,
      avatar: '',
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      status: 'posting',
    };
    if (!parentId) setComments((c) => [optimistic, ...c]);
    try {
      const endpoint = parentId ? '/api/cuet-discussions/reply' : '/api/cuet-discussions/comment';
      const body = parentId 
        ? { content, parentCommentId: parentId }
        : { content, course: selectedCourse?.label, stream, category, score };
      
      const res = await axios.post(endpoint, body);
      const saved = res?.data?.comment || res?.data?.reply;
      
      if (saved) {
        if (!parentId) {
          setComments((prev) => [saved, ...prev.filter((it) => it._id !== tempId)]);
          toast.success('Comment posted successfully!');
        } else {
          setComments((prev) => prev.map((c) => (c._id === parentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c)));
          toast.success('Reply posted successfully!');
        }
        setComposer('');
        setCooldown(0);
      } else {
        toast.error(res?.data?.message || 'Failed to post');
        setComments((prev) => prev.filter((c) => c._id !== tempId));
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      const msg = err?.response?.data?.message || 'Failed to post. Try again.';
      
      // Handle rate limit (429) - extract seconds and set cooldown
      if (err?.response?.status === 429) {
        const match = msg.match(/\d+/);
        if (match) {
          const seconds = Number(match[0]);
          setCooldown(seconds);
        }
      }
      
      toast.error(msg);
      setComments((prev) => prev.filter((c) => c._id !== tempId));
    } finally {
      setPosting(false);
    }
  }, [selectedCourse, stream, category, score, posting, cooldown]);

  const likeComment = useCallback(async (comment) => {
    const id = comment._id || comment.id;
    const currentLikes = comment.likesCount || 0;
    const wasLiked = comment.liked;
    
    // optimistic
    setComments((prev) => prev.map((c) => 
      (c._id === id ? { ...c, likesCount: wasLiked ? currentLikes - 1 : currentLikes + 1, liked: !wasLiked } : c)
    ));
    
    try {
      const res = await axios.post(`/api/cuet-discussions/like/${id}`);
      if (res?.data?.success) {
        setComments((prev) => prev.map((c) => 
          (c._id === id ? { ...c, likesCount: res.data.likesCount, liked: res.data.liked } : c)
        ));
      }
    } catch (e) {
      console.error('Like failed', e);
      // revert optimistic
      setComments((prev) => prev.map((c) => 
        (c._id === id ? { ...c, likesCount: currentLikes, liked: wasLiked } : c)
      ));
      const msg = e?.response?.data?.message || 'Failed to like';
      toast.error(msg);
    }
  }, []);

  const handleReply = useCallback(async (parent, text) => {
    await postComment(text, parent.id || parent._id);
  }, [postComment]);

  const empty = !loading && comments.length === 0;

  return (
    <section aria-labelledby="cuet-discussion-heading" className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="top-16 z-10 mb-4 bg-white/80 py-2 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="cuet-discussion-heading" className="text-lg font-semibold text-slate-900">Student Discussion</h3>
            <p className="mt-1 text-[12px] text-slate-500">Discuss expected colleges, cutoffs, preferences, and CUET strategy with other aspirants.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Live Discussions
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-pink-50 bg-gradient-to-r from-pink-50/60 to-amber-50/40 p-3 text-sm text-slate-700 flex items-center gap-3">
          <Info className="h-4 w-4 text-amber-600" />
          <div>
            <div>If you're not logged in, a new anonymous username may be assigned whenever you comment.</div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="mt-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-200 to-pink-400 flex items-center justify-center text-white font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.9-12.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="flex-1">
              <textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                disabled={cooldown > 0}
                placeholder={cooldown > 0 ? `You can comment again in ${cooldown}s` : "Ask about cutoffs, expected colleges, preference lists..."}
                className="w-full resize-none rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
              />

              <div className="mt-3 flex items-center gap-3">
                <div className="text-xs text-slate-500">{composer.length}/1000</div>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!composer.trim() || cooldown > 0) return;
                      await postComment(composer.trim());
                      setComposer('');
                    }}
                    disabled={posting || !composer.trim() || cooldown > 0}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      cooldown > 0
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed opacity-60'
                        : posting
                        ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white opacity-75'
                        : 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:scale-105'
                    }`}
                  >
                    {cooldown > 0 ? (
                      <span>Wait {cooldown}s</span>
                    ) : posting ? (
                      <><Loader2 className="h-4 w-4 animate-spin"/> Posting</>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <Skeleton />
        ) : empty ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h4 className="text-lg font-semibold text-slate-900">No discussions yet. Start the conversation.</h4>
            <p className="mt-2 text-sm text-slate-500">Share what you expect for cutoffs, colleges, or preference lists.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentCard key={c._id || c.id} comment={c} onLike={likeComment} onReply={handleReply} />
            ))}
            <div ref={loaderRef} className="pt-6 pb-2 text-center text-sm text-slate-500">
              {hasMore ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse delay-75" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse delay-150" />
                </div>
              ) : (
                <div className="text-xs text-slate-400">End of discussions</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CuetDiscussionSection;
