// src/components/notes/CollaboratorModal.jsx
import { useState } from "react";
import { useNotes } from "../../context/NotesContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const CollaboratorModal = ({ note, onClose }) => {
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const { addCollaborator, removeCollaborator } = useNotes();
  const { user } = useAuth();

  const isOwner = note.owner._id === user._id || note.owner._id?.toString() === user._id?.toString();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      await addCollaborator(note._id, email.trim());
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await removeCollaborator(note._id, userId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove collaborator");
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-800">Collaborators</h2>
            <p className="text-xs text-gray-400 mt-0.5">"{note.title}"</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Owner info */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Owner</p>
            <div className="flex items-center gap-3 p-3 bg-forest-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {note.owner.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{note.owner.name}</p>
                <p className="text-xs text-gray-400">{note.owner.email}</p>
              </div>
              <span className="ml-auto text-xs text-forest-600 font-medium bg-forest-100 px-2 py-0.5 rounded-full">Owner</span>
            </div>
          </div>

          {/* Collaborators list */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Collaborators ({note.collaborators?.length || 0})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {note.collaborators?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                  No collaborators yet
                </p>
              ) : (
                note.collaborators.map((collab) => (
                  <div key={collab._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold shrink-0">
                      {collab.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{collab.name}</p>
                      <p className="text-xs text-gray-400 truncate">{collab.email}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Editor</span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add collaborator (owner only) */}
          {isOwner && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Invite by email</p>
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="input flex-1 text-sm"
                />
                <button type="submit" disabled={adding || !email.trim()} className="btn-primary shrink-0">
                  {adding
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : "Invite"
                  }
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorModal;
