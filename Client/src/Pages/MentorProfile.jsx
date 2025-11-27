import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMentor } from '../context/MentorContext';
import { useUser } from '../context/UserContext';
import { Edit, MapPin, GraduationCap, Award, MessagesSquare } from 'lucide-react';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    // Wait for context to finish loading before fetching profile
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

        // Determine if viewing own profile
        const isOwnProfileCheck = !username || (currentMentor && currentMentor.username === username);

        if (isOwnProfileCheck && currentMentor) {
          // Use current mentor from context
          mentorData = currentMentor;
          if (mentorData.imageUrl) {
            setProfileImageUrl(mentorData.imageUrl);
          } else if (mentorData.image) {
            // Try to fetch image URL
            try {
              const imageRes = await fetch('/api/mentors/me/pic', { credentials: 'include' });
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
            // No image field, use fallback
            setProfileImageUrl(fallbackProfilePic);
          }
        } else if (username) {
          // Fetch mentor by username
          const res = await fetch(`/api/mentors/${username}`);
          if (!res.ok) {
            throw new Error('Mentor not found');
          }
          mentorData = await res.json();

          // Fetch profile image if available
          if (mentorData.image) {
            try {
              const imageRes = await fetch(`/api/mentors/${username}/pic`);
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
            // No image field, use fallback
            setProfileImageUrl(fallbackProfilePic);
          }
        } else {
          // No username and no current mentor - redirect or show error
          throw new Error('No mentor data available');
        }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          // Set mentor data first
          setMentor(mentorData);
          // Use requestAnimationFrame to ensure state update is processed before setting loading to false
          // This ensures the component re-renders with mentor data before showing the content
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

  const handleLogout = async () => {
    const res = await fetch('/api/mentors/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const response = await res.json();

    if (!res.ok || !response.success) {
      toast.error('Failed to Log out!');
    }

    navigate('/');
    window.location.reload();
  }

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  // Extract exams array
  const exams = mentor.competitiveExamsAttempted || [];
  const examCount = Array.isArray(exams) ? exams.length : 0;
  const examList = Array.isArray(exams)
    ? exams.map(exam => {
      if (typeof exam === 'string') {
        return { name: exam, rank: '' };
      }
      return { name: exam.name || '', rank: exam.rank || '' };
    }).filter(exam => exam.name)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Main Profile Container */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Profile Header - Instagram Style */}
        <div className="bg-white rounded-xl shadow-3d p-6 mb-6 relative">
          {currentMentor && (currentMentor._id === mentor._id || currentMentor.username === mentor.username) && (
            <button
              className="group flex items-center justify-start max-[400px]:w-[25px] max-[400px]:h-[25px] w-[45px] h-[45px] border-none rounded-full cursor-pointer absolute max-[400px]:top-2.5 max-[400px]:right-2.5 top-5 right-5 overflow-hidden shadow-[2px_2px_10px_rgba(0,0,0,0.199)] bg-red-500 transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] hover:w-[125px] hover:rounded-[40px]"
              onClick={handleLogout}>
              {/* Sign (Icon) */}
              <div
                className="w-full flex items-center justify-center transition-all duration-300 group-hover:w-[30%] group-hover:pl-5"
              >
                <svg viewBox="0 0 512 512" className="max-[400px]:w-[14px] w-[17px]">
                  <path
                    fill="white"
                    d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                  ></path>
                </svg>
              </div>

              {/* Text */}
              <div
                className="
            absolute right-0 w-0 opacity-0 text-white 
            text-[1.2em] font-semibold transition-all duration-300 
            group-hover:opacity-100 group-hover:w-[70%] group-hover:pr-[10px]">
                Logout
              </div>
            </button>
          )}
          <div className="flex flex-row items-center max-[400px]:gap-3 gap-6 md:gap-12 mb-4">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative w-fit">
                <img
                  src={profileImageUrl || fallbackProfilePic}
                  alt={mentor.name || mentor.username || 'Profile'}
                  className="w-22 h-22 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    e.target.src = fallbackProfilePic;
                  }}
                />
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {/* Username and Edit Button */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <h1 className="max-[400px]:text-xl text-2xl md:text-3xl font-bold text-thead1">
                  {mentor.username || 'Mentor'}
                </h1>
                {mentor.name && (
                  <h2 className="max-[400px]:text-base text-lg md:text-xl font-semibold text-tprimary">{mentor.name}</h2>
                )}
                {mentor.tagline && (
                  <p className="max-[400px]:text-xs text-sm font-medium text-gray-700">{mentor.tagline}</p>
                )}
              </div>
            </div>

          </div>
          <div className="space-y-2">
            {/* Details */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs sm:text-sm">
              {mentor.course && (
                (() => {
                  const courseData = typeof mentor.course === 'object' && mentor.course !== null
                    ? mentor.course
                    : (mentor.course ? JSON.parse(mentor.course) : null);
                  const collegeData = typeof mentor.college === 'object' && mentor.college !== null
                    ? mentor.college
                    : (mentor.college ? JSON.parse(mentor.college) : null);
                  return courseData && collegeData ? (
                    <Link to={`/colleges/${collegeData.id}/courses/${courseData.id}`} className="flex items-center gap-1.5 text-gray-600 hover:underline hover:cursor-pointer">
                      <GraduationCap size={18} />
                      <span>{courseData.name || courseData.title}</span>
                    </Link>
                  ) : courseData ? (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <GraduationCap size={18} />
                      <span>{courseData.name || courseData.title}</span>
                    </div>
                  ) : null;
                })()
              )}
              {mentor.college && (
                (() => {
                  const collegeData = typeof mentor.college === 'object' && mentor.college !== null
                    ? mentor.college
                    : (mentor.college ? JSON.parse(mentor.college) : null);
                  return collegeData ? (
                    <Link to={'/colleges/' + collegeData.id} className="flex items-center gap-1.5 text-gray-600 hover:cursor-pointer hover:underline">
                      <MapPin size={18} />
                      <span>{collegeData.name}</span>
                    </Link>
                  ) : null;
                })()
              )}
            </div>
          </div>
          {/* Follow Button */}
          {currentMentor && (currentMentor._id !== mentor._id && currentMentor.username !== mentor.username) || !currentMentor && (
            <button
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  toast.info('Please login first to contact the mentor');
                  navigate('/login');
                } else {
                  const collegeData = typeof mentor.college === 'object' && mentor.college !== null
                    ? mentor.college
                    : (mentor.college ? JSON.parse(mentor.college) : null);
                  const collegeName = collegeData?.name || mentor.college || '';
                  window.open(`https://wa.me/919243299145?text=Hey Team Admeasy!\n I'm ${user.name}, a ${user.course} student from ${user.institute}. I'd love to connect with ${mentor.name} from ${collegeName} to gain some real insights and perspective!`, '_blank');
                }
              }}
              className="w-full inline-flex justify-center items-center gap-2 mt-4 px-4 py-2 bg-thead1 border border-gray-300 rounded-lg text-sm font-semibold text-primary hover:bg-thead2 transition-colors"
            >
              <MessagesSquare size={18} />
              Chat Now
            </button>
          )}
          {/* Edit Profile Button */}
          {currentMentor && (currentMentor._id === mentor._id || currentMentor.username === mentor.username) && (
            <Link
              to="/me/edit"
              className="w-full inline-flex justify-center items-center gap-2 mt-4 px-4 py-2 bg-thead1 border border-gray-300 rounded-lg text-sm font-semibold text-primary hover:bg-thead2 transition-colors"
            >
              <Edit size={16} />
              Edit Profile
            </Link>
          )}
        </div>

        {/* Exams Section - Instagram Grid Style */}
        {examList.length > 0 && (
          <div className="bg-white rounded-lg shadow-3d p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-gray-200">
              <Award className="text-blue-500" size={24} />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Competitive Exams Cleared</h2>
            </div>
            <div className="grid max-[400px]:grid-cols-1 grid-cols-2 md:grid-cols-3 gap-3">
              {examList.map((exam, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-colors cursor-default"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm font-semibold text-thead2 text-center mb-1">{exam.name}</span>
                    {exam.rank && (
                      <span className="max-[400px]:text-base text-lg text-thead1 font-bold text-center">{exam.rank}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

