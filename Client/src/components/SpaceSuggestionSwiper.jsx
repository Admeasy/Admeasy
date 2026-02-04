import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import CustomButton from "../HomeComponents/3d-btn";
import { motion } from "framer-motion";
import { Users, Loader2, UserCheck } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const SpaceSuggestionSwiper = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSpaces, setJoiningSpaces] = useState({});
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const { user } = useUser();
  const { mentor } = useMentor();
  const isAuthed = Boolean(user || mentor);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/spaces/discover", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch spaces");
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch spaces");
        }

        // Filter out spaces user is already a member of
        let filteredSpaces = data.spaces || [];
        
        // Filter to only show non-member spaces
        filteredSpaces = filteredSpaces.filter(space => !space.isMember);
        
        // Limit to 10 spaces
        filteredSpaces = filteredSpaces.slice(0, 10);

        setSpaces(filteredSpaces);
      } catch (error) {
        console.error("Error fetching spaces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [isAuthed]);

  const handleJoin = async (e, spaceId) => {
    e.stopPropagation();
    
    if (!isAuthed) {
      toast.info("Log in to join spaces");
      navigate("/login");
      return;
    }

    if (joiningSpaces[spaceId]) return;

    setJoiningSpaces((prev) => ({ ...prev, [spaceId]: true }));

    try {
      const response = await fetch(`/api/spaces/${spaceId}/join`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Joined space");
        // Update the space to show as joined
        setSpaces((prev) =>
          prev.map((s) =>
            s._id === spaceId ? { ...s, isMember: true, membersCount: (s.membersCount || 0) + 1 } : s
          )
        );
        // Navigate to the space
        navigate(`/spaces/${spaceId}`);
      } else {
        throw new Error(data.message || "Failed to join space");
      }
    } catch (error) {
      console.error("Error joining space:", error);
      toast.error(error.message || "Failed to join space");
    } finally {
      setJoiningSpaces((prev) => ({ ...prev, [spaceId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#9f3562]" />
      </div>
    );
  }

  if (spaces.length === 0) {
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
          Suggested Spaces
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
          {spaces.map((space, index) => {
            const isLoading = joiningSpaces[space._id] || false;
            const isMember = space.isMember || false;

            return (
              <SwiperSlide key={space._id || index} className="h-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex flex-col items-center justify-between h-[200px] p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {/* Space Logo - Clickable to navigate */}
                  <Link
                    to={`/spaces/${space._id}`}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <div className="relative">
                      {space.logo ? (
                        <img
                          src={space.logo}
                          alt={space.name || "Space"}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-md ${
                          space.logo ? "hidden" : ""
                        }`}
                      >
                        <span className="text-lg font-semibold text-[#9f3562]">
                          {space.name?.[0]?.toUpperCase() || "S"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Name and Members Count - Clickable to navigate */}
                  <Link
                    to={`/spaces/${space._id}`}
                    className="flex-1 flex flex-col items-center justify-center text-center min-h-[3rem] cursor-pointer w-full"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                      {space.name || "Space"}
                    </h4>
                    {space.membersCount != null && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {space.membersCount} member{space.membersCount === 1 ? "" : "s"}
                      </p>
                    )}
                  </Link>

                  {/* Join Button */}
                  <button
                    onClick={(e) => handleJoin(e, space._id)}
                    disabled={isLoading || isMember}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex-shrink-0 ${
                      isMember
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white hover:shadow-lg hover:shadow-[#9f3562]/50"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isMember ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        <span>Join</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Discover More Button */}
        <div className="flex justify-center mt-4">
          <Link to="/spaces">
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

export default SpaceSuggestionSwiper;
