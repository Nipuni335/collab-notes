// src/components/editor/NoteEditor.jsx
// React Quill + auto-save + collaborator management
// DOMPurify on display (server also sanitises; defence-in-depth).

import { useState, useCallback, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import DOMPurify from "dompurify";
import "react-quill/dist/quill.snow.css";
import { useNotes } from "../../context/NotesContext";
import { useAuth } from "../../context/AuthContext";
import CollaboratorModal from "../notes/CollaboratorModal";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

// ── Quill toolbar config ──────────────────────────────────────────────────────
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["link"],
  ["clean"],
];

const FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "color", "background", "blockquote", "code-block",
  "list", "bullet", "indent", "link",
];

const SAVE_DELAY = 1500; // ms after last keystroke before auto-save

const NoteEditor = () => {
  const { activeNote, updateNote, deleteNote } = useNotes();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveTimer = useRef(null);
  const noteIdRef = useRef(null); // track which note we're editing

  const isOwner =
    activeNote?.owner?._id === user?._id ||
    activeNote?.owner?._id?.toString() === user?._id?.toString();

  // ── Sync local state when active note changes ─────────────────────────────
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || "");
      setContent(activeNote.content || "");
      setLastSaved(new Date(activeNote.updatedAt));
      noteIdRef.current = activeNote._id;
    }
  }, [activeNote?._id]); // only re-run on note ID change

  // ── Auto-save helper ──────────────────────────────────────────────────────
  const triggerSave = useCallback(
    (newTitle, newContent) => {
      if (!noteIdRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await updateNote(noteIdRef.current, { title: newTitle, content: newContent });
          setLastSaved(new Date());
        } catch {
          toast.error("Auto-save failed");
        } finally {
          setSaving(false);
        }
      }, SAVE_DELAY);
    },
    [updateNote]
  );

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerSave(val, content);
  };

  const handleContentChange = (val) => {
    setContent(val);
    triggerSave(title, val);
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    await deleteNote(activeNote._id);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-card flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-gray-600 mb-2">Select a note</h3>
          <p className="text-sm text-gray-400">Choose a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        {/* Left: metadata */}
        <div className="flex items-center gap-3">
          {/* Owner badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold">
              {activeNote.owner?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">
              {isOwner ? "You own this" : `By ${activeNote.owner?.name}`}
            </span>
          </div>

          {/* Collaborator avatars */}
          {activeNote.collaborators?.length > 0 && (
            <div className="flex -space-x-1.5">
              {activeNote.collaborators.slice(0, 3).map((c) => (
                <div key={c._id} title={c.name}
                  className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {c.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {activeNote.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                  +{activeNote.collaborators.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                <span>Saving…</span>
              </>
            ) : lastSaved ? (
              <>
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
              </>
            ) : null}
          </div>

          {/* Collaborators button */}
          <button
            onClick={() => setShowCollabModal(true)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Share
          </button>

          {/* Delete (owner only) */}
          {isOwner && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Title input ─────────────────────────────────────────────────────── */}
      <div className="px-8 pt-6 pb-2 shrink-0">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-3xl font-display font-bold text-gray-800 placeholder-gray-300 bg-transparent border-none outline-none resize-none"
          maxLength={200}
        />
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(activeNote.createdAt), { addSuffix: true })}
          </p>
          {activeNote.collaborators?.length > 0 && (
            <span className="text-xs text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">
              {activeNote.collaborators.length} collaborator{activeNote.collaborators.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Quill editor ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={{ toolbar: TOOLBAR }}
          formats={FORMATS}
          placeholder="Start writing…"
          className="flex-1 flex flex-col overflow-hidden"
        />
      </div>

      {/* ── Collaborator modal ───────────────────────────────────────────────── */}
      {showCollabModal && (
        <CollaboratorModal
          note={activeNote}
          onClose={() => setShowCollabModal(false)}
        />
      )}
    </div>
  );
};

export default NoteEditor;
