const Payment = require('../models/paymentSchema');

/**
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {import('mongoose').Types.ObjectId|string} noteId
 */
async function hasCompletedNotePurchase(userId, noteId) {
  if (!userId || !noteId) return false;
  const p = await Payment.findOne({
    user: userId,
    note: noteId,
    status: 'completed',
    paymentType: 'note',
  })
    .select('_id')
    .lean();
  return !!p;
}

/**
 * Batch: which of `noteIds` has the user completed purchase for?
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {import('mongoose').Types.ObjectId[]} noteIds
 * @returns {Promise<Set<string>>}
 */
async function batchPurchasedNoteIds(userId, noteIds) {
  if (!userId || !noteIds?.length) return new Set();
  const rows = await Payment.find({
    user: userId,
    note: { $in: noteIds },
    status: 'completed',
    paymentType: 'note',
  })
    .select('note')
    .lean();
  return new Set(rows.map((r) => r.note.toString()));
}

/**
 * Paid note = explicitly not free (isFree === false).
 * @param {object} note
 */
function requiresPurchaseForNote(note) {
  return note.isFree === false;
}

/**
 * @param {object} note — lean or doc with uploader + uploaderModel
 * @param {import('express').Request} req
 */
function isViewerNoteUploader(note, req) {
  if (!note?.uploader) return false;
  const uid = note.uploader.toString();

  if (req.user && note.uploaderModel === 'User') {
    const viewerId = (req.user._id || req.user.id)?.toString?.();
    return viewerId && uid === viewerId;
  }
  if (req.mentor && note.uploaderModel === 'Mentor') {
    const mid = (req.mentor._id || req.mentor.id)?.toString?.();
    return mid && uid === mid;
  }
  return false;
}

/**
 * @param {object} note
 * @param {import('express').Request} req
 * @param {Set<string>|null} [purchasedIdSet] — optional batch set for list endpoint
 */
/**
 * Same as computeNoteAccess but synchronous when `purchasedIdSet` is provided (list endpoints).
 * When `purchasedIdSet` is null, uses async DB lookup (detail/pdf).
 */
async function computeNoteAccess(note, req, purchasedIdSet = null) {
  if (!requiresPurchaseForNote(note)) {
    return { hasAccess: true, requiresPurchase: false, isUploader: false };
  }

  const isUploader = isViewerNoteUploader(note, req);
  if (isUploader) {
    return { hasAccess: true, requiresPurchase: true, isUploader: true };
  }

  if (!req.user) {
    return { hasAccess: false, requiresPurchase: true, isUploader: false };
  }

  const userId = req.user._id || req.user.id;
  let purchased = false;
  if (purchasedIdSet) {
    purchased = purchasedIdSet.has(note._id.toString());
  } else {
    purchased = await hasCompletedNotePurchase(userId, note._id);
  }

  return {
    hasAccess: purchased,
    requiresPurchase: true,
    isUploader: false,
  };
}

/**
 * List/search batch path — `purchasedIdSet` must be a Set of note id strings (or empty).
 */
function computeNoteAccessSync(note, req, purchasedIdSet) {
  const set = purchasedIdSet || new Set();
  if (!requiresPurchaseForNote(note)) {
    return { hasAccess: true, requiresPurchase: false, isUploader: false };
  }
  if (isViewerNoteUploader(note, req)) {
    return { hasAccess: true, requiresPurchase: true, isUploader: true };
  }
  if (!req.user) {
    return { hasAccess: false, requiresPurchase: true, isUploader: false };
  }
  const purchased = set.has(note._id.toString());
  return { hasAccess: purchased, requiresPurchase: true, isUploader: false };
}

/**
 * Strip sensitive fields for unpaid viewers; add flags.
 * @param {object} note — plain object
 * @param {{ hasAccess: boolean, requiresPurchase: boolean }} access
 */
function sanitizeNoteForClient(note, access) {
  const out = { ...note };
  out.hasAccess = access.hasAccess;
  out.requiresPurchase = access.requiresPurchase;
  if (access.requiresPurchase && !access.hasAccess) {
    delete out.fileUrl;
    delete out.cloudinaryPublicId;
  }
  return out;
}

module.exports = {
  hasCompletedNotePurchase,
  batchPurchasedNoteIds,
  requiresPurchaseForNote,
  isViewerNoteUploader,
  computeNoteAccess,
  computeNoteAccessSync,
  sanitizeNoteForClient,
};
