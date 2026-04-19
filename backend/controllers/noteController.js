const Note = require("../models/Note");

const findOwnedNote = async (noteId, userId) => {
  const note = await Note.findById(noteId);

  if (!note) {
    return { status: 404, body: { message: "Note not found" } };
  }

  if (note.user.toString() !== userId.toString()) {
    return { status: 401, body: { message: "Not authorized" } };
  }

  return { note };
};

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNote = async (req, res) => {
  const title = req.body.title?.trim();
  const content = typeof req.body.content === "string" ? req.body.content : "";

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const result = await findOwnedNote(req.params.id, req.user._id);

    if (!result.note) {
      return res.status(result.status).json(result.body);
    }

    const note = result.note;
    const { title, content } = req.body;

    if (title !== undefined) {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        return res.status(400).json({ message: "Title is required" });
      }

      note.title = trimmedTitle;
    }

    if (content !== undefined) note.content = content;

    const updated = await note.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleStar = async (req, res) => {
  try {
    const result = await findOwnedNote(req.params.id, req.user._id);

    if (!result.note) {
      return res.status(result.status).json(result.body);
    }

    const note = result.note;
    note.starred = !note.starred;
    const updated = await note.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const result = await findOwnedNote(req.params.id, req.user._id);

    if (!result.note) {
      return res.status(result.status).json(result.body);
    }

    const note = result.note;
    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotes, createNote, updateNote, toggleStar, deleteNote };
