// middleware/noteAuth.js
// Two-tier middleware:
//   requireAccess  — owner OR collaborator (read / write)
//   requireOwner   — owner only (delete, manage collaborators)
// Attaches the resolved note to req.note to avoid a second DB query.

const Note = require("../models/Note");

// ── Helper ────────────────────────────────────────────────────────────────────
const loadNote = async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate("owner", "name email avatar")
    .populate("collaborators", "name email avatar");

  if (!note) {
    res.status(404).json({ success: false, message: "Note not found" });
    return null;
  }
  return note;
};

// ── Middleware: owner or collaborator ─────────────────────────────────────────
const requireAccess = async (req, res, next) => {
  try {
    const note = await loadNote(req, res);
    if (!note) return;

    const userId = req.user._id.toString();
    const hasAccess =
      note.owner._id.toString() === userId ||
      note.collaborators.some((c) => c._id.toString() === userId);

    if (!hasAccess) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    req.note = note;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Middleware: owner only ────────────────────────────────────────────────────
const requireOwner = async (req, res, next) => {
  try {
    const note = await loadNote(req, res);
    if (!note) return;

    if (note.owner._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only the owner can perform this action" });
    }

    req.note = note;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAccess, requireOwner };
