// src/context/NotesContext.jsx
// Keeps notes list and active note in sync across the app.

import { createContext, useContext, useReducer, useCallback } from "react";
import { notesAPI } from "../services/api";
import toast from "react-hot-toast";

const NotesContext = createContext(null);

const initialState = {
  notes: [],
  activeNote: null,
  loading: false,
  searchResults: null, // null = not in search mode
  searchQuery: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTIVE":
      return { ...state, activeNote: action.payload };
    case "ADD_NOTE":
      return { ...state, notes: [action.payload, ...state.notes] };
    case "UPDATE_NOTE": {
      const updated = action.payload;
      return {
        ...state,
        notes: state.notes.map((n) => (n._id === updated._id ? updated : n)),
        activeNote: state.activeNote?._id === updated._id ? updated : state.activeNote,
      };
    }
    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((n) => n._id !== action.payload),
        activeNote: state.activeNote?._id === action.payload ? null : state.activeNote,
      };
    case "SET_SEARCH":
      return { ...state, searchResults: action.payload.results, searchQuery: action.payload.query };
    case "CLEAR_SEARCH":
      return { ...state, searchResults: null, searchQuery: "" };
    default:
      return state;
  }
};

export const NotesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { data } = await notesAPI.getAll();
      dispatch({ type: "SET_NOTES", payload: data.notes });
    } catch {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createNote = useCallback(async (noteData = {}) => {
    const { data } = await notesAPI.create({
      title: "Untitled Note",
      content: "",
      ...noteData,
    });
    dispatch({ type: "ADD_NOTE", payload: data.note });
    dispatch({ type: "SET_ACTIVE", payload: data.note });
    return data.note;
  }, []);

  const updateNote = useCallback(async (id, updates) => {
    const { data } = await notesAPI.update(id, updates);
    dispatch({ type: "UPDATE_NOTE", payload: data.note });
    return data.note;
  }, []);

  const deleteNote = useCallback(async (id) => {
    await notesAPI.delete(id);
    dispatch({ type: "DELETE_NOTE", payload: id });
    toast.success("Note deleted");
  }, []);

  const setActiveNote = useCallback((note) => {
    dispatch({ type: "SET_ACTIVE", payload: note });
  }, []);

  const searchNotes = useCallback(async (query) => {
    if (!query.trim()) {
      dispatch({ type: "CLEAR_SEARCH" });
      return;
    }
    const { data } = await notesAPI.search(query);
    dispatch({ type: "SET_SEARCH", payload: { results: data.notes, query } });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: "CLEAR_SEARCH" });
  }, []);

  const addCollaborator = useCallback(async (noteId, email) => {
    const { data } = await notesAPI.addCollaborator(noteId, email);
    dispatch({ type: "UPDATE_NOTE", payload: data.note });
    toast.success("Collaborator added");
    return data.note;
  }, []);

  const removeCollaborator = useCallback(async (noteId, userId) => {
    const { data } = await notesAPI.removeCollaborator(noteId, userId);
    dispatch({ type: "UPDATE_NOTE", payload: data.note });
    toast.success("Collaborator removed");
    return data.note;
  }, []);

  return (
    <NotesContext.Provider
      value={{
        ...state,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        setActiveNote,
        searchNotes,
        clearSearch,
        addCollaborator,
        removeCollaborator,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used inside NotesProvider");
  return ctx;
};
