import { useEffect, useState } from "react";
import API from "../api/axios";

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchNotes = async () => {
    const { data } = await API.get("/notes");
    setNotes(data);
  };

  useEffect(() => {
    (async () => {
      await fetchNotes();
    })();
  }, []);

  const createNote = async () => {
    await API.post("/notes", { title, content });
    setTitle("");
    setContent("");
    fetchNotes();
  };

  const deleteNote = async (id) => {
    await API.delete(`/notes/${id}`);
    fetchNotes();
  };

  return (
    <div>
      <h2>Dashboard</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={createNote}>Create</button>

      <hr />

      {notes.map((note) => (
        <div key={note._id}>
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          <button onClick={() => deleteNote(note._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;