import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Check, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReplyBox from './ReplyBox';

const randomGradient = (seed) => {
  const grads = [
    'from-pink-200 to-pink-400',
    'from-amber-200 to-amber-400',
    'from-sky-200 to-sky-400',
    'from-emerald-200 to-emerald-400',
    'from-violet-200 to-violet-400',
  ];
  return grads[Math.abs(seed) % grads.length];
};

const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const CommentCard = ({ comment, onLike, onReply }) => {
  const [openReplies, setOpenReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  const seed = useMemo(() => {
    return (comment?.displayName || comment?.username || comment?._id || '')
      .toString()
      .split('')
      .reduce((a, c) => a + c.charCodeAt(0), 0);
  }, [comment]);

  const avatarGradient = useMemo(() => randomGradient(seed), [seed]);

  const displayName = comment?.displayName || 'Anonymous';

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(comment);
    } finally {
      setIsLiking(false);
    }
  }, [onLike, comment, isLiking]);

  const handleToggleReplies = useCallback(async () => {
    if (!openReplies && !repliesLoaded) {
      // Load replies
      setLoadingReplies(true);
      try {
        const res = await axios.get(`/api/cuet-discussions/replies/${comment._id}`, {
          params: { page: 1, limit: 10 }
        });
        setReplies(res.data.replies || []);
        setRepliesLoaded(true);
      } catch (err) {
        console.error('Failed to load replies', err);
      } finally {
        setLoadingReplies(false);
      }
    }
    setOpenReplies(!openReplies);
  }, [openReplies, repliesLoaded, comment._id]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {comment?.avatar ? (
            <img src={comment.avatar} alt="avatar" className="h-11 w-11 rounded-full object-cover border" />
          ) : (
            <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold`}>
              {String(displayName?.charAt(0) || 'A').toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {comment?.isAnonymous || !comment?.username ? (
                      <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                    ) : (
                      <Link
                        to={`/${comment.username}`}
                        className={`text-sm font-semibold truncate transition-colors duration-200 cursor-pointer ${
                          comment?.role === 'mentor'
                            ? 'text-pink-700 hover:text-pink-800'
                            : 'text-slate-900 hover:text-[#d9468f]'
                        }`}
                      >
                        {displayName}
                      </Link>
                    )}
                    {comment?.role === 'mentor' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-700">
                        <Check className="h-3 w-3" /> Mentor
                      </span>
                    ) : null}
                    {comment?.course ? (
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{comment.course}</span>
                    ) : null}
                  </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                <Clock className="h-3 w-3" /> <span>{formatTime(comment?.createdAt || comment?.lastActivityAt || Date.now())}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-700 leading-relaxed break-words">
            {comment?.content}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <motion.span whileTap={{ scale: 0.85 }} animate={comment?.liked ? { scale: 1.05 } : { scale: 1 }} className="flex items-center">
                <Heart className={`h-4 w-4 ${comment?.liked ? 'text-rose-500' : 'text-slate-400'}`} />
              </motion.span>
              <span className="text-xs">{comment?.likesCount ?? comment?.likes ?? 0}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleReplies}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{(comment?.repliesCount ?? 0)}</span>
            </button>
          </div>

          <AnimatePresence>
            {openReplies && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <div className="space-y-3">
                  {loadingReplies ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                      <span className="ml-2 text-sm text-slate-500">Loading replies...</span>
                    </div>
                  ) : replies.length > 0 ? (
                    replies.map((r) => (
                      <div key={r._id || r.id} className="ml-10 rounded-lg border border-gray-100 bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                          {r.isAnonymous || !r.username ? (
                            <div className="text-xs font-semibold text-slate-900">{r.displayName || 'Reply'}</div>
                          ) : (
                            <Link
                              to={`/${r.username}`}
                              className={`text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                                r.role === 'mentor'
                                  ? 'text-pink-700 hover:text-pink-800'
                                  : 'text-slate-900 hover:text-[#d9468f]'
                              }`}
                            >
                              {r.displayName || 'Reply'}
                            </Link>
                          )}
                          {r.role === 'mentor' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-700">
                              <Check className="h-3 w-3" /> Mentor
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">{r.content}</div>
                        <div className="mt-2 text-xs text-slate-500">{formatTime(r.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="ml-10 rounded-lg border border-dashed border-gray-200 bg-slate-50 p-3 text-center text-sm text-slate-500">
                      No replies yet. Be the first!
                    </div>
                  )}

                  <div className="ml-0">
                    <ReplyBox
                      placeholder={`Reply to ${displayName}...`}
                      onSubmit={async (text) => {
                        await onReply(comment, text);
                        // Refresh replies
                        setReplies([]);
                        setRepliesLoaded(false);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
};

export default memo(CommentCard);
