import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SEO from '../components/SEO';
import {
  buildCuetCalculatorJsonLd,
  buildCuetProgrammaticPath,
  CUET_CALCULATOR_CANONICAL_URL,
  CUET_CALCULATOR_KEYWORDS,
  CUET_CALCULATOR_META_DESCRIPTION,
  CUET_CALCULATOR_OG_IMAGE,
  CUET_CALCULATOR_PAGE_TITLE,
  CUET_FAQ_ITEMS,
  CUET_PROGRAMMATIC_ROUTE_EXAMPLES,
} from '../seo/cuetCalculatorPage.seo';
import { AnimatePresence, motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import {
  HiSparkles,
  HiOutlineArrowRight,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiLightBulb,
} from 'react-icons/hi2';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Rocket,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';
import CuetDiscussionSection from '../components/discussion/CuetDiscussionSection';

const CATEGORY_OPTIONS = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'PWBD'];
const STREAM_OPTIONS = ['Commerce', 'Science', 'Arts'];

const safeText = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || fallback;
  if (typeof value === 'object') return safeText(value.name || value.label || value.title || value.value || value.id, fallback);
  return fallback;
};

// Normalize strings for fuzzy matching (remove dots, spaces, normalize hons)
const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/\(hons\.\)/g, 'hons');

const FALLBACK_MENTORS = [
  {
    _id: 'fallback-1',
    username: 'shreya.gupta',
    name: 'Shreya Gupta',
    specialization: 'DU Commerce & CUET',
    college: 'Shri Ram College of Commerce',
    stream: 'Commerce',
    course: 'B.Com (Hons.)',
    tagline: 'Top scorer helping students target SRCC & Hindu College.',
    studentsHelped: '320+',
    responseTime: '1h',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
  },
  {
    _id: 'fallback-2',
    username: 'rohan.agarwal',
    name: 'Rohan Agarwal',
    specialization: 'B.Sc. Physics & CUET',
    college: 'Delhi University Science',
    stream: 'Science',
    course: 'B.Sc. (H) Physics',
    tagline: 'Physics specialist guiding DU science admission seekers.',
    studentsHelped: '280+',
    responseTime: '2h',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  },
  {
    _id: 'fallback-3',
    username: 'anya.mishra',
    name: 'Anya Mishra',
    specialization: 'CUET Strategy & Counseling',
    college: 'Delhi University (Multi-stream)',
    stream: 'Arts',
    course: 'B.A. (Hons.) English',
    tagline: 'Expert CUET strategist helping students find perfect fit.',
    studentsHelped: '410+',
    responseTime: '45m',
    imageUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=500&q=80',
  },
  {
    _id: 'fallback-4',
    username: 'priya.sethi',
    name: 'Priya Sethi',
    specialization: 'Commerce & Economics',
    college: 'Hindu College, DU',
    stream: 'Commerce',
    course: 'B.Com (Hons.) Economics',
    tagline: 'Commerce mentor with proven track record in admissions.',
    studentsHelped: '250+',
    responseTime: '1h',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80',
  },
  {
    _id: 'fallback-5',
    username: 'vikram.sharma',
    name: 'Vikram Sharma',
    specialization: 'B.Sc. Mathematics',
    college: 'Delhi University (Science)',
    stream: 'Science',
    course: 'B.Sc. (H) Mathematics',
    tagline: 'Math expert helping students secure DU college admissions.',
    studentsHelped: '190+',
    responseTime: '90m',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
  },
  {
    _id: 'fallback-6',
    username: 'deepika.naidu',
    name: 'Deepika Naidu',
    specialization: 'Arts & Humanities',
    college: 'Delhi University (Arts)',
    stream: 'Arts',
    course: 'B.A. (Hons.) History',
    tagline: 'Humanities guide helping students navigate DU choices.',
    studentsHelped: '340+',
    responseTime: '1.5h',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69da47?auto=format&fit=crop&w=500&q=80',
  },
];

const badgeStyles = {
  safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  target: 'bg-amber-50 text-amber-700 border-amber-200',
  dream: 'bg-rose-50 text-rose-700 border-rose-200',
};

const filterMentorsByContext = (mentors, selectedCourse, stream) => {
  if (!Array.isArray(mentors) || mentors.length === 0) return [];

  const courseLabel = safeText(selectedCourse?.label, '').toLowerCase();
  const streamValue = safeText(stream, '').toLowerCase();

  // If no context provided, return all mentors
  if (!courseLabel && !streamValue) return mentors;

  // Scoring system for mentor relevance
  const scored = mentors.map((mentor) => {
    let score = 0;

    // Extract mentor metadata
    const mentorCourse = safeText(mentor.course, '').toLowerCase();
    const mentorStream = safeText(mentor.stream, '').toLowerCase();
    const mentorSpec = safeText(mentor.specialization, '').toLowerCase();
    const mentorCollege = safeText(mentor.college, '').toLowerCase();
    const mentorTagline = safeText(mentor.tagline, '').toLowerCase();

    // Exact course match (highest priority)
    if (courseLabel && mentorCourse.includes(courseLabel)) score += 100;
    if (courseLabel && mentorSpec.includes(courseLabel)) score += 50;

    // Exact stream match
    if (streamValue && mentorStream === streamValue) score += 50;
    if (streamValue && mentorSpec.includes(streamValue)) score += 30;

    // Contextual keywords
    if (courseLabel) {
      const courseWords = courseLabel.split(' ');
      courseWords.forEach((word) => {
        if (word.length > 2) {
          if (mentorCollege.includes(word)) score += 20;
          if (mentorTagline.includes(word)) score += 10;
        }
      });
    }

    // Stream context keywords
    const streamKeywords = {
      commerce: ['commerce', 'b.com', 'economics', 'accounting', 'srcc', 'hindu', 'hansraj', 'business'],
      science: ['science', 'b.sc', 'physics', 'chemistry', 'biology', 'engineering', 'neet', 'iit'],
      arts: ['arts', 'b.a', 'humanities', 'history', 'english', 'political', 'sociology', 'language'],
    };

    const relevantKeywords = streamKeywords[streamValue] || [];
    relevantKeywords.forEach((keyword) => {
      if (mentorSpec.includes(keyword)) score += 15;
      if (mentorCourse.includes(keyword)) score += 15;
      if (mentorTagline.includes(keyword)) score += 10;
      if (mentorCollege.includes(keyword)) score += 5;
    });

    return { mentor, score };
  });

  // Sort by relevance score and return top mentors
  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.mentor)
    .slice(0, 6);
};

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#9f3562]/50 focus:ring-2 focus:ring-[#9f3562]/15';

const normalizeCourse = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    return { id: normalize(item), name: item, value: item, label: item, stream: '' };
  }
  if (typeof item === 'object') {
    const name = safeText(item.name || item.course || item.label || item.title || item.value, 'Course');
    const value = safeText(item.value || item.name || item.course || item.label || item.title, name);
    return {
      id: safeText(item.id, normalize(value || name)),
      name,
      value,
      label: name,
      stream: safeText(item.stream || item.department || item.category || ''),
    };
  }
  return null;
};

const LoadingSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-2/5 rounded-full bg-slate-200 animate-pulse" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-4/5 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-3/5 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

const MentorPlaceholderCard = () => (
  <div className="h-full flex flex-col rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-4 mb-4">
      <div className="h-16 w-16 flex-shrink-0 rounded-full bg-slate-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
    <div className="mb-3 h-7 w-32 rounded-full bg-slate-200 animate-pulse" />
    <div className="flex-1 space-y-2 mb-4">
      <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
      <div className="h-3 w-4/5 rounded bg-slate-200 animate-pulse" />
    </div>
    <div className="space-y-2 mb-5">
      <div className="h-9 rounded-lg bg-slate-200 animate-pulse" />
      <div className="h-9 rounded-lg bg-slate-200 animate-pulse" />
    </div>
    <div className="h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
  </div>
);

const CollegeCard = ({ college }) => {
  const safeCollege = college || {};
  const collegeName = safeText(safeCollege.collegeName, 'Unknown college');
  const courseLabel = safeText(safeCollege.course, 'Course not specified');
  const cutoffMax = Number(safeCollege.cutoffMaxMarks);
  const cutoffRaw = safeCollege.cutoff;
  const cutoffValue =
    Number.isFinite(cutoffMax) && cutoffMax > 0
      ? `${safeText(cutoffRaw, 'N/A')} / ${cutoffMax}`
      : safeText(cutoffRaw, 'N/A');
  const parsedPctDiff = Number(safeCollege.percentageDifference);
  const parsedDifference = Number(safeCollege.difference);
  const hasNormalized = Number.isFinite(parsedPctDiff);
  const scoreDiff = hasNormalized
    ? parsedPctDiff
    : Number.isFinite(parsedDifference)
      ? parsedDifference
      : Number(safeCollege.score || 0) - Number(safeCollege.cutoff || 0);
  const deltaLabel = hasNormalized
    ? `${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(2)}%`
    : scoreDiff >= 0
      ? `+${scoreDiff}`
      : `${scoreDiff}`;
  const chanceLabel = safeText(safeCollege?.chance?.label || safeCollege?.chance, 'LOW').toUpperCase();
  const chanceMeta =
    chanceLabel === 'HIGH'
      ? { text: 'Strong Chance', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : chanceLabel === 'MEDIUM'
      ? { text: 'Possible', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
      : { text: 'Reach', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
  const eligibility = hasNormalized
    ? scoreDiff >= 0
      ? { text: 'Eligible', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 }
      : scoreDiff >= -2
        ? { text: 'Borderline', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle }
        : { text: 'Difficult', tone: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle }
    : scoreDiff >= 0
      ? { text: 'Eligible', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 }
      : Math.abs(scoreDiff) <= 15
        ? { text: 'Borderline', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle }
        : { text: 'Difficult', tone: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle };
  const EligibilityIcon = eligibility.icon;
  const studentPct = Number(safeCollege.studentPercentage);
  const cutoffPct = Number(safeCollege.cutoffPercentage);
  const showPctStrip =
    Number.isFinite(studentPct) && Number.isFinite(cutoffPct);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">{collegeName}</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{courseLabel}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chanceMeta.tone}`}>
          {chanceMeta.text}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div className="font-medium text-slate-500"> Cutoff</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{cutoffValue}</div>
          {showPctStrip ? (
            <div className="mt-1 text-[11px] text-slate-500">Cutoff {cutoffPct.toFixed(2)}% of total</div>
          ) : null}
        </div>
        <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div className="font-medium text-slate-500">{hasNormalized ? '📈 vs cutoff (% pts)' : '📈 Difference'}</div>
          <div className={`mt-1 text-sm font-semibold ${scoreDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {deltaLabel}
          </div>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-xs ${eligibility.tone}`}>
          <div className="font-medium">Status</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
            <EligibilityIcon className="h-4 w-4" />
            {eligibility.text}
          </div>
          {showPctStrip && Number.isFinite(studentPct) ? (
            <div className="mt-1.5 text-[11px] font-normal opacity-90">Your score ≈ {studentPct.toFixed(2)}% (normalized)</div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

const ResultGroup = ({ title, tone, colleges, description, isOpen, onToggle, icon: Icon }) => {
  const validColleges = Array.isArray(colleges) ? colleges : [];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 rounded-xl border p-2 ${badgeStyles[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{description}</p>
            <p className="mt-1 text-xs text-slate-500">{validColleges.length} college{validColleges.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key={`${title}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-gray-100 px-4 py-4 sm:px-5">
              {validColleges.length ? (
                validColleges.map((college, index) => (
                  <CollegeCard key={`${safeText(college?.collegeName, 'college')}-${index}`} college={college} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No {title.toLowerCase()} results available.
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};


// Enhanced Course dropdown with keyboard navigation and normalized matching
const CourseDropdown = ({
  courses,
  query,
  open,
  selectedCourse,
  onSearch,
  onSelect,
  onOpen,
  onClose,
  loading,
}) => {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [highlight, setHighlight] = useState(-1);

  const filtered = useMemo(() => {
    if (!query.trim()) return safeCourses.slice(0, 50);
    const qn = normalize(query);
    return safeCourses
      .filter((course) => {
        const name = safeText(course?.name || course?.label || course?.value || '');
        return normalize(name).includes(qn);
      })
      .slice(0, 50);
  }, [safeCourses, query]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    setHighlight(-1);
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && filtered[highlight]) {
        onSelect(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="relative" aria-expanded={open}>
      <button
        type="button"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-slate-900 transition hover:border-pink-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300/30"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={`truncate ${selectedCourse ? 'text-slate-900' : 'text-slate-500'}`}>
            {selectedCourse?.name || selectedCourse?.label || 'Search course name'}
          </span>
          <HiOutlineChevronDown className="h-5 w-5 text-slate-400" />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="p-3">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => onSearch(event.target.value)}
              onFocus={onOpen}
              onKeyDown={handleKeyDown}
              placeholder="Search courses"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20"
            />
          </div>
          <div ref={listRef} className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading courses...</div>
            ) : filtered.length ? (
              filtered.map((course, index) => {
                const courseLabel = safeText(course?.label || course?.name, 'Unknown course');
                return (
                  <button
                    key={safeText(course?.id || course?.value || `${index}`)}
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onMouseLeave={() => setHighlight(-1)}
                    onClick={() => onSelect(course)}
                    className={`w-full px-4 py-3 text-left text-sm transition flex items-center justify-between gap-3 ${
                      highlight === index ? 'bg-pink-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate text-slate-800">{courseLabel}</span>
                    {course?.stream ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                        {safeText(course.stream)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-sm text-slate-500">No matching courses found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// const CourseDropdown = ({ courses, query, open, selectedCourse, onSearch, onSelect, loading }) => {
//   const safeCourses = Array.isArray(courses) ? courses : [];
//   const filtered = useMemo(() => {
//     if (!query.trim()) return safeCourses.slice(0, 10);
//     return safeCourses
//       .filter((course) => safeText(course?.label, '').toLowerCase().includes(query.toLowerCase()))
//       .slice(0, 10);
//   }, [safeCourses, query]);

//   return (
//     <div className="relative" aria-expanded={open}>
//       <button
//         type="button"
//         className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-slate-900 transition hover:border-pink-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300/30"
//         onClick={() => onSelect(null)}
//       >
//         <div className="flex items-center justify-between gap-3">
//           <span className={`truncate ${selectedCourse ? 'text-slate-900' : 'text-slate-500'}`}>
//             {selectedCourse?.label || 'Search course name'}
//           </span>
//           <HiOutlineChevronDown className="h-5 w-5 text-slate-400" />
//         </div>
//       </button>

//       {open && (
//         <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
//           <div className="p-4">
//             <input
//               type="search"
//               value={query}
//               onChange={(event) => onSearch(event.target.value)}
//               placeholder="Search courses"
//               className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20"
//             />
//           </div>
//           <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
//             {loading ? (
//               <div className="space-y-3 p-4">
//                 <div className="h-3 rounded-full bg-slate-200 animate-pulse" />
//                 <div className="h-3 rounded-full bg-slate-200 w-4/5 animate-pulse" />
//                 <div className="h-3 rounded-full bg-slate-200 w-3/5 animate-pulse" />
//               </div>
//             ) : filtered.length ? (
//               filtered.map((course, index) => {
//                 const courseLabel = safeText(course?.label, 'Unknown course');
//                 const courseStream = safeText(course?.stream, '');
//                 return (
//                   <button
//                     key={safeText(course?.value, `${index}`)}
//                     type="button"
//                     onClick={() => onSelect(course)}
//                     className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
//                   >
//                     <div className="flex items-center justify-between gap-3">
//                       <span>{courseLabel}</span>
//                       {courseStream ? (
//                         <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
//                           {courseStream}
//                         </span>
//                       ) : null}
//                     </div>
//                   </button>
//                 );
//               })
//             ) : (
//               <div className="p-4 text-sm text-slate-500">No courses match your search.</div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

const MentorCard = ({ mentor, onConnect }) => {
  const mentorData = mentor || {};
  const fallbackImage ="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  const imageUrl = safeText(mentorData.imageUrl, safeText(mentorData.image, '/default-profile.png'));
  const name = safeText(mentorData.name, 'Top Mentor');
  const college = safeText(mentorData.college, '');
  const specialization = safeText(mentorData.course || mentorData.specialization, 'DU Admissions');
  const tagline = safeText(mentorData.tagline, 'Guiding students through DU admissions.');
  const getSeedNumber = (value = "") => {
    return String(value)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  };
  
  const studentsHelpedOptions = [
    "5+",
    "8+",
    "9",
    "10",
    "13",
    "15",
    "20"
  ];
  
  const responseTimeOptions = [
    "~15m",
    "~30m",
    "~45m",
    "~1h",
    "~2h",
    "~3h"
  ];
  
  const seed =
    getSeedNumber(
      mentorData._id ||
      mentorData.id ||
      mentorData.name ||
      index
    );
  
  const studentsHelped = safeText(
    mentorData.studentsHelped ||
    mentorData.menteesCount ||
    mentorData.studentCount,
    studentsHelpedOptions[
      seed % studentsHelpedOptions.length
    ]
  );
  
  const responseTime = safeText(
    mentorData.responseTime,
    responseTimeOptions[
      seed % responseTimeOptions.length
    ]
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="h-full flex flex-col rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Avatar Section */}
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 border border-gray-200">
          <img
            src={imageUrl}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
            alt={name}
            width={64}
            height={64}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {name}
          </p>

          {college ? (
            <p className="mt-0.5 text-xs text-slate-500 truncate">
              {college}
            </p>
          ) : null}
        </div>
      </div>

      {/* Specialization Badge */}
      <div className="mb-3">
        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {specialization}
        </span>
      </div>

      {/* Tagline */}
      <p className="flex-1 text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">{tagline}</p>

      {/* Stats Grid */}
      <div className="grid gap-2 mb-5">
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-900">{studentsHelped}</span>
          <span className="text-slate-500"> students helped</span>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-900">~{responseTime}</span>
          <span className="text-slate-500"> reply time</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onConnect}
        className="w-full rounded-xl bg-gradient-to-r from-[#9f3562] to-[#b14270] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
      >
        Connect Now
      </button>
    </motion.div>
  );
};

const PredictionForm = ({
  score,
  maxMarksTotal,
  category,
  stream,
  selectedCourse,
  courseQuery,
  filteredCourses,
  isLoadingCourses,
  isPredicting,
  formError,
  onFieldChange,
  onCategoryChange,
  onStreamChange,
  onCourseSelect,
  onSubmit,
  retryCourses,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.form
      layout
      onSubmit={onSubmit}
      className="space-y-5 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          CUET Score (raw marks)
          <input
            type="number"
            min={0}
            max={Number(maxMarksTotal) > 0 ? Number(maxMarksTotal) : 800}
            value={score}
            onChange={(e) => onFieldChange('score', e.target.value)}
            placeholder={`0 – ${Number(maxMarksTotal) > 0 ? maxMarksTotal : 800}`}
            className={fieldClass}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Category
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={fieldClass}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
        <span>Total marks (your exam scale)</span>
        <select
          value={maxMarksTotal}
          onChange={(e) => onFieldChange('maxMarksTotal', e.target.value)}
          className={fieldClass}
        >
          <option value="800">800 (legacy CUET total)</option>
          <option value="1000">1000 (updated scale)</option>
        </select>
        <span className="text-xs font-normal text-slate-500">
          Cutoffs are compared using percentages, so e.g. 780/800 and 975/1000 can rank fairly together.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">

      <label className="space-y-2 text-sm font-medium text-slate-700">
          Stream (optional)
          <select
            value={stream}
            onChange={(e) => onStreamChange(e.target.value)}
            className={fieldClass}
          >
            <option value="">Any stream</option>
            {STREAM_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>


        <div className="space-y-2 text-sm font-medium text-slate-700" ref={dropdownRef}>
          <span>Course</span>
          <CourseDropdown
            courses={filteredCourses}
            query={courseQuery}
            open={dropdownOpen}
            selectedCourse={selectedCourse}
            onSearch={(value) => {
              onFieldChange('courseQuery', value);
              setDropdownOpen(true);
            }}
            onSelect={(course) => {
              if (course === null) {
                setDropdownOpen((prev) => !prev);
                return;
              }
              onCourseSelect(course);
              setDropdownOpen(false);
            }}
            onOpen={() => setDropdownOpen(true)}
            onClose={() => setDropdownOpen(false)}
            loading={isLoadingCourses}
          />
        </div>

      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          disabled={isPredicting || isLoadingCourses}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9f3562] to-[#b14270] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPredicting ? 'Checking fit...' : 'Predict college fit'}
          <HiOutlineArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={retryCourses}
          className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh courses
        </button>
      </div>

      {formError && <p className="text-sm text-rose-600">{formError}</p>}
    </motion.form>
  );
};


const ResultsPanel = ({ results, loading }) => {
  const [openSections, setOpenSections] = useState({
    safe: true,
    target: false,
    dream: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Working</p>
            <p role="status" className="text-2xl font-semibold text-slate-900">
              Finding your best-fit colleges
            </p>
          </div>
          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">Loading</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xl font-semibold text-slate-900">Results will appear here</p>
        <p className="mt-2 text-sm text-slate-500">Submit the form above to see a concise college recommendation breakdown.</p>
      </div>
    );
  }

  const safeResults = {
    safe: Array.isArray(results.safe) ? results.safe : [],
    target: Array.isArray(results.target) ? results.target : [],
    dream: Array.isArray(results.dream) ? results.dream : [],
  };

  const totalCount = safeResults.safe.length + safeResults.target.length + safeResults.dream.length;
  const summaryPct = results?.studentPercentage;
  const summaryMax = results?.maxMarks;
  const usedDefaultMax = results?.maxMarksWasDefaulted;

  return (
    <div className="space-y-5">
      {Number.isFinite(Number(summaryPct)) && Number(summaryMax) > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Your normalized performance:</span>{' '}
          {Number(summaryPct).toFixed(2)}% of {summaryMax} total marks.
          {usedDefaultMax ? (
            <span className="block mt-1 text-xs text-slate-500">
              Total marks defaulted to 800; change the form if you sat the 1000-mark scale.
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-4">
        <ResultGroup
          title="Safe"
          tone="safe"
          description="High admission probability"
          colleges={safeResults.safe}
          icon={ShieldCheck}
          isOpen={openSections.safe}
          onToggle={() => toggleSection('safe')}
        />
        <ResultGroup
          title="Target"
          tone="target"
          description="Competitive but realistic"
          colleges={safeResults.target}
          icon={Target}
          isOpen={openSections.target}
          onToggle={() => toggleSection('target')}
        />
        <ResultGroup
          title="Dream"
          tone="dream"
          description="Aspirational reach colleges"
          colleges={safeResults.dream}
          icon={Rocket}
          isOpen={openSections.dream}
          onToggle={() => toggleSection('dream')}
        />
      </div>
      {totalCount === 0 && (
        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white p-6 text-sm text-slate-500">
          No matching results found for this profile.
        </div>
      )}
    </div>
  );
};

const CuetCalculatorFaqSection = () => (
  <section
    id="cuet-predictor-faq"
    className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
    aria-labelledby="cuet-faq-heading"
  >
    <h2 id="cuet-faq-heading" className="text-xl font-semibold text-slate-900 sm:text-2xl">
      CUET college predictor — frequently asked questions
    </h2>
    <p className="mt-2 max-w-3xl text-sm text-slate-600">
      Quick answers for students searching CUET cutoff predictors, DU admission chances, and how safe, target, and dream
      colleges are decided.
    </p>
    <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-slate-50/80">
      {CUET_FAQ_ITEMS.map((item) => (
        <details key={item.question} className="group px-4 py-3 sm:px-5">
          <summary className="cursor-pointer list-none pr-8 text-sm font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              <span>{item.question}</span>
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
);

const CuetCalculatorGuideSection = () => (
  <section
    className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm [content-visibility:auto]"
    aria-labelledby="cuet-guide-heading"
  >

      <div>
        <h3 className="text-base font-semibold text-slate-900">Explore Admeasy next</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>
            <Link to="/colleges" className="font-medium text-[#9f3562] underline-offset-2 hover:underline">
              DU &amp; India colleges directory
            </Link>{' '}
            — open a college, then browse linked{' '}
            <span className="text-slate-800">course detail pages</span> for deeper context.
          </li>
          <li>
            <Link to="/mentors" className="font-medium text-[#9f3562] underline-offset-2 hover:underline">
              Verified admission mentors
            </Link>{' '}
            for stream-specific CUET and DU counselling (Commerce, Science, Arts).
          </li>
          <li>
            <Link to="/" className="font-medium text-[#9f3562] underline-offset-2 hover:underline">
              Feed &amp; Posts
            </Link>{' '}
            on strategy, timelines, and cutoffs.
          </li>
          <li>
            <Link to="/policies" className="font-medium text-[#9f3562] underline-offset-2 hover:underline">
              Privacy policy
            </Link>{' '}
            for how predictor inputs are used.
          </li>
        </ul>
      </div>
  </section>
);

const CuetProgrammaticRoutesTeaser = () => (
  <section
    className="rounded-[2rem] border border-dashed border-gray-200 bg-slate-50/90 p-6 shadow-sm"
    aria-labelledby="cuet-programmatic-heading"
  >
    <h2 id="cuet-programmatic-heading" className="text-lg font-semibold text-slate-900">
      Programmatic CUET landing pages (roadmap)
    </h2>
    <p className="mt-2 text-sm text-slate-600">
      URL patterns reserved for future SEO pages — implement routes in <code className="rounded bg-white px-1 py-0.5 text-xs">App.jsx</code> using{' '}
      <code className="rounded bg-white px-1 py-0.5 text-xs">buildCuetProgrammaticPath()</code> from{' '}
      <code className="rounded bg-white px-1 py-0.5 text-xs">src/seo/cuetCalculatorPage.seo.js</code>.
    </p>
    <ul className="mt-4 space-y-2 font-mono text-xs text-slate-700 sm:text-sm">
      {CUET_PROGRAMMATIC_ROUTE_EXAMPLES.map((ex) => (
        <li key={ex.slug}>
          <span className="text-slate-500">{buildCuetProgrammaticPath(ex.slug)}</span>
          <span className="ml-2 text-slate-400">— {ex.label}</span>
        </li>
      ))}
    </ul>
  </section>
);

const CuetCalculatorPage = () => {
  const navigate = useNavigate();
  const swiperPrevRef = useRef(null);
  const swiperNextRef = useRef(null);
  const [score, setScore] = useState('720');
  const [maxMarksTotal, setMaxMarksTotal] = useState('800');
  const [category, setCategory] = useState('GENERAL');
  const [stream, setStream] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseQuery, setCourseQuery] = useState('');
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [loadCoursesError, setLoadCoursesError] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [results, setResults] = useState(null);
  const [formError, setFormError] = useState('');
  const [mentors, setMentors] = useState([]);
  const [isMentorsLoading, setIsMentorsLoading] = useState(true);
  // Debounce and abort refs for course fetching
  const coursesAbortRef = useRef(null);
  const fetchTimerRef = useRef(null);

  const fetchCourses = async (search = '') => {
    setIsCoursesLoading(true);
    setLoadCoursesError('');
    // cancel previous
    try {
      if (coursesAbortRef.current) {
        try { coursesAbortRef.current.abort(); } catch (e) {}
      }
      const controller = new AbortController();
      coursesAbortRef.current = controller;

      const params = {};
      if (stream) params.stream = stream;

      const response = await axios.get('/api/cuet/courses', {
        params,
        signal: controller.signal,
      });

      const payload = response.data;
      const rawCourses = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.courses)
        ? payload.courses
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      const normalized = rawCourses
        .map(normalizeCourse)
        .filter(Boolean)
        .filter((course) => course.name)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      setCourses(normalized);
      if (!normalized.length) {
        setLoadCoursesError('No course data is available right now.');
      }
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        // request was cancelled, ignore
      } else {
        console.error('Course fetch error:', error);
        setLoadCoursesError('Unable to load course list. Please refresh to retry.');
      }
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const fetchMentors = async () => {
    setIsMentorsLoading(true);
    try {
      const response = await axios.get('/api/mentors');
      const payload = response.data;
      const mentorList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.mentors)
        ? payload.mentors
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setMentors(mentorList);
    } catch (error) {
      console.error('Mentor fetch error:', error);
      setMentors([]);
    } finally {
      setIsMentorsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [stream]);

  useEffect(() => {
    fetchMentors();
  }, []);

  const handlePredict = async (event) => {
    event.preventDefault();
    setFormError('');

    const numericScore = Number(score);
    const cap = Number(maxMarksTotal);
    if (!selectedCourse?.value) {
      setFormError('Please choose a course from the list.');
      return;
    }
    if (!Number.isFinite(numericScore) || numericScore < 0 || !Number.isFinite(cap) || cap <= 0 || numericScore > cap) {
      setFormError(`Enter a valid CUET score between 0 and ${Number.isFinite(cap) && cap > 0 ? cap : 800} for the selected total marks.`);
      return;
    }

    setIsPredicting(true);
    setResults(null);

    try {
      const response = await axios.post('/api/cuet/predict', {
        score: numericScore,
        maxMarks: cap,
        category,
        course: selectedCourse.value,
        ...(stream ? { stream } : {}),
      });

      const payload = response.data;
      if (!payload?.success || !payload?.recommendations) {
        throw new Error('Unexpected response from server.');
      }

      setResults({
        studentPercentage: payload.filters?.studentPercentage,
        maxMarks: payload.filters?.maxMarks,
        maxMarksWasDefaulted: payload.filters?.maxMarksWasDefaulted,
        safe: Array.isArray(payload.recommendations.safe) ? payload.recommendations.safe : [],
        target: Array.isArray(payload.recommendations.target) ? payload.recommendations.target : [],
        dream: Array.isArray(payload.recommendations.dream) ? payload.recommendations.dream : [],
      });

      // Smooth-scroll to the results section so the user sees the recommendations
      setTimeout(() => {
        try {
          const el = document.getElementById('cuet-results-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {}
      }, 80);
    } catch (error) {
      console.error('Prediction error:', error);
      setFormError(
        error?.response?.data?.message ||
          'Prediction service is unavailable. Please try again in a moment.',
      );
      // Scroll to results area to surface the error message
      setTimeout(() => {
        try {
          const el = document.getElementById('cuet-results-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {}
      }, 80);
    } finally {
      setIsPredicting(false);
    }
  };

  const filteredCourses = useMemo(() => courses, [courses]);

  const mentorHeading = useMemo(() => {
    if (selectedCourse?.label && stream) {
      return `Top ${safeText(stream, 'mentors')} mentors for ${safeText(selectedCourse.label, 'your course')}`;
    }
    if (selectedCourse?.label) {
      return `Mentors experienced in ${safeText(selectedCourse.label, 'your course')}`;
    }
    if (stream) {
      return `Best ${safeText(stream, 'mentors')} mentors for CUET & DU admissions`;
    }
    return `Top DU admission mentors ready to help`;
  }, [selectedCourse, stream]);

  const mentorSubtitle = useMemo(() => {
    if (selectedCourse?.label) {
      return `Connect with mentors who guide students through ${safeText(selectedCourse.label)} admissions. Get personalized guidance from experts.`;
    }
    if (stream) {
      return `Find experienced mentors familiar with ${safeText(stream)} stream DU admissions process.`;
    }
    return `Browse trusted mentors who've helped 1000+ students secure their dream colleges.`;
  }, [selectedCourse, stream]);

  const recommendedMentors = useMemo(() => {
    const mentorPool = Array.isArray(mentors) && mentors.length ? mentors : FALLBACK_MENTORS;
    
    // Apply intelligent filtering if course or stream is selected
    if (selectedCourse?.label || stream) {
      const filtered = filterMentorsByContext(mentorPool, selectedCourse, stream);
      return filtered.length > 0 ? filtered : mentorPool.slice(0, 6);
    }
    
    // Otherwise return shuffled mentors
    return mentorPool.slice(0, 6);
  }, [mentors, selectedCourse, stream]);

  return (
    <>
      <SEO
        title={CUET_CALCULATOR_PAGE_TITLE}
        description={CUET_CALCULATOR_META_DESCRIPTION}
        keywords={CUET_CALCULATOR_KEYWORDS}
        image={CUET_CALCULATOR_OG_IMAGE}
        canonicalUrl={CUET_CALCULATOR_CANONICAL_URL}
        jsonLd={buildCuetCalculatorJsonLd()}
        type="website"
      />
      <div className="min-h-screen bg-gray-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-transparent bg-white/60 p-5 sm:p-6 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-pink-50/60 px-3 py-1 text-xs font-semibold text-[#9f3562]">
                DU-focused CUET predictor
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-slate-900 leading-tight sm:text-3xl">
              Predict your best-fit DU colleges
            </h1>

            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Estimate safe, target, and dream colleges using previous year CUET cutoff trends.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Updated CUET data
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                <HiLightBulb className="h-4 w-4 text-amber-600" />
                Smart normalization
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                DU-focused insights
              </div>
            </div>
          </div>
        </header>

        <main id="cuet-calculator-main" className="mt-6 space-y-6">
          <section
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
            aria-labelledby="cuet-form-heading"
          >
            <h2 id="cuet-form-heading" className="text-lg font-semibold text-slate-900">
              CUET score calculator &amp; college planner
            </h2>
            <div className="mt-5">
            <PredictionForm
              score={score}
              maxMarksTotal={maxMarksTotal}
              category={category}
              stream={stream}
              selectedCourse={selectedCourse}
              courseQuery={courseQuery}
              filteredCourses={filteredCourses}
              isLoadingCourses={isCoursesLoading}
              isPredicting={isPredicting}
              formError={formError}
              onFieldChange={(field, value) => {
                if (field === 'score') setScore(value);
                if (field === 'maxMarksTotal') setMaxMarksTotal(value);
                if (field === 'courseQuery') {
                  setCourseQuery(value);
                  if (!value.trim()) {
                    setSelectedCourse(null);
                  } else if (selectedCourse && normalize(selectedCourse.name) !== normalize(value)) {
                    setSelectedCourse(null);
                  }
                }
              }}
              onCategoryChange={setCategory}
              onStreamChange={(nextStream) => {
                setStream(nextStream);
                setSelectedCourse(null);
                setCourseQuery('');
              }}
              onCourseSelect={(course) => {
                setSelectedCourse(course);
                setCourseQuery(course.name);
              }}
              onSubmit={handlePredict}
              retryCourses={fetchCourses}
            />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              By using this tool, you agree to our{' '}
              <Link to="/policies" className="font-semibold text-[#9f3562] underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

              {/* College result */}
          <section id="cuet-results-section" className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="cuet-results-heading">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="cuet-results-heading" className="text-xl font-semibold text-slate-900">
                  College prediction results
                </h2>
              </div>
            </div>
            <ResultsPanel results={results} loading={isPredicting} />
          </section>

          
          {/* Student discussion section (anonymous, mobile-optimized) */}
          <CuetDiscussionSection
            selectedCourse={selectedCourse}
            stream={stream}
            category={category}
            score={score}
          />


          {/* Mentors carousel placed above results for better flow */}
          <section
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm [content-visibility:auto]"
            aria-labelledby="cuet-mentors-heading"
          >
            <div className="mb-6">
              <h2 id="cuet-mentors-heading" className="text-2xl font-semibold text-slate-900">{mentorHeading}</h2>
              <p className="mt-2 text-sm text-slate-500">{mentorSubtitle}</p>
              <p className="mt-2 text-[12px] text-slate-500">
                Prefer human guidance after this <span className="font-medium text-slate-700">CUET cutoff predictor</span>?{' '}
                <Link to="/mentors" className="font-semibold text-[#9f3562] underline">
                  Browse all mentors
                </Link>
                .
              </p>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-16 hidden lg:block">
                <button
                  ref={swiperPrevRef}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                  aria-label="Previous mentor"
                >
                  <HiOutlineChevronLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-16 hidden lg:block">
                <button
                  ref={swiperNextRef}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                  aria-label="Next mentor"
                >
                  <HiOutlineChevronRight className="h-5 w-5" />
                </button>
              </div>

              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                navigation={{
                  prevEl: swiperPrevRef.current,
                  nextEl: swiperNextRef.current,
                }}
                onBeforeInit={(swiper) => {
                  swiper.params.navigation.prevEl = swiperPrevRef.current;
                  swiper.params.navigation.nextEl = swiperNextRef.current;
                }}
                pagination={{ clickable: true, dynamicBullets: true }}
                loop={false}
                className="mentor-swiper"
                breakpoints={{
                  0: { slidesPerView: 1.1, spaceBetween: 12 },
                  640: { slidesPerView: 1.5, spaceBetween: 14 },
                  768: { slidesPerView: 2.2, spaceBetween: 16 },
                  1024: { slidesPerView: 3.2, spaceBetween: 18 },
                  1280: { slidesPerView: 4, spaceBetween: 20 },
                }}
              >
                {isMentorsLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <SwiperSlide key={index}>
                        <MentorPlaceholderCard />
                      </SwiperSlide>
                    ))
                  : Array.isArray(recommendedMentors) && recommendedMentors.length > 0
                  ? recommendedMentors.map((mentorItem, index) => (
                      <SwiperSlide key={safeText(mentorItem?._id || mentorItem?.username, `mentor-${index}`)}>
                        <MentorCard
                          mentor={mentorItem}
                          onConnect={() => {
                            const username = safeText(mentorItem?.username, '');
                            if (username) {
                              navigate(`/${username}`);
                            }
                          }}
                        />
                      </SwiperSlide>
                    ))
                  : (
                      <SwiperSlide>
                        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-slate-50 p-8 text-center">
                          <p className="text-sm text-slate-500">No mentor recommendations available right now.</p>
                        </div>
                      </SwiperSlide>
                    )}
              </Swiper>
            </div>
          </section>

          <CuetCalculatorGuideSection />

          {/* How it works (FAQ Section) */}
          <CuetCalculatorFaqSection />

          {/* <CuetProgrammaticRoutesTeaser /> */}
        </main>
      </div>
    </div>
    </>
  );
};

export default CuetCalculatorPage;
