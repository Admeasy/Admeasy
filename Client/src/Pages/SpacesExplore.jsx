import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, UserCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import SEO from '../components/SEO';

const SpacesExplore = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const loggedInAccount = user || mentor;

  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSpaceId, setJoiningSpaceId] = useState(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/spaces/explore', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        } else {
          throw new Error(data.message || 'Failed to fetch spaces');
        }
      } catch (err) {
        console.error('Error fetching spaces:', err);
        toast.error('Failed to load spaces');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const handleJoin = async (spaceId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!loggedInAccount) {
      toast.info('Please log in to join spaces');
      navigate('/login');
      return;
    }

    try {
      setJoiningSpaceId(spaceId);
      const res = await fetch(`/api/spaces/${spaceId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to join space');
      }
      toast.success('Joined space');
      // Update the space in the list to reflect membership
      setSpaces((prev) =>
        prev.map((s) =>
          s._id === spaceId ? { ...s, isMember: true } : s
        )
      );
    } catch (err) {
      console.error('Error joining space:', err);
      toast.error(err.message || 'Failed to join space');
    } finally {
      setJoiningSpaceId(null);
    }
  };

  const handleCardClick = (spaceId) => {
    navigate(`/spaces/${spaceId}`);
  };

  const renderSpaceCard = (space) => {
    const isMember = space.isMember || false;
    const isJoining = joiningSpaceId === space._id;

    return (
      <div
        key={space._id}
        onClick={() => handleCardClick(space._id)}
        className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 hover:border-[#9f3562]/30 p-6 sm:p-8 flex flex-col gap-5 cursor-pointer"
      >
        {/* Logo and Name Section */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
            {space.logo ? (
              <img
                src={space.logo}
                alt={space.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg sm:text-xl font-semibold text-[#9f3562]">
                {space.name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight break-words">
              {space.name}
            </h3>
            {space.membersCount != null && (
              <p className="text-sm text-gray-500 mt-2">
                {space.membersCount} member{space.membersCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {space.description && (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {space.description}
          </p>
        )}

        {/* Join Button - Full width at bottom */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={(e) => handleJoin(space._id, e)}
            disabled={isMember || isJoining}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isMember
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#9f3562] text-white hover:bg-[#b14270] cursor-pointer'
            } ${isJoining ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isJoining ? 'Joining...' : isMember ? 'Joined' : 'Join'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-4 sm:p-6 lg:p-8 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      <SEO
        title="Explore Spaces - Study Communities | Admeasy"
        description="Discover and join public study spaces and communities with mentors and students."
        url="https://admeasy.in/spaces/explore"
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

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 border border-gray-200 hover:border-[#9f3562]/40 hover:text-[#9f3562] shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-admeasy-bold text-gray-900">
              Explore Spaces
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Discover and join public study communities
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/90 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-sm">
              Loading spaces...
            </p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="bg-white/95 rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center text-center gap-3">
            <UserCircle2 className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-700 font-medium">
              No spaces available yet
            </p>
            <p className="text-xs text-gray-500">
              Check back later for new study communities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {spaces.map((space) => renderSpaceCard(space))}
          </div>
        )}
      </div>
    </main>
  );
};

export default SpacesExplore;
