import Note from "../models/Note.js";

// Create Note
export const createNote = async (req, res) => {
  const { title, content } = req.body;

  const note = await Note.create({
    title,
    content,
    owner: req.user._id,
  });

  res.status(201).json(note);
};

// Get All Notes (own + shared)
export const getNotes = async (req, res) => {
  const notes = await Note.find({
    $or: [
      { owner: req.user._id },
      { collaborators: req.user._id },
    ],
  });

  res.json(notes);
};

// Update Note
export const updateNote = async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note)
    return res.status(404).json({ message: "Note not found" });

  if (
    note.owner.toString() !== req.user._id.toString() &&
    !note.collaborators.includes(req.user._id)
  ) {
    return res.status(403).json({ message: "Not authorized" });
  }

  note.title = req.body.title || note.title;
  note.content = req.body.content || note.content;

  const updated = await note.save();
  res.json(updated);
};

// Delete Note
export const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note)
    return res.status(404).json({ message: "Note not found" });

  if (note.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Only owner can delete" });

  await note.deleteOne();
  res.json({ message: "Note deleted" });
};

// Search Notes
export const searchNotes = async (req, res) => {
  const query = req.query.q;

  const notes = await Note.find(
    {
      $text: { $search: query },
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
      ],
    }
  );

  res.json(notes);
};