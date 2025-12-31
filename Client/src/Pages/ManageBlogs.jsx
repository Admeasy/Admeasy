import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
import { useState, useEffect } from "react";
import AddBlogForm from "../components/AddBlogForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingBlogId, setDeletingBlogId] = useState(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const showSuccess = (message) => toast.success(message);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify", { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error("Not authenticated");
      fetchBlogs();
    } catch (err) {
      console.error("Authentication failed:", err);
      navigate("/admin");
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blog");
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (blogId) => {
    try {
      const response = await fetch(`/api/blog/${blogId}`, { 
        credentials: "include" 
      });
      if (!response.ok) throw new Error("Failed to fetch blog details");
      const blogData = await response.json();
      setEditingBlog(blogData);
      setShowAddForm(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    setDeletingBlogId(blogId);
    try {
      const response = await fetch(`/api/blog/${blogId}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete blog");
      }
      await fetchBlogs();
      showSuccess("Blog deleted successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingBlogId(null);
    }
  };

  const handleAddNew = () => {
    setEditingBlog(null);
    setShowAddForm(true);
  };

  const handleSubmitBlog = async (formData, blogId = null) => {
    try {
      const url = blogId 
        ? `/api/blog/${blogId}` 
        : "/api/blog";
      const method = blogId ? "PUT" : "POST";

      const response = await fetch(url, { 
        method, 
        credentials: "include", 
        body: formData 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (blogId ? "Failed to update blog" : "Failed to add blog"));
      }

      await fetchBlogs();
      setShowAddForm(false);
      setEditingBlog(null);
      showSuccess(blogId ? "Blog updated successfully" : "Blog added successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingBlog(null);
  };

  const filteredBlogs = blogs
    .filter((blog) => blog.Title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.Title.localeCompare(b.Title, undefined, { sensitivity: "base" }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
        </div>
      </div>
    );
  }

  const NoBlogs = () => {
    return (
      <div className="flex items-center justify-center py-8 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
        <p className="text-gray-700 font-bold text-lg">No Blogs Yet! Add One!</p>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <button className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]" onClick={() => navigate(-1)}>
        <FaArrowLeft />
        Back
      </button>

      <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">Manage Blogs</h1>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={handleAddNew}
          className="mb-6 px-4 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 flex items-center hover:scale-105 active:scale-95 text-sm sm:text-base"
        >
          <FaPlus className="mr-2" />
          Add New Blog
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
          />
        </div>

        {filteredBlogs.length === 0 && <NoBlogs />}

        <ul className="space-y-4">
          {filteredBlogs.map((blog) => (
            <li
              key={blog._id}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 p-3 sm:p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30"
            >
              <span className="text-lg sm:text-xl font-medium text-gray-900">{blog.Title}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEdit(blog._id)}
                  className="px-3 sm:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  <FaEdit className="inline" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog._id)}
                  disabled={deletingBlogId === blog._id}
                  className={`px-3 sm:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 text-sm sm:text-base ${
                    deletingBlogId === blog._id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95`}
                >
                  {deletingBlogId === blog._id ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="inline" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {showAddForm && (
          <AddBlogForm
            onClose={handleCloseForm}
            onSubmit={(formData) => handleSubmitBlog(formData, editingBlog?._id)}
            editData={editingBlog}/>
        )}
      </div>
    </main>
  );
};

export default ManageBlogs;