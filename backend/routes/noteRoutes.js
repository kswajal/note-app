const express = require("express");
const router = express.Router();
const { getNotes, createNote, updateNote, toggleStar, deleteNote } = require("../controllers/noteController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getNotes).post(protect, createNote);
router.route("/:id").patch(protect, updateNote).delete(protect, deleteNote);
router.patch("/:id/star", protect, toggleStar);

module.exports = router;
