import { Helmet } from 'react-helmet';

const SEO = ({
  title = 'Admeasy - Find Your Dream College',
  description = 'Discover top colleges in India, connect with verified mentors, and access premium study notes. Your complete guide to college admissions and academic success.',
  keywords = 'colleges, admissions, mentors, study notes, education, IIT, IIM, DU colleges, engineering colleges, medical colleges, college search India',
  image = 'https://admeasy.in/LOGO.webp',
  url = typeof window !== 'undefined' ? window.location.href : 'https://admeasy.in',
  /** When set, used for canonical, og:url, and twitter:url (recommended for public URLs). */
  canonicalUrl = null,
  /** One or more JSON-LD objects (e.g. FAQPage + WebApplication). */
  jsonLd = null,
  type = 'website',
  author = 'Admeasy',
  publishedTime = null,
  modifiedTime = null,
}) => {
  const fullTitle = title.includes('Admeasy') ? title : `${title} | Admeasy`;
  const resolvedUrl = canonicalUrl || url;
  const schemas = jsonLd == null ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd];

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
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content="Admeasy — college admissions and CUET tools" />
      <meta property="og:site_name" content="Admeasy" />
      <meta property="og:locale" content="en_IN" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={resolvedUrl} />

      {schemas.map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;

