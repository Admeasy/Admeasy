/** Profile image fallback (same pattern as posts) */
export const NOTE_AVATAR_FALLBACK =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

/**
 * Resolve uploader display from API note (`author` from server + legacy `uploaderName`).
 */
export function resolveNoteAuthor(note) {
  const a = note?.author;
  const displayName =
    (a?.name && String(a.name).trim()) ||
    (note?.uploaderName && String(note.uploaderName).trim()) ||
    "Member";
  const username = a?.username ? String(a.username).trim() : null;
  const image = (a?.image && String(a.image).trim()) || NOTE_AVATAR_FALLBACK;
  const profilePath = username ? `/${username}` : null;
  return { displayName, username, image, profilePath };
}
