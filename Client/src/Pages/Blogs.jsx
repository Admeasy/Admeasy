import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import SEO from '../components/SEO';

// In-memory cache for blogs data
let blogsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Skeleton loader component
const BlogCardSkeleton = () => (
  <div className="flex flex-col md:flex-row items-center max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
    {/* Thumbnail Skeleton */}
    <div className="p-1 flex-shrink-0">
      <div className="w-50 h-36 bg-gray-300 rounded-l-2xl"></div>
    </div>

    {/* Content Skeleton */}
    <div className="flex flex-col justify-between p-5 flex-1 w-full">
      {/* Title Skeleton */}
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>

      {/* Description Skeleton */}
      <div className="space-y-2 mt-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Meta Section Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-2">
        {/* Author Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-32"></div>

        {/* Time + Category Skeleton */}
        <div className="flex items-center space-x-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [navigate]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    // Check if cache is valid
    const now = Date.now();
    if (blogsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setBlogs(blogsCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blog');
      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      
      // Update cache
      blogsCache = data;
      cacheTimestamp = Date.now();
      
      setBlogs(data);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlogClick = (blogId) => {
    navigate(`/blogs/${blogId}`);
  };

  // Wrapper div for consistent layout spacing
  const LayoutWrapper = ({ children }) => (
    <div className="transition-all duration-300 min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
      {/* Enhanced Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <LayoutWrapper>
        <SEO
          title="Blog - Education & College Admissions | Admeasy"
          description="Read our latest blogs on college admissions, education tips, career guidance, and student success stories."
          keywords="education blog, college admissions blog, career guidance"
          url="https://admeasy.in/blog"
        />
        <div className="p-6 flex justify-center flex-wrap gap-6">
          {[...Array(6)].map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <SEO
          title="Blog - Error | Admeasy"
          description="Error loading blogs."
          keywords="error"
          url="https://admeasy.in/blog"
        />
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-500 text-lg mb-4 font-semibold">Failed to load blogs</p>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <button
              onClick={fetchBlogs}
              className="px-6 py-3 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-lg hover:shadow-lg hover:shadow-[#9f3562]/30 transition-all font-medium shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (blogs.length === 0) {
    return (
      <LayoutWrapper>
        <SEO
          title="Admeasy Blogs - Education & College Admissions | Admeasy"
          description="Read our latest blogs on college admissions, education tips, career guidance."
          keywords="education blog"
          url="https://admeasy.in/blogs"
        />
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-center p-6">
            <div className="mb-4">
              <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-xl font-medium mb-2">No blogs available yet</p>
            <p className="text-gray-400 text-sm">Check back soon for new content!</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SEO
        title="Admeasy Blogs - Education & College Admissions | Admeasy"
        description="Read our latest blogs on college admissions, education tips, career guidance, and student success stories."
        keywords="education blog, college admissions blog, career guidance"
        url="https://admeasy.in/blogs"
      />
      <div className="p-6 flex justify-center flex-wrap gap-6 relative z-10">
        {blogs.map((blog) => (
          <div
            key={blog._id}
            onClick={() => handleBlogClick(blog._id)}
            className="flex flex-col md:flex-row items-center max-w-2xl bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer hover:border-[#9f3562]/30"
          >
            {/* Thumbnail */}
            <div className="p-1 flex-shrink-0">
              <img
                draggable="false"
                src={blog.Thumbnail}
                alt={blog.Title}
                loading="lazy"
                className="w-50 h-full object-cover rounded-l-2xl"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/144x144/EEE/AAA?text=No+Image';
                }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between p-5 flex-1">
              {/* Title */}
              <h1 className="text-[16px] md:text-xl font-admeasy-bold text-gray-800 hover:text-[#9f3562] transition-colors line-clamp-2 md:line-clamp-1">
                {blog.Title} | Admeasy
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
                    <strong>Author: {blog.Author}</strong>
                  </span>
                </div>

                {/* Right: Time + Category */}
                <div className="flex items-center space-x-3">
                  <span>⏱️ {blog.readingTime} min read</span>
                  <span className="bg-[#9f3562]/10 text-[#9f3562] px-3 py-1 rounded-full font-medium">
                    {blog.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LayoutWrapper>
  );
};

export default Blogs;