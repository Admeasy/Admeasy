import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  Eye,
  Heart,
  MapPin,
  Briefcase,
  Clock,
  Award,
  Search,
  Newspaper,
  Upload,
  ChevronRight,
  X,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";

/* ================= SAFE RENDER HELPER ================= */
const renderText = (value) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") {
    // Handle nested objects
    return value.name ?? value.title ?? value.overall ?? JSON.stringify(value);
  }
  return null;
};

/* ================= CONSTANTS ================= */
const TABS = [
  { label: "All", value: "all", icon: Search },
  { label: "Mentors", value: "mentors", icon: Users },
  { label: "Colleges", value: "colleges", icon: GraduationCap },
  { label: "Notes", value: "notes", icon: FileText },
  { label: "Blogs", value: "blogs", icon: Newspaper },
];

const getCacheKey = (query, tab) => `search::${query}::${tab}`;

const getCachedResults = (query, tab) => {
  try {
    const cached = sessionStorage.getItem(getCacheKey(query, tab));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedResults = (query, tab, data) => {
  try {
    sessionStorage.setItem(getCacheKey(query, tab), JSON.stringify(data));
  } catch { }
};

/* ================= COMPONENT ================= */
const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState({
    mentors: [],
    colleges: [],
    blogs: [],
    notes: [],
  });
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const { user } = useUser();
  const { mentor } = useMentor();

  // Sync searchInput with URL query param
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Debounced search: Update URL params when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        newParams.set("q", searchInput.trim());
      } else {
        newParams.delete("q");
      }
      setSearchParams(newParams, { replace: true });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  // Fetch suggested spaces (independent of search query)
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get("/api/spaces/discover", {
          withCredentials: true,
        });
        if (res.data?.success) {
          setSpaces(res.data.spaces || []);
        }
      } catch (err) {
        console.error("Failed to fetch spaces for explore", err);
      } finally {
        setSpacesLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  useEffect(() => {
    // Don't cache when there's no query (random data should be fresh each time)
    const cached = query ? getCachedResults(query, activeTab) : null;

    if (cached) {
      setResults(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchResults = async () => {
      try {
        const url =
          activeTab === "all"
            ? `/api/search?q=${query || ""}`
            : `/api/search?q=${query || ""}&type=${activeTab}`;

        const { data } = await axios.get(url);

        setResults(data.results);
        // Only cache when there's a query (don't cache random data)
        if (query) {
          setCachedResults(query, activeTab, data.results);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, activeTab]);

  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const getFilteredResults = () => {
    if (activeTab === "all") {
      return {
        mentors: results.mentors || [],
        colleges: results.colleges || [],
        blogs: results.blogs || [],
        notes: results.notes || [],
      };
    }
    return {
      [activeTab]: results[activeTab] || [],
    };
  };

  const filteredResults = getFilteredResults();
  // console.log(results.mentors)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* ================= SEARCHBAR ================= */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#9f3562] transition-colors" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for mentors, colleges, notes, blogs..."
                className="w-full pl-12 pr-12 py-4 text-base bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/20 focus:border-[#9f3562] transition-all duration-200 shadow-sm hover:shadow-md placeholder:text-gray-400 text-gray-900"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#9f3562] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {query && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-[#9f3562]">{totalResults}</span> results for{" "}
                  <span className="font-semibold text-gray-900">"{query}"</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= PILL-STYLE TABS WITH ICONS ================= */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-3 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer border
                    ${isActive
                      ? "bg-[#9f3562] hover:bg-[#b86286] text-white border-transparent shadow-md shadow-pink-200"
                      : "bg-white text-gray-600 hover:bg-gray-200 border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"
                      }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= RESULTS SECTION ================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Searching...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ================= MENTORS SECTION ================= */}
            {filteredResults.mentors && filteredResults.mentors.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Mentors</h2>
                  <span
                    onClick={() => navigate(`/mentors`)}
                    className="cursor-pointer px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">
                    View More
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.mentors.map((mentorItem) => {
                    const mentorName = renderText(mentorItem.name) || "Anonymous";
                    const collegeName = renderText(mentorItem.college) || "";

                    return (
                      <div
                        key={mentorItem._id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <img
                              src={
                                mentorItem.image ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorName}`
                              }
                              alt={mentorName}
                              className="w-16 h-16 rounded-full object-cover ring-2 ring-[#9f3562]/20"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-lg mb-1">
                                {mentorName}
                              </h3>
                              {collegeName && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                                  {collegeName}
                                </p>
                              )}
                              {mentorItem.course && (
                                <p className="text-xs text-gray-500">
                                  {renderText(mentorItem.course)}
                                </p>
                              )}
                            </div>
                          </div>

                          {mentorItem.notesUploaded !== undefined &&
                            mentorItem.notesUploaded > 0 && (
                              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm text-purple-700 font-medium flex items-center gap-2">
                                  <Upload className="w-4 h-4" />
                                  {mentorItem.notesUploaded} Notes Uploaded
                                </span>
                              </div>
                            )}

                          <button
                            onClick={() => navigate(`/${mentorItem.username}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => navigate("/mentors")}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#9f3562] text-[#9f3562] rounded-lg hover:bg-[#9f3562] hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  >
                    View More Mentors
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* ================= SPACES SECTION (SECOND POSITION) ================= */}
            {activeTab === "all" && !spacesLoading && spaces && spaces.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Spaces</h2>
                  <span
                    onClick={() => navigate("/spaces")}
                    className="cursor-pointer px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold"
                  >
                    View All
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spaces.slice(0, 6).map((space) => (
                    <div
                      key={space._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300 flex flex-col"
                    >
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9f3562]/10 via-pink-100 to-purple-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#9f3562]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                              {space.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {space.membersCount || 0} member{(space.membersCount || 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        {space.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {space.description}
                          </p>
                        )}
                        {space.lastMessage && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-auto">
                            Last: {space.lastMessage.authorName}:{" "}
                            {space.lastMessage.content}
                          </p>
                        )}
                      </div>
                      <div className="px-5 pb-4 pt-1 flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate(`/spaces/${space._id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors text-xs font-semibold"
                        >
                          Go to Space
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* ================= NOTES SECTION ================= */}
            {filteredResults.notes && filteredResults.notes.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Notes</h2>
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">
                    {filteredResults.notes.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.notes.map((note) => (
                    <div
                      key={note._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300 group"
                    >
                      <div className="p-6 pb-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#9f3562]/10 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-7 h-7 text-[#9f3562]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-[#9f3562] transition-colors">
                              {renderText(note.title) || "Untitled Note"}
                            </h3>
                          </div>
                        </div>

                        {note.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {renderText(note.description)}
                          </p>
                        )}

                        {(note.uploaderName || note.uploader) && (
                          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {renderText(note.uploaderName || note.uploader)}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {note.likes !== undefined && (
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" />
                              {note.likes}
                            </span>
                          )}
                          {note.views !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {note.views}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6">
                        <button
                          onClick={() => navigate(`/notes/${note._id}`)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================= COLLEGES SECTION ================= */}
            {filteredResults.colleges &&
              filteredResults.colleges.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="w-6 h-6 text-[#9f3562]" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Colleges
                    </h2>
                    <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">
                      {filteredResults.colleges.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.colleges.map((college) => {
                      const collegeName = renderText(college.name) || "Unknown College";
                      const collegeDesc = renderText(college.desc) || "";
                      const collegeLocation = renderText(college.location) || "";

                      // Handle rating object safely
                      let ratingDisplay = "";
                      if (college.rating) {
                        if (typeof college.rating === "object" && college.rating.overall) {
                          ratingDisplay = college.rating.overall;
                        } else if (typeof college.rating === "string" || typeof college.rating === "number") {
                          ratingDisplay = college.rating;
                        }
                      }

                      const placementsText = renderText(college.placements) || "";

                      return (
                        <div
                          key={college._id}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300"
                        >
                          <div className="h-40 bg-gradient-to-br from-[#9f3562]/10 via-purple-50 to-blue-50 flex items-center justify-center p-6">
                            {college.logo ? (
                              <img
                                src={college.logo}
                                alt={collegeName}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <GraduationCap className="w-16 h-16 text-[#9f3562]/30" />
                            )}
                          </div>

                          <div className="p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                              {collegeName}
                            </h3>

                            {collegeDesc && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {collegeDesc}
                              </p>
                            )}

                            {collegeLocation && (
                              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#9f3562]" />
                                {collegeLocation}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                              {ratingDisplay && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  {ratingDisplay} Rating
                                </span>
                              )}
                              {placementsText && (
                                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {placementsText}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                navigate(`/colleges/${college._id}`)
                              }
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => navigate("/colleges")}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#9f3562] text-[#9f3562] rounded-lg hover:bg-[#9f3562] hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                    >
                      View More Colleges
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

            {/* ================= BLOGS SECTION ================= */}
            {filteredResults.blogs && filteredResults.blogs.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Blogs</h2>
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">
                    {filteredResults.blogs.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.blogs.map((blog) => {
                    const blogTitle = renderText(blog.Title) || "Untitled Blog";
                    const blogContent = renderText(blog.content) || "";
                    const blogCategory = renderText(blog.category) || "";
                    const blogAuthor = renderText(blog.Author) || "";

                    return (
                      <div
                        key={blog._id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#9f3562]/20 transition-all duration-300"
                      >
                        {blog.Thumbnail ? (
                          <img
                            src={blog.Thumbnail}
                            alt={blogTitle}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-[#9f3562]/30" />
                          </div>
                        )}

                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                            {blogTitle}
                          </h3>

                          {blogContent && (

                            <div
                              dangerouslySetInnerHTML={{ __html: blog.content }}
                              className="text-sm text-gray-600 mb-4 line-clamp-2">

                            </div>
                          )}

                          {blogCategory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-3">
                              {blogCategory}
                            </span>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                            {blogAuthor && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {blogAuthor}
                              </span>
                            )}
                            {blog.readingTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {blog.readingTime} Mins Read
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/blog/${blog._id}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Read More
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => navigate("/blogs")}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#9f3562] text-[#9f3562] rounded-lg hover:bg-[#9f3562] hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  >
                    View More Blogs
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;