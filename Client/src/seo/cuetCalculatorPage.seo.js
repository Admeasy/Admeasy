/**
 * CUET Calculator page — SEO constants, FAQ copy, JSON-LD, and programmatic route helpers.
 * Programmatic paths are templates for future routes (not yet registered in the router).
 */

export const CUET_CALCULATOR_CANONICAL_URL = 'https://admeasy.in/cuet-calculator';

export const CUET_CALCULATOR_OG_IMAGE =
  'https://admeasy.in/LOGO.webp';

export const CUET_CALCULATOR_PAGE_TITLE =
  'CUET College Predictor 2026 – Predict DU Colleges by CUET Score | Admeasy';

export const CUET_CALCULATOR_META_DESCRIPTION =
  'Predict your DU college using CUET marks, category, and previous year cutoff trends. Get safe, target, and dream college predictions instantly.';

/** Meta keywords — primary + long-tail (natural phrases, comma-separated). */
export const CUET_CALCULATOR_KEYWORDS = [
  'CUET college predictor',
  'CUET college predictor 2026',
  'DU college predictor',
  'CUET marks vs college',
  'CUET marks planner',
  'CUET college planner',
  'college predictor by CUET marks',
  'CUET score vs college',
  'CUET score vs rank',
  'CUET marks vs rank vs college',
  'which college can I get with CUET score',
  'CUET score based college predictor',
  'CUET cutoff predictor',
  'CUET expected college',
  'DU colleges by CUET marks',
  'CUET admission predictor',
  'CUET score calculator',
  'CUET college finder',
  'CUET 2026 college prediction',
  'CUET B.Com college predictor',
  'CUET Science college predictor',
  'CUET Arts college predictor',
  'DU admission chances calculator',
  'CUET safe target dream colleges',
  'CUET marks vs percentile vs college',
  'CUET normalized score predictor',
  'CUET cutoff analysis',
  'which DU college with 750 CUET marks',
  'best college at 700 CUET score',
  'Delhi University CUET',
  'Admeasy CUET tool',
].join(', ');

export const CUET_FAQ_ITEMS = [
  {
    question: 'What is a good CUET score for DU?',
    answer:
      'A competitive CUET score for Delhi University depends on your course and category. Top colleges often map to high percentiles of the total marks (800 or 1000 scale). Use this predictor with your exact marks and category to see realistic DU options from past cutoffs.',
  },
  {
    question: 'Which college can I get with 750 in CUET?',
    answer:
      'It depends on your programme, category, and the year’s competition. Enter 750 (and the correct total marks scale), pick your course, and review safe, target, and dream lists ranked against published closing scores.',
  },
  {
    question: 'How accurate is this CUET predictor?',
    answer:
      'Predictions are based on historical cutoff data, not official counselling. Use results as a planning guide, then verify with official DU and NTA announcements and mentor advice.',
  },
  {
    question: 'Is CUET score normalized in this tool?',
    answer:
      'Yes. Comparisons use percentage-style normalization so different total marks (for example 800 vs 1000) can be ranked fairly against each cutoff’s own scale.',
  },
  {
    question: 'What are safe and dream colleges?',
    answer:
      'Safe colleges are those where your normalized margin is stronger; target colleges are closer to the cutoff band; dream colleges are harder reaches. Labels help you plan applications and backups.',
  },
  {
    question: 'Can I predict DU colleges using CUET marks?',
    answer:
      'Yes. Select your category and course, enter your CUET marks, and the tool returns DU-oriented college suggestions aligned with stored cutoffs for that profile.',
  },
  {
    question: 'How do CUET marks, percentile, and college cutoffs relate?',
    answer:
      'Colleges admit on merit lists built from CUET scores and rules for your programme. Percentiles vary by shift and normalisation. This tool focuses on marks vs past closing scores so you can benchmark likely college tiers.',
  },
  {
    question: 'Does this work for Commerce, Science, and Arts courses?',
    answer:
      'Yes. Filter by stream when helpful and choose your exact DU course name to see cutoffs that match that programme.',
  },
];

/**
 * Future programmatic landing pages — use with React Router when pages exist.
 * @example buildCuetProgrammaticPath('750-marks-vs-colleges') => '/cuet/750-marks-vs-colleges'
 */
export const CUET_PROGRAMMATIC_ROUTE_PREFIX = '/cuet';

export const CUET_PROGRAMMATIC_ROUTE_EXAMPLES = [
  { slug: '750-marks-vs-colleges', label: '750 marks vs colleges' },
  { slug: 'bcom-hons-college-predictor', label: 'B.Com (Hons.) college predictor' },
  { slug: 'science-college-predictor', label: 'Science stream college predictor' },
  { slug: 'du-bcom-cutoff', label: 'DU B.Com cutoff insights' },
];

export function buildCuetProgrammaticPath(slug) {
  const clean = String(slug || '')
    .trim()
    .replace(/^\/+/, '');
  return `${CUET_PROGRAMMATIC_ROUTE_PREFIX}/${clean}`;
}

export function buildCuetCalculatorJsonLd() {
  const faqEntities = CUET_FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CUET College Predictor 2026 — Admeasy',
    url: CUET_CALCULATOR_CANONICAL_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript. Modern evergreen browser recommended.',
    description: CUET_CALCULATOR_META_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    provider: {
      '@type': 'Organization',
      name: 'Admeasy',
      url: 'https://admeasy.in',
    },
  };

  const eduApp = {
    '@context': 'https://schema.org',
    '@type': 'EducationalApplication',
    name: 'Admeasy CUET DU College Predictor',
    educationalUse: 'College admission planning for Delhi University via CUET',
    learningResourceType: 'Interactive calculator',
    url: CUET_CALCULATOR_CANONICAL_URL,
    description: CUET_CALCULATOR_META_DESCRIPTION,
    isAccessibleForFree: true,
    applicationCategory: 'Admissions',
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  };

  return [webApp, eduApp, faqPage];
}
