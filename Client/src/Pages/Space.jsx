import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  MoreVertical,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import SEO from '../components/SEO';

const fallbackAvatar =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const Space = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const loggedInAccount = user || mentor;

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningOrLeaving, setJoiningOrLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageMenuOpenId, setMessageMenuOpenId] = useState(null);
  const [deletingSpace, setDeletingSpace] = useState(false);
  const menuRef = useRef(null);
  const messageMenuRefs = useRef({});
  const isMember = space?.isMember;
  const isCreator =
    !!loggedInAccount &&
    space?.creator &&
    space.creator.id &&
    loggedInAccount._id &&
    loggedInAccount._id.toString() === space.creator.id.toString();

  const fetchSpace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/spaces/${id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load space');
      }
      setSpace(data.space);
    } catch (err) {
      console.error('Error fetching space:', err);
      setError(err.message || 'Failed to load space');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [space?.messages?.length]);

  // Close main menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageMenuOpenId) {
        const menuRef = messageMenuRefs.current[messageMenuOpenId];
        if (menuRef && !menuRef.contains(event.target)) {
          setMessageMenuOpenId(null);
        }
      }
    };

    if (messageMenuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [messageMenuOpenId]);

  const handleJoinLeave = async (action) => {
    if (!loggedInAccount) {
      toast.info('Please log in to join spaces');
      navigate('/login');
      return;
    }
    try {
      setJoiningOrLeaving(true);
      const res = await fetch(`/api/spaces/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || `Failed to ${action} space`);
      }
      toast.success(action === 'join' ? 'Joined space' : 'Left space');
      await fetchSpace();
      setMenuOpen(false);
    } catch (err) {
      console.error('Error joining/leaving space:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setJoiningOrLeaving(false);
    }
  };

  const handlePostMessage = async () => {
    if (!loggedInAccount) {
      toast.info('Please log in to post in spaces');
      navigate('/login');
      return;
    }
    if (!isMember) {
      toast.info('Join the space first to post');
      return;
    }
    if (!messageText.trim() && !imageFile) {
      return;
    }
    try {
      setPosting(true);
      const formData = new FormData();
      formData.append('content', messageText.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (replyTo) {
        formData.append('replyToMessageId', replyTo._id);
      }
      const res = await fetch(`/api/spaces/${id}/messages`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to post');
      }
      setMessageText('');
      setImageFile(null);
      setReplyTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchSpace();
    } catch (err) {
      console.error('Error posting message:', err);
      toast.error(err.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (messageId) => {
    if (!loggedInAccount) {
      toast.info('Please log in to like messages');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(
        `/api/spaces/${id}/messages/${messageId}/like`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to like message');
      }
      setSpace((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((m) =>
          m._id === messageId
            ? {
                ...m,
                likesCount: data.likesCount,
                // Track like state per current user to drive UI
                isLiked: data.isLiked,
              }
            : m
        );
        return { ...prev, messages: updatedMessages };
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to like message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!loggedInAccount) {
      toast.info('Please log in to delete messages');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(
        `/api/spaces/${id}/messages/${messageId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete message');
      }
      setSpace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m) => m._id !== messageId),
        };
      });
      setMessageMenuOpenId(null);
      toast.success('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(err.message || 'Failed to delete message');
    }
  };

  const buildReplyPreview = (message) => {
    if (!message) return null;
    const text = message.content || '';
    return text.length > 80 ? `${text.slice(0, 80)}...` : text;
  };

  const findMessageById = (messageId) =>
    space?.messages?.find((m) => m._id === messageId);

  const shareSpaceLink = async () => {
    const url = `${window.location.origin}/spaces/${space._id}`;
    const title = `${space.name} on Admeasy`;
    const text = space.description || 'Join this study space on Admeasy';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Space link copied to clipboard');
    } catch {
      toast.info(url);
    }
  };

  const handleDeleteSpace = async () => {
    if (!loggedInAccount || !space || deletingSpace) return;
    setDeletingSpace(true);
    try {
      const res = await fetch(`/api/spaces/${space._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete space');
      }
      toast.success('Space deleted successfully');
      setDeleteConfirmOpen(false);
      navigate('/spaces');
    } catch (err) {
      console.error('Error deleting space:', err);
      toast.error(err.message || 'Failed to delete space');
    } finally {
      setDeletingSpace(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="w-14 h-14 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !space) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-2xl border border-gray-100 shadow-sm max-w-md w-full p-6 text-center">
          <p className="text-gray-800 font-semibold mb-2">
            {error || 'Space not found'}
          </p>
          <button
            onClick={() => navigate('/spaces')}
            className="mt-2 px-4 py-2 rounded-xl bg-[#9f3562] text-white text-sm font-semibold hover:bg-[#b14270] transition-colors cursor-pointer"
          >
            Go back to Spaces
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      <SEO
        title={`${space.name} - Space | Admeasy`}
        description={space.description || 'Public study community space'}
        url={`https://admeasy.in/spaces/${space._id}`}
      />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-28 sm:pb-32 relative z-10 flex flex-col gap-4 h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 border border-gray-100 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-[#9f3562]/40 hover:text-[#9f3562] shadow-sm hover:shadow-md transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="flex items-center gap-2 min-w-0 text-left cursor-pointer">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                {space.logo ? (
                  <img
                    src={space.logo}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-[#9f3562]">
                    {space.name?.[0]?.toUpperCase() || 'S'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {space.name}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span className="truncate">
                    {space.membersCount || space.members?.length || 0} members
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            {!isMember ? (
              <button
                onClick={() => handleJoinLeave('join')}
                disabled={joiningOrLeaving}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-[#9f3562] text-white text-xs sm:text-sm font-semibold hover:bg-[#b14270] disabled:opacity-60 cursor-pointer"
              >
                Join
              </button>
            ) : (
              <>
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-[#9f3562]/40 hover:text-[#9f3562] shadow-sm hover:shadow-md transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30">
                      <button
                        onClick={() => handleJoinLeave('leave')}
                        disabled={joiningOrLeaving}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        Leave space
                      </button>
                      {isCreator && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setDeleteConfirmOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          Delete space
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Feed */}
        <section className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto space-y-3 pr-1">
            {space.messages && space.messages.length > 0 ? (
              space.messages.map((msg) => {
                const repliedTo = msg.replyTo
                  ? findMessageById(msg.replyTo)
                  : null;
                const actorId = loggedInAccount?._id;
                const hasLiked =
                  // Prefer explicit isLiked flag when present
                  msg.isLiked !== undefined
                    ? msg.isLiked
                    : msg.likes &&
                      actorId &&
                      msg.likes.some(
                        (l) => l.id && l.id.toString() === actorId.toString()
                      );

                return (
                  <article
                    key={msg._id}
                    className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-3 sm:p-4"
                  >
                    <div className="flex gap-3">
                      <img
                        src={msg.author?.image || fallbackAvatar}
                        alt={msg.author?.name || 'Member'}
                        className="max-w-8 max-h-8 sm:max-w-9 sm:max-h-9 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src = fallbackAvatar;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                              {msg.author?.name || 'Member'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {loggedInAccount &&
                              msg.author?.id &&
                              msg.author.id.toString() ===
                                loggedInAccount._id?.toString() && (
                                <div 
                                  ref={(el) => {
                                    if (el) {
                                      messageMenuRefs.current[msg._id] = el;
                                    } else {
                                      delete messageMenuRefs.current[msg._id];
                                    }
                                  }}
                                  className="relative ml-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMessageMenuOpenId((prev) =>
                                        prev === msg._id ? null : msg._id
                                      )
                                    }
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                  {messageMenuOpenId === msg._id && (
                                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="w-full text-left px-3 py-1.5 text-[11px] sm:text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                      >
                                        Delete message
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                        {msg.replyTo && (
                          <div className="mt-1 mb-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] sm:text-xs text-gray-500">
                            {repliedTo ? (
                              <>
                                Replying to{' '}
                                <span className="font-semibold">
                                  {repliedTo.author?.name || 'a message'}
                                </span>
                                : {buildReplyPreview(repliedTo)}
                              </>
                            ) : (
                              <span className="italic text-gray-500">
                                Post has been deleted.
                              </span>
                            )}
                          </div>
                        )}
                        <p className="mt-1 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        {msg.image && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
                            <img
                              src={msg.image}
                              alt="Space message"
                              className="w-full max-h-72 object-cover"
                            />
                          </div>
                        )}
                        {msg.externalLink && msg.externalLink.url && (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                msg.externalLink.url,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                            className="mt-2 w-full text-left text-[11px] sm:text-xs text-[#9f3562] underline underline-offset-2 line-clamp-1"
                          >
                            {msg.externalLink.preview?.title ||
                              msg.externalLink.url}
                          </button>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-[11px] sm:text-xs text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(msg._id)}
                            className="flex items-center gap-1 hover:text-red-500 cursor-pointer"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                hasLiked ? 'fill-red-500 text-red-500' : ''
                              }`}
                            />
                            <span>{msg.likesCount || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyTo(msg)}
                            className="flex items-center gap-1 hover:text-[#9f3562] cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="mt-10 text-center text-sm text-gray-500">
                No messages yet. Be the first one to start this space.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Composer - fixed at bottom, centered content */}
        <section className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white via-white/95 to-white/70">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-4">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between text-[11px] sm:text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="truncate">
                  Replying to{' '}
                  <span className="font-semibold">
                    {replyTo.author?.name || 'a message'}
                  </span>
                  : {buildReplyPreview(replyTo)}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              </div>
            )}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-sm px-3 sm:px-4 py-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-200 hover:border-[#9f3562]/40 hover:text-[#9f3562] cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <textarea
                rows={1}
                placeholder={
                  isMember
                    ? 'Share something with this space...'
                    : 'Join this space to start posting'
                }
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!isMember || posting}
                className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-32"
              />
              <button
                type="button"
                onClick={handlePostMessage}
                disabled={
                  !isMember ||
                  posting ||
                  (!messageText.trim() && !imageFile)
                }
                className="px-3 sm:px-4 py-1.5 rounded-full bg-[#9f3562] text-white text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-[#b14270] transition-colors"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                  }
                }}
              />
            </div>
            {imageFile && (
              <div className="mt-1 text-[11px] sm:text-xs text-gray-500 flex items-center gap-2">
                <span>Attached: {imageFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-[#9f3562] hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Space Info Modal */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-none sm:rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Space info</p>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-5 space-y-4">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
                  {space.logo ? (
                    <img
                      src={space.logo}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-[#9f3562]">
                      {space.name?.[0]?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {space.name}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 max-w-xs mx-auto">
                    {space.description || 'No description added yet.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-[#9f3562]" />
                  <span>
                    {space.membersCount || space.members?.length || 0} members
                  </span>
                </div>
                {space.creator && (
                  <p className="text-[11px] sm:text-xs text-gray-500 text-center">
                    Created on{' '}
                    <span className="font-semibold">
                      {new Date(space.createdAt).toLocaleDateString()}
                    </span>{' '}
                    by{' '}
                    {space.creator.username ? (
                      <Link
                        to={`/${space.creator.username}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#9f3562] hover:underline"
                      >
                        <img
                          src={space.creator.image || fallbackAvatar}
                          alt={space.creator.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>@{space.creator.name}</span>
                      </Link>
                    ) : (
                      <span className="font-semibold">
                        {space.creator.name || 'Someone'}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white/90">
              <button
                type="button"
                onClick={shareSpaceLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white text-sm font-semibold shadow-sm hover:shadow-lg hover:shadow-[#9f3562]/40 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share space link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Space Confirmation Modal (creator only) */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Delete this space?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  This action cannot be undone. All threads and messages in
                  <span className="font-semibold"> {space.name}</span> will be
                  permanently removed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSpace}
                onClick={handleDeleteSpace}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingSpace ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Space;