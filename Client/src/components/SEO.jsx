import { Helmet } from 'react-helmet';

const SEO = ({ 
  title = 'Admeasy - Find Your Dream College', 
  description = 'Discover top colleges in India, connect with verified mentors, and access premium study notes. Your complete guide to college admissions and academic success.',
  keywords = 'colleges, admissions, mentors, study notes, education, IIT, IIM, DU colleges, engineering colleges, medical colleges, college search India',
  image = 'https://admeasy.in/src/assets/Admeasy/LOGO.webp',
  url = 'https://admeasy.in',
  type = 'website',
  author = 'Admeasy',
  publishedTime = null,
  modifiedTime = null
}) => {
  const fullTitle = title.includes('Admeasy') ? title : `${title} | Admeasy`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Admeasy" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;

