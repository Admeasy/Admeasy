import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText, Users, GraduationCap, BookOpen, Eye, Heart, MapPin,
  Briefcase, Clock, Award, Search, Newspaper, Upload, ChevronRight, X, MessageSquare, Hash, MessageCircle
} from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi";
import { useUser } from "../context/UserContext";
import { useMentor } from "../context/MentorContext";
import PostCard from "../components/PostCard";
import { resolveNoteAuthor } from "../utils/noteAuthor";

/* ================= SAFE RENDER HELPER ================= */
const renderText = (value) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") {
    return value.name ?? value.title ?? value.overall ?? JSON.stringify(value);
  }
  return null;
};

/* ================= CONSTANTS ================= */
const TABS = [
  { label: "All", value: "all", icon: Search },
  { label: "Posts", value: "posts", icon: MessageSquare },
  { label: "Mentors", value: "mentors", icon: Users },
  { label: "Colleges", value: "colleges", icon: GraduationCap },
  { label: "Notes", value: "notes", icon: FileText },
  { label: "Spaces", value: "spaces", icon: HiOutlineUserGroup },
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

// Helper: detect IIT mentor from college name only
const isIITMentor = (mentor) => {
  const collegeStr = (mentor.college?.name || mentor.college || "").toString().toLowerCase();
  return collegeStr.includes("indian institute of technology") || collegeStr.includes("iit");
};

/* ================= COMPONENT ================= */
const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const tagParam = searchParams.get("tag") || ""; // Read tag from URL
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  // Initialize input based on query or tag
  const [searchInput, setSearchInput] = useState(tagParam ? `#${tagParam}` : query);

  const [results, setResults] = useState({
    mentors: [], colleges: [], blogs: [], notes: [], posts: []
  });
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const { user } = useUser();
  const { mentor } = useMentor();

  // Sync searchInput with URL changes (Back button support)
  useEffect(() => {
    if (tagParam) {
      setSearchInput(`#${tagParam}`);
    } else {
      setSearchInput(query);
    }
  }, [query, tagParam]);

  // Debounced search: Handles both ?q= and ?tag=
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      const trimmedInput = searchInput.trim();

      if (trimmedInput) {
        if (trimmedInput.startsWith('#')) {
          // If input is #tag, set tag param and clear q
          newParams.set("tag", trimmedInput.replace('#', ''));
          newParams.delete("q");
        } else {
          // Normal query
          newParams.set("q", trimmedInput);
          newParams.delete("tag");
        }
      } else {
        newParams.delete("q");
        newParams.delete("tag");
      }
      setSearchParams(newParams, { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  useEffect(() => {
    if (activeTab !== "spaces" && !(activeTab === "all" && query)) {
      setSpacesLoading(false);
      return;
    }

    const fetchSpaces = async () => {
      try {
        setSpacesLoading(true);
        const res = await axios.get("/api/spaces/discover", { withCredentials: true });
        if (res.data?.success) {
          let fetchedSpaces = res.data.spaces || [];
          const combinedQuery = (tagParam || query).toLowerCase();
          if (combinedQuery) {
            fetchedSpaces = fetchedSpaces.filter((space) => {
              return space.name?.toLowerCase().includes(combinedQuery) ||
                space.description?.toLowerCase().includes(combinedQuery);
            });
          }
          setSpaces(fetchedSpaces);
        }
      } catch (err) {
        console.error("Failed to fetch spaces for explore", err);
      } finally {
        setSpacesLoading(false);
      }
    };
    fetchSpaces();
  }, [query, tagParam]);

  useEffect(() => {
    if (activeTab === "spaces") return;

    // Use tag (with #) or query for caching
    const effectiveQuery = tagParam ? `#${tagParam}` : query;
    const cached = effectiveQuery ? getCachedResults(effectiveQuery, activeTab) : null;

    if (cached) {
      setResults(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchResults = async () => {
      try {
        // Construct backend query: If tag exists, send as #tag
        const backendQ = tagParam ? `#${tagParam}` : query;
        const url = activeTab === "all"
          ? `/api/search?q=${encodeURIComponent(backendQ || "")}`
          : `/api/search?q=${encodeURIComponent(backendQ || "")}&type=${activeTab}`;

        const { data } = await axios.get(url);
        const newResults = data.results || { mentors: [], colleges: [], blogs: [], notes: [], posts: [] };

        setResults(newResults);
        if (backendQ) {
          setCachedResults(backendQ, activeTab, newResults);
        }
      } catch (err) {
        console.error("Search failed", err);
        setResults({ mentors: [], colleges: [], blogs: [], notes: [], posts: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, tagParam, activeTab]);

  const totalResults = activeTab === "spaces"
    ? (spaces?.length || 0)
    : Object.values(results || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
    );

  const getFilteredResults = () => {
    const safeResults = results || { mentors: [], colleges: [], blogs: [], notes: [], posts: [] };
    if (activeTab === "all") {
      return {
        posts: safeResults.posts || [],
        mentors: safeResults.mentors || [],
        colleges: safeResults.colleges || [],
        blogs: safeResults.blogs || [],
        notes: safeResults.notes || [],
      };
    }
    if (activeTab === "spaces") {
      return { spaces: spaces || [] };
    }
    return {
      [activeTab]: safeResults[activeTab] || [],
    };
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
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
                {searchInput.startsWith('#') ? (
                  <Hash className="w-5 h-5 text-[#9f3562]" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#9f3562]" />
                )}
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search mentors, posts, notes, or use #hashtags..."
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
            {(query || tagParam) && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-[#9f3562]">{totalResults}</span> results for{" "}
                  <span className="font-semibold text-gray-900">"{tagParam ? `#${tagParam}` : query}"</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-3 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    if (tab.value === "notes") {
                      navigate("/notes");
                    } else {
                      setActiveTab(tab.value);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer border ${isActive ? "bg-[#9f3562] text-white border-transparent shadow-md shadow-pink-200" : "bg-white text-gray-600 hover:bg-gray-200 border-gray-200"}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
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
        ) : (activeTab === "spaces" && spacesLoading) ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#9f3562]/20 border-t-[#9f3562] rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading spaces...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ================= MENTORS SECTION (First - with IIT badge) ================= */}
            {filteredResults.mentors && filteredResults.mentors.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Mentors</h2>
                  <span onClick={() => navigate(`/mentors`)} className="cursor-pointer px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold hover:bg-[#9f3562]/20 transition-colors">View More</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.mentors.map((mentorItem) => {
                    const mentorName = renderText(mentorItem.name) || "Anonymous";
                    const mentorIsIIT = isIITMentor(mentorItem);
                    return (
                      <div key={mentorItem._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                        <div className="p-6">
                          <div className="mb-3 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl">
                            <p className="text-xs font-semibold text-amber-800 flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-600" />
                              {mentorIsIIT ? "This mentor cleared IIT, Chat Now!" : "Connect with this mentor"}
                            </p>
                          </div>
                          <div className="flex items-start gap-4 mb-4">
                            <img src={mentorItem.image || mentorItem.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorName}`} alt={mentorName} className="w-16 h-16 rounded-full object-cover ring-2 ring-[#9f3562]/20" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-lg mb-1">{mentorName}</h3>
                              {mentorItem.college && <p className="text-sm text-gray-500 truncate">{renderText(mentorItem.college?.name || mentorItem.college)}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(mentorItem.username ? `/mentors/${mentorItem.username}` : `/mentors`)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm">
                              <Eye className="w-4 h-4" /> View Profile
                            </button>
                            <button onClick={() => navigate(mentorItem.username ? `/mentors/${mentorItem.username}` : `/mentors`)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm">
                              <MessageCircle className="w-4 h-4" /> Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================= POSTS SECTION ================= */}
            {filteredResults.posts && filteredResults.posts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">
                    {filteredResults.posts.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.posts.map((post) => (
                    <div key={post._id} className="relative z-10 w-full h-full max-w-[450px] mx-auto">
                      <PostCard post={post} />
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
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">{filteredResults.notes.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.notes.map((note) => (
                    <div key={note._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                      <div className="p-6 pb-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#9f3562]/10 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-7 h-7 text-[#9f3562]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-[#9f3562] transition-colors">{renderText(note.title) || "Untitled Note"}</h3>
                          </div>
                        </div>
                        {note.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{renderText(note.description)}</p>}

                        {note.hashtags && note.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] bg-pink-50 text-[#9f3562] px-2 py-0.5 rounded-md font-bold">#{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="mb-3">
                          {(() => {
                            const a = resolveNoteAuthor(note);
                            return (
                              <button
                                type="button"
                                disabled={!a.profilePath}
                                onClick={() =>
                                  a.profilePath && navigate(a.profilePath)
                                }
                                className={`flex items-center gap-3 w-full text-left rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2 transition-colors ${
                                  a.profilePath
                                    ? "hover:bg-slate-100 hover:border-[#9f3562]/30 cursor-pointer"
                                    : "cursor-default"
                                }`}
                              >
                                <img
                                  src={a.image}
                                  alt=""
                                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-white flex-shrink-0 bg-white"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {a.displayName}
                                  </p>
                                  {a.username ? (
                                    <p className="text-xs text-[#9f3562] font-semibold truncate">
                                      @{a.username}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      Study notes
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {note.likes !== undefined && <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{note.likes}</span>}
                          {note.views !== undefined && <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{note.views}</span>}
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <button onClick={() => navigate(`/notes/${note._id}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm">
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================= SPACES SECTION ================= */}
            {((activeTab === "all" && !spacesLoading && spaces && spaces.length > 0) ||
              (activeTab === "spaces" && !spacesLoading && filteredResults.spaces && filteredResults.spaces.length > 0)) && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <HiOutlineUserGroup className="w-6 h-6 text-[#9f3562]" />
                    <h2 className="text-2xl font-bold text-gray-900">Spaces</h2>
                    <span onClick={() => navigate("/spaces/explore")} className="cursor-pointer px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">View More</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === "spaces" ? filteredResults.spaces : spaces).slice(0, 6).map((space) => (
                      <div key={space._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all flex flex-col group">
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <img src={space.logo} alt={space.name} className="w-10 h-10 rounded-full object-cover" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-base mb-1 break-words">{space.name}</h3>
                                <p className="text-xs text-gray-500">{space.membersCount || 0} member{(space.membersCount || 0) === 1 ? "" : "s"}</p>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/spaces/${space._id}`); }} className="flex-shrink-0 px-3 py-1.5 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors text-xs font-semibold">Join</button>
                          </div>
                          {space.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{space.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* ================= COLLEGES SECTION ================= */}
            {filteredResults.colleges && filteredResults.colleges.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Colleges</h2>
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">{filteredResults.colleges.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.colleges.map((college) => {
                    const collegeName = renderText(college.name) || "Unknown College";
                    return (
                      <div key={college._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                        <div className="h-40 bg-gradient-to-br from-[#9f3562]/10 via-purple-50 to-blue-50 flex items-center justify-center p-6">
                          {college.logo ? <img src={college.logo} alt={collegeName} className="max-h-full max-w-full object-contain" /> : <GraduationCap className="w-16 h-16 text-[#9f3562]/30" />}
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 text-lg mb-3">{collegeName}</h3>
                          <button onClick={() => navigate(`/colleges/${college._id}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"><Eye className="w-4 h-4" /> View Details</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================= BLOGS SECTION ================= */}
            {filteredResults.blogs && filteredResults.blogs.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-[#9f3562]" />
                  <h2 className="text-2xl font-bold text-gray-900">Blogs</h2>
                  <span className="px-3 py-1 bg-[#9f3562]/10 text-[#9f3562] rounded-full text-sm font-semibold">{filteredResults.blogs.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.blogs.map((blog) => (
                    <div key={blog._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                      {blog.Thumbnail && <img src={blog.Thumbnail} alt={blog.Title} className="w-full h-48 object-cover" />}
                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{renderText(blog.Title)}</h3>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                          {blog.Author && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{renderText(blog.Author)}</span>}
                          {blog.readingTime && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{blog.readingTime} Mins Read</span>}
                        </div>
                        <button onClick={() => navigate(`/blogs/${blog._id}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#9f3562] text-white rounded-lg hover:bg-[#b86286] transition-colors font-medium text-sm"><Eye className="w-4 h-4" /> Read More</button>
                      </div>
                    </div>
                  ))}
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