import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const fallbackImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const MentorSuggestionSwiper = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatuses, setFollowStatuses] = useState({});
  const [loadingFollows, setLoadingFollows] = useState({});
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const { user } = useUser();
  const { mentor } = useMentor();
  const isAuthed = Boolean(user || mentor);

  // Shuffle array to get random mentors
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Simple heuristic to identify likely female names (common Indian name patterns)
  function isLikelyFemaleName(name) {
    if (!name) return false;
    const nameLower = name.toLowerCase().trim();

    // Common female name endings in Indian names
    const femaleEndings = ['a', 'i', 'ya', 'iya', 'ika', 'ita', 'ina', 'ani', 'ini', 'priya', 'shree', 'shri'];
    const femalePatterns = ['devi', 'kumari', 'bai', 'ben', 'begum'];

    // Check for common female name patterns
    for (const pattern of femalePatterns) {
      if (nameLower.includes(pattern)) return true;
    }

    // Check for common endings
    for (const ending of femaleEndings) {
      if (nameLower.endsWith(ending) && nameLower.length > 2) {
        return true;
      }
    }

    // Common female first names (Indian context)
    const commonFemaleNames = ['priya', 'kavya', 'ananya', 'aditi', 'sneha', 'neha', 'riya', 'diya', 'tanya', 'puja', 'meera', 'radha', 'sita', 'laxmi', 'saraswati', 'durga', 'parvati', 'ganga', 'yamuna', 'vedika', 'veda', 'vedha'];
    for (const femaleName of commonFemaleNames) {
      if (nameLower.includes(femaleName)) return true;
    }

    return false;
  }

  // Separate mentors by likely gender and prioritize female mentors
  function prioritizeFemaleMentors(mentors) {
    const femaleMentors = [];
    const maleMentors = [];
    const unknownMentors = [];

    mentors.forEach(mentor => {
      const name = mentor.name || '';
      if (isLikelyFemaleName(name)) {
        femaleMentors.push(mentor);
      } else if (name.trim().length > 0) {
        // If name exists but doesn't match female patterns, likely male
        maleMentors.push(mentor);
      } else {
        unknownMentors.push(mentor);
      }
    });

    // Shuffle each group
    const shuffledFemale = shuffleArray(femaleMentors);
    const shuffledMale = shuffleArray(maleMentors);
    const shuffledUnknown = shuffleArray(unknownMentors);

    // Prioritize female mentors: 70% female, 30% male/unknown
    const targetFemaleCount = Math.ceil(mentors.length * 0.7);
    const targetMaleCount = mentors.length - targetFemaleCount;

    const result = [
      ...shuffledFemale.slice(0, Math.min(targetFemaleCount, shuffledFemale.length)),
      ...shuffledMale.slice(0, Math.min(targetMaleCount, shuffledMale.length)),
      ...shuffledUnknown.slice(0, Math.max(0, targetMaleCount - shuffledMale.length))
    ];

    // Shuffle the final result slightly to mix them, but keep female majority
    return shuffleArray(result);
  }

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/mentors/");
        if (!response.ok) throw new Error("Failed to fetch mentors");

        const data = await response.json();

        // Filter out current user/mentor if logged in
        let filteredMentors = data;
        if (isAuthed) {
          const currentId = user?._id || mentor?._id;
          if (currentId) {
            filteredMentors = data.filter(m => m._id?.toString() !== currentId.toString());
          }

          // Filter out mentors that user is already following
          if (user?.following && Array.isArray(user.following) && user.following.length > 0) {
            const followingIds = new Set(user.following.map(id => id.toString()));
            filteredMentors = filteredMentors.filter(m => {
              const mentorId = m._id?.toString();
              return !mentorId || !followingIds.has(mentorId);
            });
          }
        }

        // Prioritize female mentors and get more mentors initially (30-50) to ensure we have enough valid ones after filtering
        const prioritizedMentors = prioritizeFemaleMentors(filteredMentors);
        const candidatesToCheck = prioritizedMentors.slice(0, Math.min(50, prioritizedMentors.length));

        // Fetch images for each mentor candidate
        const mentorsWithImages = await Promise.all(
          candidatesToCheck.map(async (mentor) => {
            let imageUrl = mentor.image || fallbackImage;
            if (mentor._id) {
              try {
                const imageRes = await fetch(`/api/mentors/${mentor._id}/pic`);
                if (imageRes.ok) {
                  const url = await imageRes.json();
                  if (url) imageUrl = url;
                }
              } catch (err) {
                console.error("Error fetching mentor image:", err);
              }
            }
            return {
              ...mentor,
              imageUrl,
            };
          })
        );

        // Filter out mentors that don't have name, username, or profile picture
        const validMentors = mentorsWithImages.filter((mentor) => {
          const hasName = mentor.name && mentor.name.trim() !== "";
          const hasUsername = mentor.username && mentor.username.trim() !== "";
          const hasProfilePic = mentor.imageUrl && mentor.imageUrl !== fallbackImage;

          // Keep mentor if they have at least one of: name, username, or profile picture
          return hasName || hasUsername || hasProfilePic;
        });

        // Double-check: Filter out any mentors that are already being followed
        // (in case the user's following array wasn't available earlier)
        let finalMentors = validMentors;
        if (isAuthed && user?.following && Array.isArray(user.following) && user.following.length > 0) {
          const followingIds = new Set(user.following.map(id => id.toString()));
          finalMentors = validMentors.filter(m => {
            const mentorId = m._id?.toString();
            return !mentorId || !followingIds.has(mentorId);
          });
        }

        // Take exactly 10 valid mentors (or all available if less than 10)
        finalMentors = finalMentors.slice(0, 10);

        setMentors(finalMentors);

        // Fetch follow statuses for all mentors (should all be false since we filtered)
        if (isAuthed) {
          const statusPromises = finalMentors.map(async (m) => {
            try {
              const res = await fetch(`/api/users/${m._id}/follow-status`, {
                credentials: "include",
              });
              const data = await res.json();
              return { id: m._id, isFollowing: data.success ? data.isFollowing : false };
            } catch (err) {
              return { id: m._id, isFollowing: false };
            }
          });
          const statuses = await Promise.all(statusPromises);
          const statusMap = {};
          statuses.forEach((s) => {
            statusMap[s.id] = s.isFollowing;
          });
          setFollowStatuses(statusMap);
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [isAuthed, user?._id, mentor?._id, user?.following]);

  // Listen for global follow status changes
  useEffect(() => {
    const handleFollowStatusChange = (event) => {
      const { targetId, isFollowing: newFollowingStatus } = event.detail;
      setFollowStatuses((prev) => ({
        ...prev,
        [targetId]: newFollowingStatus,
      }));
    };

    window.addEventListener("followStatusChanged", handleFollowStatusChange);
    return () => {
      window.removeEventListener("followStatusChanged", handleFollowStatusChange);
    };
  }, []);

  const handleFollow = async (e, mentorId) => {
    e.stopPropagation(); // Prevent navigation when clicking follow button
    if (!isAuthed) {
      toast.info("Log in to follow users and mentors");
      navigate("/login");
      return;
    }

    if (loadingFollows[mentorId]) return;

    const previousFollowing = followStatuses[mentorId] || false;

    // Optimistic update
    setFollowStatuses((prev) => ({
      ...prev,
      [mentorId]: !previousFollowing,
    }));
    setLoadingFollows((prev) => ({ ...prev, [mentorId]: true }));

    try {
      const response = await fetch(`/api/users/${mentorId}/follow`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setFollowStatuses((prev) => ({
          ...prev,
          [mentorId]: data.isFollowing,
        }));

        // Broadcast follow status change globally
        window.dispatchEvent(
          new CustomEvent("followStatusChanged", {
            detail: {
              targetId: mentorId.toString(),
              isFollowing: data.isFollowing,
            },
          })
        );
      } else {
        // Revert on error
        setFollowStatuses((prev) => ({
          ...prev,
          [mentorId]: previousFollowing,
        }));
      }
    } catch (error) {
      console.error("Error following:", error);
      // Revert on error
      setFollowStatuses((prev) => ({
        ...prev,
        [mentorId]: previousFollowing,
      }));
    } finally {
      setLoadingFollows((prev) => ({ ...prev, [mentorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#9f3562]" />
      </div>
    );
  }

  if (mentors.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-4 sm:my-6 relative"
    >
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            Suggested for you
          </h3>
          <Link 
            to="/mentors" 
            className="text-xs font-semibold text-[#9f3562] hover:underline transition-colors"
          >
            See all
          </Link>
        </div>

        {/* Custom Navigation Buttons */}
        <div className="hidden md:block absolute left-2 top-1/2 z-10 -translate-y-1/2">
          <CustomButton ref={prevRef}>
            <IoIosArrowBack size={20} />
          </CustomButton>
        </div>

        <div className="hidden md:block absolute right-2 top-1/2 z-10 -translate-y-1/2">
          <CustomButton ref={nextRef}>
            <IoIosArrowForward size={20} />
          </CustomButton>
        </div>

        {/* Swiper Carousel */}
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={16}
          slidesPerView={2.5}
          loop={false}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onSwiper={(swiper) => {
            setTimeout(() => {
              if (swiper.params.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }
            });
          }}
          breakpoints={{
            0: { slidesPerView: 3.2, spaceBetween: 8 },
            480: { slidesPerView: 4.2, spaceBetween: 10 },
            768: { slidesPerView: 5.2, spaceBetween: 12 },
            1024: { slidesPerView: 6.5, spaceBetween: 14 },
          }}
          className="pb-0.5"
        >
          {mentors.map((mentorItem, index) => {
            const isFollowing = followStatuses[mentorItem._id] || false;
            const isLoading = loadingFollows[mentorItem._id] || false;
            const mentorProfilePath = mentorItem.username ? `/${mentorItem.username}` : null;

            // Shared Layout Content
            const CardContent = () => (
              <>
                <div className="flex flex-col items-center w-full flex-1">
                  {/* Profile Image - Top Center */}
                  {/* Profile Image - Top Center (Compact) */}
                  <div className="relative mb-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-white shadow-sm border border-gray-100">
                      <img
                        src={mentorItem.imageUrl || fallbackImage}
                        alt={mentorItem.name || "Mentor"}
                        loading="lazy"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          if (e.target.src !== fallbackImage) {
                            e.target.src = fallbackImage;
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Text Content */}
                  {/* Name only for ultra-compactness */}
                  <div className="text-center w-full px-0.5">
                    <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-800 line-clamp-1 mb-0.5">
                      {mentorItem.name || "Admeasy"}
                    </h4>
                  </div>
                </div>

                {/* Follow Button - Fixed at bottom */}
                <div className="w-full mt-1">
                  <button
                    onClick={(e) => handleFollow(e, mentorItem._id)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center py-1 px-1 rounded-md text-[8px] sm:text-[9px] font-bold transition-all disabled:opacity-50 ${isFollowing
                      ? "bg-gray-100 text-gray-500 border border-gray-100"
                      : "bg-[#9f3562] text-white hover:bg-[#862b52]" 
                      }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-2 h-2 animate-spin" />
                    ) : (
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    )}
                  </button>
                </div>
              </>
            );

            return (
              <SwiperSlide key={mentorItem._id || index} className="h-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex flex-col items-center justify-between h-[120px] sm:h-[140px] p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-100 transition-all duration-300 relative group"
                >
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMentors(prev => prev.filter(m => m._id !== mentorItem._id));
                    }}
                    className="absolute top-1.5 right-1.5 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <Link to={mentorProfilePath || "#"} className="w-full flex-1 flex flex-col items-center">
                    <CardContent />
                  </Link>
                </motion.div>
              </SwiperSlide>
            );
          })}
        </Swiper>


      </div>
    </motion.div>
  );
};

export default MentorSuggestionSwiper;
