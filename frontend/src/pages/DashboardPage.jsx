// src/pages/DashboardPage.jsx
import { useEffect } from "react";
import { useNotes } from "../context/NotesContext";
import Sidebar from "../components/layout/Sidebar";
import NoteEditor from "../components/editor/NoteEditor";

const DashboardPage = () => {
  const { fetchNotes } = useNotes();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <NoteEditor />
      </main>
    </div>
  );
};

export default DashboardPage;
