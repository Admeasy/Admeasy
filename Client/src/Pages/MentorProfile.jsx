import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMentor } from '../context/MentorContext';
import { useUser } from '../context/UserContext';
import { Edit, MapPin, GraduationCap, Award, MessagesSquare, LogOut, Users, BookOpen, Trophy, MoreVertical, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingButton from '../components/LoadingButton';
import SEO from '../components/SEO';
import PostCard from '../components/PostCard';
import FollowersFollowingModal from '../components/FollowersFollowingModal';
const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function MentorProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { mentor: currentMentor, isLoading: contextLoading } = useMentor();
  const { user } = useUser();
  const [mentor, setMentor] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(null);
  const [followingCount, setFollowingCount] = useState(null);
  const [followersCountLoading, setFollowersCountLoading] = useState(true);
  const [followingCountLoading, setFollowingCountLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'followers' or 'following'

  useEffect(() => {
    if (contextLoading) {
      return;
    }

    isMountedRef.current = true;

    const fetchMentorProfile = async () => {
      setLoading(true);
      setError(null);
      setMentor(null);
      setProfileImageUrl(null);

      try {
        let mentorData;
        const isOwnProfileCheck = !username || (currentMentor && currentMentor.username === username);

        if (username) {
          const res = await fetch(`/api/mentors/${username}`);
          if (!res.ok) {
            throw new Error('Mentor not found');
          }
          mentorData = await res.json();

          if (mentorData.image) {
            try {
              const imageRes = await fetch(`/api/mentors/${mentorData._id}/pic`);
              if (imageRes.ok) {
                const imageUrl = await imageRes.json();
                if (imageUrl) {
                  setProfileImageUrl(imageUrl);
                } else {
                  setProfileImageUrl(fallbackProfilePic);
                }
              } else {
                setProfileImageUrl(fallbackProfilePic);
              }
            } catch (err) {
              console.error('Error fetching profile image:', err);
              setProfileImageUrl(fallbackProfilePic);
            }
          } else {
            setProfileImageUrl(fallbackProfilePic);
          }
        } else if (currentMentor) {
          mentorData = currentMentor;
          // Logic for own profile without username param (e.g. /me)
          if (mentorData.imageUrl) {
            setProfileImageUrl(mentorData.imageUrl);
          } else {
            // ... fetch pic logic
            setProfileImageUrl(fallbackProfilePic);
          }
        } else {
          throw new Error('No mentor data available');
        }

        if (isMountedRef.current) {
          setMentor(mentorData);
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setLoading(false);
            }
          });
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

    return () => {
      isMountedRef.current = false;
    };
  }, [username, currentMentor, contextLoading]);

  // Fetch posts when mentor is loaded
  useEffect(() => {
    if (!mentor || !mentor._id) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const response = await fetch(`/api/posts/mentor/${mentor._id}?page=1&limit=10`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [mentor]);

  // Fetch followers and following counts
  useEffect(() => {
    if (!mentor || !mentor._id) return;

    const fetchCounts = async () => {
      setFollowersCountLoading(true);
      setFollowingCountLoading(true);
      try {
        const followersRes = await fetch(`/api/users/${mentor._id}/followers`, {
          credentials: 'include',
        });
        const followingRes = await fetch(`/api/users/${mentor._id}/following`, {
          credentials: 'include',
        });

        if (followersRes.ok) {
          const followersData = await followersRes.json();
          if (followersData.success) {
            setFollowersCount(followersData.count || 0);
          }
        }
        setFollowersCountLoading(false);

        if (followingRes.ok) {
          const followingData = await followingRes.json();
          if (followingData.success) {
            setFollowingCount(followingData.count || 0);
          }
        }
        setFollowingCountLoading(false);
      } catch (err) {
        console.error('Error fetching counts:', err);
        setFollowersCountLoading(false);
        setFollowingCountLoading(false);
      }
    };

    fetchCounts();
  }, [mentor]);

  const handleLogout = async () => {
    setShowMenu(false);
    const res = await fetch('/api/mentors/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const response = await res.json();

    if (!res.ok || !response.success) {
      toast.error('Failed to Log out!');
    } else {
      toast.success('Logged out successfully');
    }

    navigate('/');
    window.location.reload();
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleShareProfile = async () => {
    const mentorUrl = `${window.location.origin}/mentors/${mentor.username || mentor._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Share ${mentor.name}'s profile`, text: mentor.tagline, url: mentorUrl });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to share profile');
      }
    } else {
      await navigator.clipboard.writeText(mentorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9f3562] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The mentor profile you are looking for does not exist.'}</p>
          <Link
            to="/mentors"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Mentors
          </Link>
        </div>
      </div>
    );
  }

  const exams = mentor.competitiveExamsCleared || [];
  const examList = Array.isArray(exams)
    ? exams.map(exam => {
      return { name: exam.name || '' };
    }).filter(exam => exam.name)
    : [];

  const courseData = mentor.course && (typeof mentor.course === 'object' && mentor.course !== null
    ? mentor.course
    : (mentor.course ? (() => {
      try {
        return JSON.parse(mentor.course);
      } catch {
        return null;
      }
    })() : null));
  const collegeData = mentor.college && (typeof mentor.college === 'object' && mentor.college !== null
    ? mentor.college
    : (mentor.college ? (() => {
      try {
        return JSON.parse(mentor.college);
      } catch {
        return null;
      }
    })() : null));

  const mentorName = mentor.name || mentor.username || 'Mentor';
  const mentorTitle = `${mentorName} | Mentor @ Admeasy`;
  const mentorDescription = mentor.tagline
    ? `${mentor.tagline}${collegeData ? ` - Mentor at ${collegeData.name}` : ''}${courseData ? ` specializing in ${courseData.name || courseData.title}` : ''}. Connect with verified mentors on Admeasy.`
    : `Connect with ${mentorName}${collegeData ? ` from ${collegeData.name}` : ''}${courseData ? ` - ${courseData.name || courseData.title} mentor` : ''}. Get real insights and guidance from verified mentors on Admeasy.`;

  const mentorKeywords = [
    mentorName,
    mentor.username,
    'mentor',
    'admeasy',
    collegeData?.name,
    courseData?.name || courseData?.title,
    ...(examList.map(exam => exam.name))
  ].filter(Boolean).join(', ');

  const mentorImage = profileImageUrl || 'https://admeasy.in/LOGO.webp';
  const mentorUrl = `https://admeasy.in/mentors/${mentor.username || mentor._id}`;

  const isOwnProfile = currentMentor && (currentMentor._id === mentor._id || currentMentor.username === mentor.username);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title={mentorTitle}
        description={mentorDescription}
        keywords={mentorKeywords}
        image={mentorImage}
        url={mentorUrl} />

      {/* Main Container with max width */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-8">
        {/* Profile Card - Instagram Style */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
          {/* Cover Background */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200"></div>

          {/* Mentor Account Tag - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
              Mentor Account
            </span>
          </div>

          {/* Profile Content */}
          <div className="px-4 sm:px-6 pb-6">
            {/* Profile Image - Overlapping cover */}
            <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img
                    src={profileImageUrl || fallbackProfilePic}
                    alt={mentor.name || mentor.username || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = fallbackProfilePic;
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex gap-2 mt-2 items-center">
                  <Link
                    to="/me/edit"
                    className="px-4 sm:px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Edit size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>

                  {/* Share button */}
                  <button
                    onClick={handleShareProfile}
                    className="
                      inline-flex items-center gap-2
                      rounded-xl border border-slate-200
                      bg-white px-4 py-2
                      text-sm font-medium text-slate-700
                      shadow-sm
                      transition-all
                      hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600
                      active:scale-95
                    "
                  >
                    {/* Icon */}
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m6.632 2.684C15.114 13.062 15 12.518 15 12s.114-1.062.316-1.342M12 3v9m0 0l-3-3m3 3l3-3m-9 9a2 2 0 002 2h8a2 2 0 002-2"
                      />
                    </svg>

                    {copied ? "Shared🎉" : "Share"}
                  </button>

                  {/* 3-dots menu with logout */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                      aria-label="More options"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              {/* Name and Username */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{mentor.name || mentor.username}</h1>
                {mentor.name && (
                  <p className="text-sm sm:text-base text-gray-500">@{mentor.username}</p>
                )}
              </div>

              {/* Stats Row - Instagram Style */}
              <div className="flex gap-6 sm:gap-8 py-3 border-y border-gray-200">
                <button
                  onClick={() => {
                    e.preventDefault();
                  }}
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{posts.length}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Posts</div>
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setModalType('followers');
                  }}
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center min-h-[28px]">
                    {followersCountLoading ? (
                      <div className="w-5 h-5 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      followersCount ?? 0
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Followers</div>
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setModalType('following');
                  }}
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center min-h-[28px]">
                    {followingCountLoading ? (
                      <div className="w-5 h-5 border-2 border-[#9f3562] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      followingCount ?? 0
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Following</div>
                </button>
              </div>

              {/* Tagline */}
              {mentor.tagline && (
                <p className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed mb-2">{mentor.tagline}</p>
              )}

              {/* Bio */}
              {mentor.bio && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">{mentor.bio}</p>
              )}

              {mentor.dateOfBirth && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Age: {(() => {
                    const dob = new Date(mentor.dateOfBirth);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                      age--;
                    }
                    return age;
                  })()}
                </p>
              )}

              {/* Education Info */}
              <div className="space-y-2">
                {courseData && (
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <GraduationCap size={18} className="text-blue-500 flex-shrink-0" />
                    {collegeData ? (
                      <Link to={`/colleges/${collegeData.id}/courses/${courseData.id}`} className="hover:underline">
                        {courseData.name || courseData.title}
                      </Link>
                    ) : (
                      <span>{courseData.name || courseData.title}</span>
                    )}
                  </div>
                )}
                {collegeData && (
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <MapPin size={18} className="text-red-500 flex-shrink-0" />
                    <Link to={'/colleges/' + collegeData.id} className="hover:underline">
                      {collegeData.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Action Buttons for Non-Owners */}
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!user && !currentMentor) {
                        toast.info('Please login to chat with mentors', {
                          position: 'top-center',
                        });
                        navigate('/login');
                        return;
                      }
                      navigate(`/chats/${mentor._id}`);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-md"
                  >
                    <MessagesSquare size={20} />
                    Chat Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exams Section - Grid Cards */}
        {examList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                <Trophy className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Competitive Exams</h2>
                <p className="text-xs sm:text-sm text-gray-500">{examList.length} exam{examList.length !== 1 ? 's' : ''} cleared</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {examList.map((exam, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border-2 border-transparent hover:border-purple-300 transition-all duration-300 cursor-default hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cleared</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {exam.name}
                      </h3>
                    </div>
                    <Award className="text-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity" size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Exams */}
        {examList.length === 0 && isOwnProfile && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams added yet</h3>
            <p className="text-sm text-gray-500 mb-4">Add your cleared competitive exams to showcase your achievements</p>
            <Link
              to="/me/edit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Edit size={16} />
              Edit Profile
            </Link>
          </div>
        )}

        {/* Posts Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
              <MessagesSquare className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Posts</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {postsLoading ? 'Loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {postsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-sm text-gray-500">
                {isOwnProfile ? 'Start sharing your thoughts and experiences!' : 'This mentor hasn\'t posted anything yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showModal && (modalType === 'followers' || modalType === 'following') && (
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