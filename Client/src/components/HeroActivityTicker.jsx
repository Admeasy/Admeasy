import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildMessages(online, notes, { iitMentors, iimMentors, srccMentors, hinduMentor }) {
  const msgs = [];

  msgs.push(
    `${online} students online`,
    `${online} bros & didis online right now`,
    `${online} students vibing on Admeasy — drop a doubt?`,
    `Campus pulse: ${online} students online`
  );

  msgs.push(
    `${notes} new notes uploaded`,
    `${notes} fresh notes just landed — topper energy`,
    `${notes} note drops today. PDF gang rises`,
    `${notes} new uploads — bhai revision fix ho jayegi`
  );

  const iitLines =
    iitMentors > 0
      ? [
          `${iitMentors} mentors from IIT`,
          `${iitMentors} IIT bade bhaiya & didi — AIR energy`,
          `${iitMentors} IIT guru ji ready to decode concepts`,
        ]
      : ['IIT toppers & AIR holders — lineup loading ✨'];

  const iimLines =
    iimMentors > 0
      ? [
          `${iimMentors} bhaiya & didi from IIM`,
          `${iimMentors} IIM mentors — strategy + clarity`,
          `${iimMentors} IIM waale guiding through chaos`,
        ]
      : ['IIM mentors joining — watch this space'];

  const srccLines =
    srccMentors > 0
      ? [
          `${srccMentors} students from SRCC`,
          `${srccMentors} SRCC mentors — commerce kings & queens`,
          `${srccMentors} Shri Ram legends on deck`,
        ]
      : ['SRCC mentors on the way — stay put'];

  const hinduLines =
    hinduMentor > 0
      ? [
          `${hinduMentor} mentor${hinduMentor === 1 ? '' : 's'} from Hindu College, DU`,
          `${hinduMentor} Hindu College guru${hinduMentor === 1 ? '' : 's'} — DU vibes`,
          `${hinduMentor} Hindu College bhaiya & didi repping North Campus`,
        ]
      : ['Hindu College mentors — North Campus aura incoming'];

  msgs.push(...iitLines, ...iimLines, ...srccLines, ...hinduLines);
  shuffleInPlace(msgs);
  return msgs;
}

const EMPTY_MENTOR_STATS = {
  iitMentors: 0,
  iimMentors: 0,
  srccMentors: 0,
  hinduMentor: 0,
};

const HeroActivityTicker = ({ variant = 'hero' }) => {
  const rotateTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const onlineRef = useRef(randomInt(20, 30));
  const notesRef = useRef(randomInt(10, 15));
  const [mentorStats, setMentorStats] = useState(EMPTY_MENTOR_STATS);
  const [messages, setMessages] = useState(() =>
    buildMessages(onlineRef.current, notesRef.current, EMPTY_MENTOR_STATS)
  );
  const [index, setIndex] = useState(0);

  const refreshRandomSlots = useCallback(() => {
    onlineRef.current = randomInt(20, 30);
    notesRef.current = randomInt(10, 15);
  }, []);

  const fetchMentorStats = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/mentor-stats');
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      setMentorStats({
        iitMentors: Number(data.iitMentors) || 0,
        iimMentors: Number(data.iimMentors) || 0,
        srccMentors: Number(data.srccMentors) || 0,
        hinduMentor: Number(data.hinduMentor) || 0,
      });
    } catch {
      /* keep previous / zeros */
    }
  }, []);

  useEffect(() => {
    fetchMentorStats();
    const scheduleRefresh = () => {
      const delay = 30000 + Math.random() * 30000;
      refreshTimerRef.current = window.setTimeout(() => {
        refreshRandomSlots();
        fetchMentorStats();
        scheduleRefresh();
      }, delay);
    };
    scheduleRefresh();
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [fetchMentorStats, refreshRandomSlots]);

  useEffect(() => {
    setMessages(
      buildMessages(onlineRef.current, notesRef.current, mentorStats)
    );
    setIndex(0);
  }, [mentorStats]);

  useEffect(() => {
    if (messages.length === 0) return undefined;
    const schedule = () => {
      const ms = 3000 + Math.random() * 1000;
      rotateTimerRef.current = window.setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        schedule();
      }, ms);
    };
    /* restart rotation when messages change */
    if (rotateTimerRef.current) window.clearTimeout(rotateTimerRef.current);
    schedule();
    return () => {
      if (rotateTimerRef.current) window.clearTimeout(rotateTimerRef.current);
    };
  }, [messages]);

  const line = useMemo(
    () => (messages.length ? messages[index % messages.length] : ''),
    [messages, index]
  );

  const wrapClass =
    variant === 'hero'
      ? 'mt-3 sm:mt-4 w-full max-w-xl mx-auto px-2'
      : 'mb-6 w-full';

  const barClass =
    variant === 'hero'
      ? 'flex items-center gap-2 min-h-[2.5rem] px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white/95 text-xs sm:text-sm shadow-lg'
      : 'flex items-center gap-2 min-h-[2.5rem] px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-50/90 to-white border border-pink-100/80 text-gray-800 text-xs sm:text-sm shadow-sm';

  const iconClass = variant === 'hero' ? 'text-white/90 shrink-0' : 'text-[#9f3562] shrink-0';

  if (!line) return null;

  return (
    <div className={wrapClass} aria-live="polite">
      <div className={barClass}>
        <Sparkles className={`w-4 h-4 ${iconClass}`} aria-hidden />
        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="font-medium leading-snug truncate sm:whitespace-normal sm:overflow-visible"
            >
              {line}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HeroActivityTicker;
