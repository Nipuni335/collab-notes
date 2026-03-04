// routes/notes.js
// Route hierarchy:
//   GET    /api/notes            — all accessible notes
//   GET    /api/notes/search     — full-text search (must come before /:id)
//   POST   /api/notes            — create note
//   GET    /api/notes/:id        — get single note (owner or collaborator)
//   PUT    /api/notes/:id        — update note (owner or collaborator)
//   DELETE /api/notes/:id        — delete note (owner only)
//   POST   /api/notes/:id/collaborators           — add collaborator (owner only)
//   DELETE /api/notes/:id/collaborators/:userId   — remove collaborator (owner only)

const express = require("express");
const router = express.Router();
const {
  getNotes,
  searchNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  addCollaborator,
  removeCollaborator,
} = require("../controllers/noteController");
const { protect } = require("../middleware/auth");
const { requireAccess, requireOwner } = require("../middleware/noteAuth");
const {
  noteRules,
  collaboratorRules,
  validate,
} = require("../validators/authValidators");

// All note routes require authentication
router.use(protect);

router.route("/")
  .get(getNotes)
  .post(noteRules, validate, createNote);

// search BEFORE /:id so Express doesn't treat "search" as an ObjectId
router.get("/search", searchNotes);

router.route("/:id")
  .get(requireAccess, getNote)
  .put(requireAccess, noteRules, validate, updateNote)
  .delete(requireOwner, deleteNote);

router.route("/:id/collaborators")
  .post(requireOwner, collaboratorRules, validate, addCollaborator);

router.route("/:id/collaborators/:userId")
  .delete(requireOwner, removeCollaborator);

module.exports = router;
