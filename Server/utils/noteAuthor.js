const Mentor = require("../models/mentorSchema");
const UserModel = require("../models/userSchema");

function toPlain(note) {
  if (!note) return null;
  return note.toObject ? note.toObject() : { ...note };
}

/**
 * Attach { author } to each note for public API responses.
 * Resolves Mentor (Admeasy) and User (Users DB) separately — ref populate does not work cross-connection.
 */
async function attachAuthorsToNotes(notes) {
  if (!notes?.length) return [];

  const plain = notes.map(toPlain).filter(Boolean);

  const mentorIdSet = new Set();
  const userIdSet = new Set();

  for (const o of plain) {
    const raw = o.uploader;
    if (!raw) continue;
    const idStr = raw._id ? raw._id.toString() : raw.toString();
    if (o.uploaderModel === "Mentor") mentorIdSet.add(idStr);
    else userIdSet.add(idStr);
  }

  const [mentors, users] = await Promise.all([
    mentorIdSet.size
      ? Mentor.find({ _id: { $in: [...mentorIdSet] } })
          .select("name username image")
          .lean()
      : [],
    userIdSet.size
      ? UserModel.find({ _id: { $in: [...userIdSet] } })
          .select("name username image")
          .lean()
      : [],
  ]);

  const mentorMap = new Map(mentors.map((m) => [m._id.toString(), m]));
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return plain.map((o) => {
    const raw = o.uploader;
    const idStr = raw?._id ? raw._id.toString() : raw?.toString();
    let author = null;
    if (o.uploaderModel === "Mentor" && idStr) {
      const m = mentorMap.get(idStr);
      if (m) {
        author = {
          _id: m._id,
          name: m.name,
          username: m.username || null,
          image: m.image || null,
          role: "mentor",
        };
      }
    } else if (idStr) {
      const u = userMap.get(idStr);
      if (u) {
        author = {
          _id: u._id,
          name: u.name,
          username: u.username || null,
          image: u.image || null,
          role: "user",
        };
      }
    }
    return { ...o, author };
  });
}

async function attachAuthorToNote(note) {
  const [one] = await attachAuthorsToNotes(note ? [note] : []);
  return one;
}

module.exports = { attachAuthorsToNotes, attachAuthorToNote };
