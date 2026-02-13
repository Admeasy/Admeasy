import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMentor } from '../context/MentorContext';
import { useUser } from '../context/UserContext';
import { Edit, MapPin, GraduationCap, Award, MessagesSquare, LogOut, MoreVertical, Trophy, FileText, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import PostCard from '../components/PostCard';
import NotesCard from '../components/NotesCard'; // Ensure this component exists
import FollowersFollowingModal from '../components/FollowersFollowingModal';

const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function MentorProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { mentor: currentMentor, isLoading: contextLoading } = useMentor();
  const { user } = useUser();
  
  // Profile State
  const [mentor, setMentor] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Stats State
  const [followersCount, setFollowersCount] = useState(null);
  const [followingCount, setFollowingCount] = useState(null);
  const [followersCountLoading, setFollowersCountLoading] = useState(true);
  const [followingCountLoading, setFollowingCountLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); 

  // Content State (Posts & Notes)
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'notes'
  const [posts, setPosts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  // 1. Fetch Mentor Profile
  useEffect(() => {
    if (contextLoading) return;
    isMountedRef.current = true;

    const fetchMentorProfile = async () => {
      setLoading(true);
      setError(null);
      setMentor(null);
      setProfileImageUrl(null);

      try {
        let mentorData;
        const isOwnProfileCheck = !username || (currentMentor && currentMentor.username === username);

        if (isOwnProfileCheck && currentMentor) {
          mentorData = currentMentor;
          // Handle own image logic
          if (mentorData.imageUrl) setProfileImageUrl(mentorData.imageUrl);
          else if (mentorData.image) {
             // Fetch own pic logic (simplified for brevity, kept same as original)
             try {
                const res = await fetch('/api/mentors/me/pic', { credentials: 'include' });
                if(res.ok) setProfileImageUrl(await res.json());
                else setProfileImageUrl(fallbackProfilePic);
             } catch(e) { setProfileImageUrl(fallbackProfilePic); }
          } else setProfileImageUrl(fallbackProfilePic);
          
        } else if (username) {
          const res = await fetch(`/api/mentors/${username}`);
          if (!res.ok) throw new Error('Mentor not found');
          mentorData = await res.json();
          
          // Fetch public pic logic
          if (mentorData.image) {
             try {
                const res = await fetch(`/api/mentors/${mentorData._id}/pic`);
                if(res.ok) setProfileImageUrl(await res.json());
                else setProfileImageUrl(fallbackProfilePic);
             } catch(e) { setProfileImageUrl(fallbackProfilePic); }
          } else setProfileImageUrl(fallbackProfilePic);

        } else {
          throw new Error('No mentor data available');
        }

        if (isMountedRef.current) {
          setMentor(mentorData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching mentor profile:', err);
        if (isMountedRef.current) {
          setError(err.message || 'Failed to load mentor profile');
          setLoading(false);
        }
      }
    };

    fetchMentorProfile();
    return () => { isMountedRef.current = false; };
  }, [username, currentMentor, contextLoading]);

  // 2. Fetch Posts
  useEffect(() => {
    if (!mentor || !mentor._id) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const response = await fetch(`/api/posts/mentor/${mentor._id}?page=1&limit=20`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success) setPosts(data.posts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [mentor]);

  // 3. Fetch Notes
  useEffect(() => {
    if (!mentor || !mentor._id) return;
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        // Fetch all notes (or a specific endpoint if you have /api/notes/user/:id)
        // Assuming /api/notes returns all, we filter by uploader._id
        const response = await fetch('/api/notes', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          // Handle various data structures (array or data.data)
          const allNotes = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          
          // Filter notes uploaded by this mentor
          const mentorNotes = allNotes.filter(note => 
            (note.uploader?._id === mentor._id) || (note.uploader === mentor._id)
          );
          
          setNotes(mentorNotes);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [mentor]);

  // 4. Fetch Counts
  useEffect(() => {
    if (!mentor || !mentor._id) return;
    const fetchCounts = async () => {
      setFollowersCountLoading(true);
      setFollowingCountLoading(true);
      try {
        const [followersRes, followingRes] = await Promise.all([
          fetch(`/api/users/${mentor._id}/followers`, { credentials: 'include' }),
          fetch(`/api/users/${mentor._id}/following`, { credentials: 'include' })
        ]);

        if (followersRes.ok) {
          const data = await followersRes.json();
          if (data.success) setFollowersCount(data.count || 0);
        }
        if (followingRes.ok) {
          const data = await followingRes.json();
          if (data.success) setFollowingCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error fetching counts:', err);
      } finally {
        setFollowersCountLoading(false);
        setFollowingCountLoading(false);
      }
    };
    fetchCounts();
  }, [mentor]);

  // Handlers
  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await fetch('/api/mentors/logout', { method: 'POST', credentials: 'include' });
      toast.success('Logged out successfully');
      navigate('/');
      window.location.reload();
    } catch (e) { toast.error('Failed to Log out!'); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleShareProfile = async () => {
    const mentorUrl = `${window.location.origin}/mentors/${mentor.username || mentor._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Share ${mentor.name}'s profile`, text: mentor.tagline, url: mentorUrl });
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      } catch (err) { toast.error('Failed to share'); }
    } else {
      await navigator.clipboard.writeText(mentorUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading & Error States
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'Mentor does not exist.'}</p>
        <Link to="/mentors" className="bg-blue-500 text-white px-6 py-2 rounded-lg">Browse Mentors</Link>
      </div>
    );
  }

  // Derived Data
  const exams = mentor.competitiveExamsCleared || [];
  const examList = Array.isArray(exams) ? exams.map(e => ({ name: e.name || '' })).filter(e => e.name) : [];
  
  const parseJSON = (data) => {
    if (typeof data === 'object' && data !== null) return data;
    try { return JSON.parse(data); } catch { return null; }
  };
  const courseData = parseJSON(mentor.course);
  const collegeData = parseJSON(mentor.college);
  const mentorName = mentor.name || mentor.username || 'Mentor';
  const isOwnProfile = currentMentor && (currentMentor._id === mentor._id || currentMentor.username === mentor.username);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO 
        title={`${mentorName} | Mentor`} 
        description={mentor.tagline || `Connect with ${mentorName}`} 
        image={profileImageUrl} 
        url={`https://admeasy.in/mentors/${mentor.username || mentor._id}`} 
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-6">
        
        {/* --- PROFILE HEADER CARD (Same as before) --- */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200"></div>
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
              Mentor Account
            </span>
          </div>

          <div className="px-4 sm:px-6 pb-6">
            <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img
                    src={profileImageUrl || fallbackProfilePic}
                    alt={mentorName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = fallbackProfilePic; }}
                  />
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex gap-2 mt-2 items-center">
                  <Link to="/me/edit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
                  </Link>
                  <button onClick={handleShareProfile} className="px-4 py-2 border rounded-lg bg-white text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    {copied ? "Shared🎉" : "Share"}
                  </button>
                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border z-50">
                        <button onClick={handleLogout} className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50">
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{mentorName}</h1>
                {mentor.username && <p className="text-sm text-gray-500">@{mentor.username}</p>}
              </div>

              {/* Stats Row */}
              <div className="flex gap-6 sm:gap-8 py-3 border-y border-gray-200">
                <div className="text-center">
                   <div className="text-lg font-bold">{posts.length}</div>
                   <div className="text-xs text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                   <div className="text-lg font-bold">{notes.length}</div>
                   <div className="text-xs text-gray-500">Notes</div>
                </div>
                <button onClick={() => { setShowModal(true); setModalType('followers'); }} className="text-center hover:opacity-70">
                  <div className="text-lg font-bold">{followersCountLoading ? '-' : followersCount}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </button>
                <button onClick={() => { setShowModal(true); setModalType('following'); }} className="text-center hover:opacity-70">
                  <div className="text-lg font-bold">{followingCountLoading ? '-' : followingCount}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </button>
              </div>

              {mentor.tagline && <p className="text-sm text-gray-700">{mentor.tagline}</p>}

              <div className="space-y-2">
                {courseData && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <GraduationCap size={18} className="text-blue-500" />
                    <span>{courseData.name || courseData.title}</span>
                  </div>
                )}
                {collegeData && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={18} className="text-red-500" />
                    <span>{collegeData.name}</span>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <button 
                  onClick={() => {
                    if (!user && !currentMentor) {
                      toast.info('Please login to chat'); navigate('/login'); return;
                    }
                    navigate(`/chats/${mentor._id}`);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                >
                  <MessagesSquare size={20} /> Chat Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- EXAMS SECTION --- */}
        {examList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b">
              <Trophy className="text-yellow-500" size={24} />
              <h2 className="text-lg font-bold">Cleared Exams</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {examList.map((exam, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-pink-50 p-4 rounded-xl border flex justify-between items-center">
                   <span className="font-semibold text-gray-800">{exam.name}</span>
                   <Award className="text-yellow-500" size={20} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TABS SECTION (POSTS / NOTES) --- */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[400px]">
          
          {/* Tabs Header */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 text-center font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors relative
                ${activeTab === 'posts' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <LayoutGrid size={18} /> Posts
              {activeTab === 'posts' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-4 text-center font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors relative
                ${activeTab === 'notes' ? 'text-[#9f3562]' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <FileText size={18} /> Notes
              {activeTab === 'notes' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#9f3562] rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 bg-gray-50/50 min-h-[300px]">
            
            {/* 1. POSTS CONTENT */}
            {activeTab === 'posts' && (
              <>
                {postsLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => <PostCard key={post._id} post={post} />)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
                    <p className="text-sm text-gray-500">{isOwnProfile ? 'Share your journey!' : 'This mentor hasn\'t posted yet.'}</p>
                  </div>
                )}
              </>
            )}

            {/* 2. NOTES CONTENT */}
            {activeTab === 'notes' && (
              <>
                {notesLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div></div>
                ) : notes.length > 0 ? (
                  <div className="space-y-4">
                      {notes.map((note) => (
                      <div key={note._id} className="h-full">
                        <NotesCard note={note} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No notes uploaded</h3>
                    <p className="text-sm text-gray-500">{isOwnProfile ? 'Upload notes to help students!' : 'This mentor hasn\'t uploaded any notes yet.'}</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <FollowersFollowingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          targetId={mentor._id}
          type={modalType}
          profileType="mentor"
        />
      )}
    </div>
  );
}