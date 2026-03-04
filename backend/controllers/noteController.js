// controllers/noteController.js
// All content is sanitised with DOMPurify (server-side via jsdom) before storage.
// This prevents stored-XSS attacks even if a malicious client bypasses the frontend.

const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const Note = require("../models/Note");
const User = require("../models/User");

// ── Server-side DOMPurify instance ────────────────────────────────────────────
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p","br","b","i","u","s","strong","em","ul","ol","li",
      "blockquote","pre","code","h1","h2","h3","h4","h5","h6",
      "a","span","div","img","table","thead","tbody","tr","th","td",
    ],
    ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
    ALLOW_DATA_ATTR: false,
  });

// ── GET /api/notes ────────────────────────────────────────────────────────────
exports.getNotes = async (req, res, next) => {
  try {
    const notes = await Note.findAccessible(req.user._id);
    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notes/search?q=keyword ──────────────────────────────────────────
exports.searchNotes = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Query param 'q' is required" });
    }

    const notes = await Note.find({
      // Full-text search
      $text: { $search: q.trim() },
      // Scope to notes the user can access
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
      isArchived: false,
    })
      .select({ score: { $meta: "textScore" } })         // attach relevance score
      .sort({ score: { $meta: "textScore" } })            // rank by relevance
      .populate("owner", "name email avatar")
      .populate("collaborators", "name email avatar");

    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notes/:id ────────────────────────────────────────────────────────
exports.getNote = async (req, res) => {
  // req.note already populated by requireAccess middleware
  res.json({ success: true, note: req.note });
};

// ── POST /api/notes ───────────────────────────────────────────────────────────
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, color } = req.body;
    const note = await Note.create({
      title: title || "Untitled Note",
      content: sanitize(content || ""),
      color: color || "#ffffff",
      owner: req.user._id,
    });

    const populated = await note.populate("owner", "name email avatar");
    res.status(201).json({ success: true, note: populated });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/notes/:id ────────────────────────────────────────────────────────
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content, color } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = sanitize(content);
    if (color !== undefined) updates.color = color;

    const note = await Note.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "name email avatar")
      .populate("collaborators", "name email avatar");

    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notes/:id ─────────────────────────────────────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notes/:id/collaborators ─────────────────────────────────────────
exports.addCollaborator = async (req, res, next) => {
  try {
    const { email } = req.body;
    const note = req.note; // attached by requireOwner

    // Resolve email → user
    const collaborator = await User.findOne({ email });
    if (!collaborator) {
      return res
        .status(404)
        .json({ success: false, message: "No user found with that email" });
    }

    // Prevent adding self
    if (collaborator._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Owner cannot add themselves as collaborator" });
    }

    // Prevent duplicates
    const alreadyAdded = note.collaborators.some(
      (c) => c._id.toString() === collaborator._id.toString()
    );
    if (alreadyAdded) {
      return res
        .status(409)
        .json({ success: false, message: "User is already a collaborator" });
    }

    note.collaborators.push(collaborator._id);
    await note.save();

    const updated = await Note.findById(note._id)
      .populate("owner", "name email avatar")
      .populate("collaborators", "name email avatar");

    res.json({ success: true, note: updated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notes/:id/collaborators/:userId ───────────────────────────────
exports.removeCollaborator = async (req, res, next) => {
  try {
    const note = req.note; // attached by requireOwner
    const { userId } = req.params;

    note.collaborators = note.collaborators.filter(
      (c) => c._id.toString() !== userId
    );
    await note.save();

    const updated = await Note.findById(note._id)
      .populate("owner", "name email avatar")
      .populate("collaborators", "name email avatar");

    res.json({ success: true, note: updated });
  } catch (err) {
    next(err);
  }
};
