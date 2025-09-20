import React from 'react'

const Blogs = () => {
  return (
    <div className='p-6 flex justify-center flex-wrap gap-4'>

      <div className="flex items-center max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <div className="w-36 h-36 flex-shrink-0">
        <img
        draggable='false'
          src="https://i.insider.com/68c326a2f9db348adc0b501a?width=400&format=jpeg&auto=webp&quality=60%2C55"
          alt="Thumbnail"
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-5 flex-1">
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-1">
          Catchy Blog Title Goes Here
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          A short and engaging preview of the blog content goes here.
          Around 30 words with clean typography and automatic dots...
        </p>

        {/* Meta Section */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          {/* Left: Author Info */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Author : Nitish Kumar</span>
          </div>

          {/* Right: Time + Category */}
          <div className="flex items-center space-x-3">
            <span>⏱️ 3 min read</span>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
              Admissions
            </span>
          </div>
        </div>
      </div>
    </div>
      <div className="flex items-center max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <div className="w-36 h-36 flex-shrink-0">
        <img
          src="https://i.insider.com/68c326a2f9db348adc0b501a?width=400&format=jpeg&auto=webp&quality=60%2C55"
          alt="Thumbnail"
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-5 flex-1">
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-1">
          Catchy Blog Title Goes Here
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          A short and engaging preview of the blog content goes here.
          Around 30 words with clean typography and automatic dots...
        </p>

        {/* Meta Section */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          {/* Left: Author Info */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Author : Nitish Kumar</span>
          </div>

          {/* Right: Time + Category */}
          <div className="flex items-center space-x-3">
            <span>⏱️ 3 min read</span>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
              Admissions
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Blogs