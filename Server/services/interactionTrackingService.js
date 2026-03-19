const MasterTag = require('../models/masterTagSchema');
const StudentEvent = require('../models/studentEventSchema');
const UserProfile = require('../models/userProfileSchema');
const User = require('../models/userSchema');

const MASTER_TAG_SEED = [
  { tag: 'cuet', category: 'exam', aliases: ['common university entrance test'], priority: 'high' },
  { tag: 'cuet2026', category: 'exam', aliases: ['cuet 2026'], priority: 'high' },
  { tag: 'jee', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'jee mains', category: 'exam', aliases: ['jee main'], priority: 'high' },
  { tag: 'jee advanced', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'neet', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'neet ug', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'ipmat', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'clat', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'cat', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'upsc', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'nda', category: 'exam', aliases: [], priority: 'medium' },
  { tag: 'ntse', category: 'exam', aliases: [], priority: 'medium' },
  { tag: 'olympiad', category: 'exam', aliases: [], priority: 'medium' },
  { tag: 'boards', category: 'exam', aliases: ['board exams'], priority: 'high' },
  { tag: 'cbse boards', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'icse boards', category: 'exam', aliases: [], priority: 'high' },
  { tag: 'iit', category: 'university', aliases: ['indian institute of technology'], priority: 'high' },
  { tag: 'nit', category: 'university', aliases: [], priority: 'high' },
  { tag: 'iiit', category: 'university', aliases: [], priority: 'medium' },
  { tag: 'delhi university', category: 'university', aliases: ['du'], priority: 'high' },
  { tag: 'hindu college', category: 'university', aliases: [], priority: 'medium' },
  { tag: 'srcc', category: 'university', aliases: [], priority: 'high' },
  { tag: 'hansraj', category: 'university', aliases: ['hansraj college'], priority: 'medium' },
  { tag: 'st stephens', category: 'university', aliases: ['st stephens college'], priority: 'medium' },
  { tag: 'miranda house', category: 'university', aliases: [], priority: 'medium' },
  { tag: 'lsr', category: 'university', aliases: ['lady shri ram college'], priority: 'medium' },
  { tag: 'ramjas', category: 'university', aliases: ['ramjas college'], priority: 'medium' },
  { tag: 'venky', category: 'university', aliases: ['venkateswara college'], priority: 'low' },
  { tag: 'davv', category: 'university', aliases: ['devi ahilya vishwavidyalaya'], priority: 'low' },
  { tag: 'lucknow university', category: 'university', aliases: [], priority: 'low' },
  { tag: 'mumbai university', category: 'university', aliases: [], priority: 'low' },
  { tag: 'pune university', category: 'university', aliases: [], priority: 'low' },
  { tag: 'science', category: 'stream', aliases: [], priority: 'high' },
  { tag: 'commerce', category: 'stream', aliases: [], priority: 'high' },
  { tag: 'arts', category: 'stream', aliases: [], priority: 'high' },
  { tag: 'humanities', category: 'stream', aliases: [], priority: 'high' },
  { tag: 'class 9', category: 'class', aliases: ['ninth'], priority: 'medium' },
  { tag: 'class 10', category: 'class', aliases: ['tenth'], priority: 'medium' },
  { tag: 'class 11', category: 'class', aliases: ['eleventh'], priority: 'medium' },
  { tag: 'class 12', category: 'class', aliases: ['twelfth'], priority: 'high' },
  { tag: 'physics', category: 'subject', aliases: [], priority: 'high' },
  { tag: 'chemistry', category: 'subject', aliases: [], priority: 'high' },
  { tag: 'maths', category: 'subject', aliases: ['mathematics'], priority: 'high' },
  { tag: 'biology', category: 'subject', aliases: [], priority: 'high' },
  { tag: 'english', category: 'subject', aliases: [], priority: 'medium' },
  { tag: 'economics', category: 'subject', aliases: [], priority: 'medium' },
  { tag: 'accounts', category: 'subject', aliases: ['accountancy'], priority: 'medium' },
  { tag: 'business studies', category: 'subject', aliases: [], priority: 'medium' },
  { tag: 'history', category: 'subject', aliases: [], priority: 'low' },
  { tag: 'political science', category: 'subject', aliases: ['polity'], priority: 'low' },
  { tag: 'engineering', category: 'career', aliases: [], priority: 'high' },
  { tag: 'doctor', category: 'career', aliases: ['medical'], priority: 'high' },
  { tag: 'mba', category: 'career', aliases: [], priority: 'high' },
  { tag: 'law', category: 'career', aliases: [], priority: 'high' },
  { tag: 'startup', category: 'career', aliases: ['startups'], priority: 'medium' },
  { tag: 'entrepreneur', category: 'career', aliases: ['entrepreneurship'], priority: 'medium' },
  { tag: 'ca', category: 'career', aliases: [], priority: 'medium' },
  { tag: 'cs', category: 'career', aliases: [], priority: 'medium' },
  { tag: 'finance', category: 'career', aliases: [], priority: 'medium' },
  { tag: 'consulting', category: 'career', aliases: [], priority: 'low' },
  { tag: 'coding', category: 'skill', aliases: ['programming'], priority: 'high' },
  { tag: 'javascript', category: 'skill', aliases: [], priority: 'medium' },
  { tag: 'python', category: 'skill', aliases: [], priority: 'medium' },
  { tag: 'ai', category: 'skill', aliases: ['artificial intelligence'], priority: 'high' },
  { tag: 'machine learning', category: 'skill', aliases: ['ml'], priority: 'high' },
  { tag: 'data science', category: 'skill', aliases: [], priority: 'medium' },
  { tag: 'trading', category: 'skill', aliases: [], priority: 'low' },
  { tag: 'investing', category: 'skill', aliases: [], priority: 'low' },
  { tag: 'public speaking', category: 'skill', aliases: [], priority: 'low' },
  { tag: 'communication', category: 'skill', aliases: [], priority: 'low' },
  { tag: 'freelancing', category: 'community', aliases: [], priority: 'low' },
  { tag: 'tech', category: 'community', aliases: [], priority: 'medium' },
  { tag: 'design', category: 'community', aliases: [], priority: 'low' },
  { tag: 'product management', category: 'community', aliases: ['pm'], priority: 'low' },
  { tag: 'nvidia', category: 'brand', aliases: [], priority: 'low' },
  { tag: 'google', category: 'brand', aliases: [], priority: 'medium' },
  { tag: 'microsoft', category: 'brand', aliases: [], priority: 'medium' },
  { tag: 'apple', category: 'brand', aliases: [], priority: 'low' },
  { tag: 'physics wallah', category: 'brand', aliases: ['pw'], priority: 'high' },
  { tag: 'unacademy', category: 'brand', aliases: [], priority: 'medium' },
  { tag: 'byjus', category: 'brand', aliases: [], priority: 'medium' },
  { tag: 'cutoff', category: 'keyword', aliases: [], priority: 'medium' },
  { tag: 'syllabus', category: 'keyword', aliases: [], priority: 'high' },
  { tag: 'preparation', category: 'keyword', aliases: [], priority: 'high' },
  { tag: 'strategy', category: 'keyword', aliases: [], priority: 'medium' },
  { tag: 'mock test', category: 'keyword', aliases: ['mock tests'], priority: 'medium' },
  { tag: 'revision', category: 'keyword', aliases: [], priority: 'medium' },
  { tag: 'notes', category: 'keyword', aliases: [], priority: 'high' },
  { tag: 'doubt', category: 'keyword', aliases: ['doubts'], priority: 'high' },
  { tag: 'exam pattern', category: 'keyword', aliases: [], priority: 'medium' },
  { tag: 'admission', category: 'keyword', aliases: [], priority: 'high' },
  { tag: 'college life', category: 'keyword', aliases: [], priority: 'low' },
];

let cacheReady = false;
let canonicalMap = new Map();
let categoryMap = new Map();

function normalizeTag(input) {
  if (!input) return '';
  return String(input).toLowerCase().trim().replace(/\s+/g, ' ');
}

function uniqueNormalized(values = []) {
  return [...new Set(values.map(normalizeTag).filter(Boolean))];
}

function tokenizeContent(text = '') {
  return uniqueNormalized(
    String(text)
      .replace(/[#@]/g, ' ')
      .split(/[^a-zA-Z0-9+]+/g)
      .filter((token) => token && token.length >= 3)
  );
}

function chunkToNgrams(tokens = [], max = 3) {
  const out = [];
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j <= Math.min(tokens.length, i + max); j += 1) {
      out.push(tokens.slice(i, j).join(' '));
    }
  }
  return out;
}

async function ensureMasterTagsSeeded() {
  if (cacheReady) return;
  const ops = MASTER_TAG_SEED.map((item) => ({
    updateOne: {
      filter: { tag: normalizeTag(item.tag) },
      update: {
        $set: {
          tag: normalizeTag(item.tag),
          category: normalizeTag(item.category),
          aliases: uniqueNormalized(item.aliases || []),
          priority: item.priority || 'medium',
        },
      },
      upsert: true,
    },
  }));
  await MasterTag.bulkWrite(ops, { ordered: false });
  const rows = await MasterTag.find({}).lean();
  canonicalMap = new Map();
  categoryMap = new Map();
  for (const row of rows) {
    const canonical = normalizeTag(row.tag);
    canonicalMap.set(canonical, canonical);
    categoryMap.set(canonical, normalizeTag(row.category));
    for (const alias of row.aliases || []) {
      canonicalMap.set(normalizeTag(alias), canonical);
    }
  }
  cacheReady = true;
}

function mapToCanonical(rawTags = []) {
  const mapped = [];
  for (const raw of rawTags) {
    const normalized = normalizeTag(raw);
    if (!normalized) continue;
    mapped.push(canonicalMap.get(normalized) || normalized);
  }
  return uniqueNormalized(mapped);
}

function toCategoryTags(tags = []) {
  const out = {};
  for (const tag of tags) {
    const category = categoryMap.get(tag);
    if (!category) continue;
    if (!out[category]) out[category] = [];
    out[category].push(tag);
  }
  for (const key of Object.keys(out)) {
    out[key] = uniqueNormalized(out[key]);
  }
  return out;
}

function extractRawTagsFromContext({ post, note, space, metadata = {} }) {
  const tags = [];
  if (post) {
    tags.push(...(post.tags || []));
    tags.push(...(post.hashtags || []));
    tags.push(...tokenizeContent(post.content || ''));
  }
  if (note) {
    tags.push(...(note.tags ? String(note.tags).split(',') : []));
    tags.push(...(note.hashtags || []));
    tags.push(...tokenizeContent(`${note.title || ''} ${note.description || ''}`));
  }
  if (space) {
    tags.push(...tokenizeContent(`${space.name || ''} ${space.description || ''}`));
  }
  if (metadata.query) {
    tags.push(...tokenizeContent(metadata.query));
  }
  return uniqueNormalized(tags);
}

async function ensureBaseProfile(userId) {
  const existing = await UserProfile.findOne({ userId }).lean();
  if (existing) return;
  const user = await User.findById(userId).lean();
  if (!user) return;
  await UserProfile.create({
    userId,
    schoolId: user.schoolId || null,
    schoolName: user.schoolName || null,
    city: user.city || null,
    class: user.class || null,
    board: user.board || null,
    exams: uniqueNormalized(user.examsPreparingFor || []),
  });
}

async function recomputeProfile(userId) {
  await ensureBaseProfile(userId);
  const events = await StudentEvent.find({ userId }).sort({ timestamp: -1 }).lean();
  const tagCounts = new Map();
  const examInterests = new Set();
  const subjectInterests = new Set();
  const careerInterests = new Set();
  const likedPosts = new Set();
  const openedNotes = new Set();
  const followedMentors = new Set();
  const joinedSpaces = new Set();
  const searchHistory = [];

  for (const event of events) {
    for (const tag of event.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    const categories = event.categoryTags || {};
    for (const tag of categories.exam || []) examInterests.add(tag);
    for (const tag of categories.subject || []) subjectInterests.add(tag);
    for (const tag of categories.career || []) careerInterests.add(tag);
    if (event.eventType === 'post_like' && event.entityId) likedPosts.add(String(event.entityId));
    if (event.eventType === 'note_open' && event.entityId) openedNotes.add(String(event.entityId));
    if (event.eventType === 'follow_mentor' && event.entityId) followedMentors.add(String(event.entityId));
    if (event.eventType === 'space_join' && event.entityId) joinedSpaces.add(String(event.entityId));
    if (event.eventType === 'search_query' && event.metadata?.query) searchHistory.push(String(event.metadata.query));
  }

  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map((item) => item[0]);
  await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        topTags,
        examInterests: [...examInterests],
        subjectInterests: [...subjectInterests],
        careerInterests: [...careerInterests],
        likedPosts: [...likedPosts],
        openedNotes: [...openedNotes],
        followedMentors: [...followedMentors],
        joinedSpaces: [...joinedSpaces],
        searchHistory: searchHistory.slice(0, 100),
      },
    },
    { new: true, upsert: true }
  );
}

function buildDedupeBucket(windowSeconds = 0) {
  if (!windowSeconds || windowSeconds <= 0) return null;
  return Math.floor(Date.now() / (windowSeconds * 1000));
}

async function trackStudentEvent({
  userId,
  eventType,
  entityId = null,
  metadata = {},
  post = null,
  note = null,
  space = null,
  dedupeWindowSeconds = 0,
}) {
  if (!userId || !eventType) return null;
  await ensureMasterTagsSeeded();
  const raw = extractRawTagsFromContext({ post, note, space, metadata });
  const tags = mapToCanonical(raw);
  const categoryTags = toCategoryTags(tags);
  const dedupeWindowBucket = buildDedupeBucket(dedupeWindowSeconds);
  try {
    const event = await StudentEvent.create({
      userId,
      eventType: normalizeTag(eventType),
      entityId,
      tags,
      categoryTags,
      metadata,
      dedupeWindowBucket,
      timestamp: new Date(),
    });
    await recomputeProfile(userId);
    return event;
  } catch (error) {
    if (error && error.code === 11000) return null;
    throw error;
  }
}

module.exports = {
  ensureMasterTagsSeeded,
  normalizeTag,
  trackStudentEvent,
};
