import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import SEO from '../components/SEO';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(()=>{
    window.scrollTo(0,0)
  },[navigate])

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blog');
      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      setBlogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlogClick = (blogId) => {
    navigate(`/blog/${blogId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error loading blogs: {error}</p>
          <button
            onClick={fetchBlogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg">No blogs available yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex justify-center flex-wrap gap-6">
      <SEO
        title="Blog - Education & College Admissions | Admeasy"
        description="Read our latest blogs on college admissions, education tips, career guidance, and student success stories. Stay updated with the latest trends in education."
        keywords="education blog, college admissions blog, career guidance, student tips, education news, college advice"
        url="https://admeasy.in/blog"
      />
      {blogs.map((blog) => (
        <div
          key={blog._id}
          onClick={() => handleBlogClick(blog._id)}
          className="flex flex-col md:flex-row items-center max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
        >
          {/* Thumbnail */}
          <div className="p-1 flex-shrink-0">
            <img
              draggable="false"
              src={`${blog.Thumbnail}`}
              alt={blog.Title}
              className="w-50 h-full object-cover rounded-l-2xl"
              onError={(e) => {
                e.target.src = 'https://placehold.co/144x144/EEE/AAA?text=No+Image';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between p-5 flex-1">
            {/* Title */}
            <h1 className="text-[16px] md:text-xl font-admeasy-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 md:line-clamp-1">
              {blog.Title}|Admeasy
            </h1>

            {/* Description */}
            <p
              className="text-sm text-gray-600 mt-2 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            ></p>
            {/* Meta Section */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 text-xs text-gray-500">
              {/* Left: Author Info */}
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">
                 <strong> Author: {blog.Author}</strong>
                </span>
              </div>

              {/* Right: Time + Category */}
              <div className="flex items-center space-x-3">
                <span>⏱️ {blog.readingTime} min read</span>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
                  {blog.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Blogs;