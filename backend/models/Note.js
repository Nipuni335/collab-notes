// models/Note.js
// Text index on title + content enables MongoDB full-text search ($text / $meta).
// Collaborators stored as User ObjectId refs — resolved on demand via .populate().
// Rich text content stored as HTML string (sanitised before write, before render).

const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      default: "Untitled Note",
    },
    content: {
      type: String,
      default: "",
      // HTML from React Quill; sanitised by the controller before storage
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Convenience flag — soft delete without cascading
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Optional colour tag for dashboard UI
    color: {
      type: String,
      default: "#ffffff",
      match: [/^#[0-9A-Fa-f]{6}$/, "Invalid hex colour"],
    },
  },
  { timestamps: true }
);

// ── Compound text index for full-text search ──────────────────────────────────
// Weights bias title matches higher than content matches.
noteSchema.index(
  { title: "text", content: "text" },
  { weights: { title: 10, content: 3 }, name: "NoteTextIndex" }
);

// ── Virtual: combined list of users who can access this note ──────────────────
noteSchema.virtual("accessList").get(function () {
  return [this.owner, ...this.collaborators];
});

// ── Static: find all notes accessible to a given userId ──────────────────────
noteSchema.statics.findAccessible = function (userId) {
  return this.find({
    $or: [{ owner: userId }, { collaborators: userId }],
    isArchived: false,
  })
    .populate("owner", "name email avatar")
    .populate("collaborators", "name email avatar")
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model("Note", noteSchema);
