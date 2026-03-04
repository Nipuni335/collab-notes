// src/components/layout/Sidebar.jsx
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNotes } from "../../context/NotesContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ── Strip HTML tags for preview text ─────────────────────────────────────────
const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const NoteCard = ({ note, isActive, onClick }) => {
  const preview = stripHtml(note.content).slice(0, 80) || "No content yet…";
  const isShared = note.collaborators?.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group
        ${isActive
          ? "bg-forest-600 text-white shadow-sm"
          : "hover:bg-gray-100 text-gray-700"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-snug truncate ${isActive ? "text-white" : "text-gray-800"}`}>
          {note.title || "Untitled Note"}
        </p>
        {isShared && (
          <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium
            ${isActive ? "bg-white/20 text-white" : "bg-forest-100 text-forest-700"}`}>
            Shared
          </span>
        )}
      </div>
      <p className={`text-xs mt-1 truncate ${isActive ? "text-forest-200" : "text-gray-400"}`}>
        {preview}
      </p>
      <p className={`text-xs mt-1 ${isActive ? "text-forest-300" : "text-gray-300"}`}>
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </p>
    </button>
  );
};

const Sidebar = () => {
  const { notes, activeNote, setActiveNote, createNote, searchNotes, clearSearch, searchResults, searchQuery, loading } = useNotes();
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSearch = useCallback(async (val) => {
    setSearchInput(val);
    if (!val.trim()) { clearSearch(); return; }
    try { await searchNotes(val); }
    catch { toast.error("Search failed"); }
  }, [searchNotes, clearSearch]);

  const handleCreate = async () => {
    setCreating(true);
    try { await createNote(); }
    catch { toast.error("Could not create note"); }
    finally { setCreating(false); }
  };

  const displayNotes = searchResults !== null ? searchResults : notes;

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="font-display font-bold text-gray-800 text-lg">NoteCollab</span>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            title="New note"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-forest-600 text-white hover:bg-forest-700 transition-colors"
          >
            {creating
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            }
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent"
          />
        </div>

        {searchResults !== null && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"</p>
            <button onClick={() => { clearSearch(); setSearchInput(""); }} className="text-xs text-forest-600 hover:underline">Clear</button>
          </div>
        )}
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-forest-200 border-t-forest-500 rounded-full animate-spin" />
          </div>
        ) : displayNotes.length === 0 ? (
          <div className="text-center pt-12 px-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">
              {searchResults !== null ? "No matching notes" : "No notes yet — create one!"}
            </p>
          </div>
        ) : (
          displayNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              isActive={activeNote?._id === note._id}
              onClick={() => setActiveNote(note)}
            />
          ))
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
