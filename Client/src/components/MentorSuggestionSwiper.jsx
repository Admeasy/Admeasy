import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
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
        }

        // Shuffle and get more mentors initially (30-50) to ensure we have enough valid ones
        const shuffled = shuffleArray(filteredMentors);
        const candidatesToCheck = shuffled.slice(0, Math.min(50, shuffled.length));

        // Fetch images for each mentor candidate
        const mentorsWithImages = await Promise.all(
          candidatesToCheck.map(async (mentor) => {
            let imageUrl = fallbackImage;
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

        // Take exactly 10 valid mentors (or all available if less than 10)
        const finalMentors = validMentors.slice(0, 10);

        setMentors(finalMentors);

        // Fetch follow statuses for all mentors
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
  }, [isAuthed, user?._id, mentor?._id]);

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
      className="my-8 relative"
    >
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 md:p-6 relative">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">
          Suggested Mentors
        </h3>

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
            0: { slidesPerView: 2.2, spaceBetween: 12 },
            640: { slidesPerView: 3.5, spaceBetween: 16 },
            1024: { slidesPerView: 4.5, spaceBetween: 20 },
          }}
          className="pb-2"
        >
          {mentors.map((mentorItem, index) => {
            const isFollowing = followStatuses[mentorItem._id] || false;
            const isLoading = loadingFollows[mentorItem._id] || false;
            const mentorProfilePath = mentorItem.username ? `/${mentorItem.username}` : null;

            return (
              <SwiperSlide key={mentorItem._id || index} className="h-auto">
                {mentorProfilePath ? (
                  <Link
                    to={mentorProfilePath}
                    className="block h-full"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex flex-col items-center justify-between h-[200px] p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {/* Profile Image */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={mentorItem.imageUrl || fallbackImage}
                          alt={mentorItem.name || "Mentor"}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            if (e.target.src !== fallbackImage) {
                              e.target.src = fallbackImage;
                            }
                          }}
                        />
                      </div>

                      {/* Name - fixed height to ensure alignment */}
                      <h4 className="text-sm font-semibold text-gray-900 text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {mentorItem.name || "Mentor"}
                      </h4>

                      {/* Follow Button */}
                      <button
                        onClick={(e) => handleFollow(e, mentorItem._id)}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex-shrink-0 ${
                          isFollowing
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/50"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex flex-col items-center justify-between h-[200px] p-4 bg-gray-50 rounded-xl cursor-default"
                  >
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={mentorItem.imageUrl || fallbackImage}
                        alt={mentorItem.name || "Mentor"}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        onError={(e) => {
                          if (e.target.src !== fallbackImage) {
                            e.target.src = fallbackImage;
                          }
                        }}
                      />
                    </div>

                    {/* Name - fixed height to ensure alignment */}
                    <h4 className="text-sm font-semibold text-gray-900 text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {mentorItem.name || "Mentor"}
                    </h4>

                    {/* Follow Button */}
                    <button
                      onClick={(e) => handleFollow(e, mentorItem._id)}
                      disabled={isLoading}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex-shrink-0 ${
                        isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/50"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Discover More Button */}
        <div className="flex justify-center mt-4">
          <Link to="/mentors">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#9f3562]/50 transition-all duration-300 flex items-center gap-2"
            >
              <span>Discover more</span>
              <IoIosArrowForward className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MentorSuggestionSwiper;
