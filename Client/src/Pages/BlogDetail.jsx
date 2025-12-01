import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaUser, FaFolder } from 'react-icons/fa';
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import SEO from '../components/SEO';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    window.scrollTo(0,0)
  },[navigate])

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blog/${id}`);
      if (!response.ok) throw new Error('Blog not found');
      const data = await response.json();
      setBlog(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Blog not found'}</p>
          <button
            onClick={() => navigate('/blogs')}
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  // Add structured data for blog article
  useEffect(() => {
    if (blog) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.Title,
        "description": blog.content?.replace(/<[^>]*>/g, '').substring(0, 200) || blog.Title,
        "image": blog.Thumbnail,
        "author": {
          "@type": "Person",
          "name": blog.Author
        },
        "publisher": {
          "@type": "Organization",
          "name": "Admeasy",
          "logo": {
            "@type": "ImageObject",
            "url": "https://admeasy.in/src/assets/Admeasy/LOGO.webp"
          }
        },
        "datePublished": blog.createdAt,
        "dateModified": blog.updatedAt || blog.createdAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://admeasy.in/blog/${id}`
        },
        "articleSection": blog.category,
        "wordCount": blog.content?.replace(/<[^>]*>/g, '').split(' ').length || 0
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      script.id = 'blog-structured-data';
      document.head.appendChild(script);
      
      return () => {
        const existingScript = document.getElementById('blog-structured-data');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [blog, id]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <SEO
        title={blog?.Title || 'Blog Post'}
        description={blog?.content?.replace(/<[^>]*>/g, '').substring(0, 160) || blog?.Title || 'Read our latest blog post'}
        keywords={`${blog?.category || ''}, education, college admissions, ${blog?.Title || ''}`}
        image={blog?.Thumbnail || 'https://admeasy.in/src/assets/Admeasy/LOGO.webp'}
        url={`https://admeasy.in/blog/${id}`}
        type="article"
        publishedTime={blog?.createdAt}
        modifiedTime={blog?.updatedAt || blog?.createdAt}
      />
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <FaArrowLeft />
          <span>Back to Blogs</span>
        </button>

        {/* Blog Card */}
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Thumbnail */}
          <div className="w-full p-3 sm:h-96 overflow-hidden flex justify-center">
            <img
              src={`${blog.Thumbnail}`}
              alt={blog.Title}
              className=" object-cover rounded-2xl"
              onError={(e) => {
                e.target.src ='https://placehold.co/144x144?text=No+Image';
              }}
            />
          </div>

          <div className="p-6 sm:p-10">
            {/* Category Badge */}
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              {blog.category}
            </span>

            {/* Title */}
            <h1 title={blog.Title} className="text-1xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {blog.Title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FaUser className="text-indigo-600" />
                <strong className="font-medium">{blog.Author}</strong>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-indigo-600" />
                <span>{blog.readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <FaFolder className="text-indigo-600" />
                <strong>{blog.category}</strong>
              </div>
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              <div
              
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              ></div>
            </div>

            {/* Publish Date */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Published on {new Date(blog.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;