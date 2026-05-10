import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  List,
  Moon,
  Plus,
  Search,
  Settings,
  Star as StarIcon,
  Sun,
  LogOut,
  Trash2,
  Menu,
} from "lucide-react";
import authLight from "../assets/auth-light.png";
import authDark from "../assets/auth-dark.jpg";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import RichEditor from "../components/RichEditor";
import { Button } from "../components/ui/button";

const stripHtml = (value = "") =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [section, setSection] = useState("all");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/notes");
        setNotes(data);
        if (data.length) {
          setSelectedId((current) => current || data[0]._id);
        }
      } catch {
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const sectionFiltered = notes.filter((note) => {
      if (section === "starred") return note.starred;
      return true;
    });

    const query = search.trim().toLowerCase();
    if (!query) return sectionFiltered;

    return sectionFiltered.filter((note) => {
      const title = note.title?.toLowerCase() || "";
      const content = stripHtml(note.content || "").toLowerCase();
      return title.includes(query) || content.includes(query);
    });
  }, [notes, search, section]);

  useEffect(() => {
    if (!filteredNotes.length) {
      if (section !== "settings") setSelectedId(null);
      return;
    }
    const exists = filteredNotes.some((note) => note._id === selectedId);
    if (!exists && section !== "settings") {
      setSelectedId(filteredNotes[0]._id);
    }
  }, [filteredNotes, selectedId, section]);

  const selectedNote = filteredNotes.find((note) => note._id === selectedId) || null;

  useEffect(() => {
    if (showForm || !selectedNote) return;
    setForm({ title: selectedNote.title || "", content: selectedNote.content || "" });
  }, [selectedId, showForm]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = form.title.trim();
    let content = form.content.trim();

    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (!content) {
      content = "<p></p>";
    }

    setCreating(true);
    try {
      const { data } = await API.post("/notes", { title, content });
      setNotes((current) => [data, ...current]);
      setSelectedId(data._id);
      setSearch("");
      setSection("all");
      toast.success("Note created");
      handleCloseForm();
    } catch (error) {
      console.error("Save note error:", error);
      const msg = error.response?.data?.message || error.message || "Error saving note";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm({ title: "", content: "" });
  };

  const saveNoteDraft = async (note, draft, options = {}) => {
    if (!note) return false;

    const title = draft.title.trim();
    let content = draft.content.trim();

    if (!title) {
      toast.error("Title is required");
      return false;
    }

    if (!content) {
      content = "<p></p>";
    }

    setCreating(true);
    try {
      const { data } = await API.patch(`/notes/${note._id}`, { title, content });
      setNotes((current) => current.map((currentNote) => (currentNote._id === note._id ? data : currentNote)));
      if (!options.silent) toast.success("Note saved");
      return true;
    } catch (error) {
      console.error("Save note error:", error);
      const msg = error.response?.data?.message || error.message || "Error saving note";
      toast.error(msg);
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSelectedNote = async (e, options = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    return saveNoteDraft(selectedNote, form, options);
  };

  const flushPendingSelectedNote = async () => {
    if (showForm || !selectedNote) return true;

    const titleChanged = form.title !== (selectedNote.title || "");
    const contentChanged = form.content !== (selectedNote.content || "");
    if (!titleChanged && !contentChanged) return true;

    window.clearTimeout(autoSaveTimerRef.current);
    return saveNoteDraft(selectedNote, form, { silent: true });
  };

  useEffect(() => {
    if (showForm || !selectedNote) return undefined;

    const titleChanged = form.title !== (selectedNote.title || "");
    const contentChanged = form.content !== (selectedNote.content || "");
    if (!titleChanged && !contentChanged) return undefined;

    window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveNoteDraft(selectedNote, form, { silent: true });
    }, 900);

    return () => window.clearTimeout(autoSaveTimerRef.current);
  }, [form.title, form.content, selectedNote, showForm]);

  const handleToggleStar = async (id) => {
    try {
      const { data } = await API.patch(`/notes/${id}/star`);
      setNotes((current) => current.map((n) => (n._id === id ? data : n)));
    } catch {
      toast.error("Failed to update starred status");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await API.delete(`/notes/${id}`);
      const nextNotes = notes.filter((note) => note._id !== id);
      setNotes(nextNotes);
      if (selectedId === id) {
        setSelectedId(nextNotes[0]?._id || null);
      }
      toast.success("Note deleted");
      setNoteToDelete(null);
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    flushPendingSelectedNote().finally(() => {
      logout();
      navigate("/login");
    });
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#09090b] text-zinc-100 selection:bg-blue-500/30" : "bg-white text-zinc-900 selection:bg-blue-500/20"}`}>
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
        />
      ) : null}

      <aside className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden transition-[width,transform,border-color,background-color] duration-300 ease-out md:relative md:z-10 md:translate-x-0 ${isSidebarOpen ? "w-[260px] translate-x-0 border-r" : "w-[260px] -translate-x-full border-r-0 md:w-0 md:translate-x-0"} ${isDark ? "border-zinc-800/40 bg-[#0a0a0c]" : "border-zinc-100 bg-zinc-50/95 md:bg-zinc-50/80"}`}>
        <div className="flex h-full w-[260px] shrink-0 flex-col">
          <div className="px-4 pt-6 pb-4">
            <div className="mb-6 flex items-center gap-2 px-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-900 text-white"}`}>
                <BookOpen size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[0.95rem] font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">NoteFlow</span>
            </div>
          
            <button
              type="button"
              onClick={async () => {
                const saved = await flushPendingSelectedNote();
                if (!saved) return;
                setForm({ title: "", content: "" });
                setSelectedId(null);
                setSection("all");
                setShowForm(true);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border ${
                isDark
                  ? "border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                  : "border-zinc-200 text-zinc-600 hover:bg-white hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <Plus size={14} strokeWidth={2.5} />
              New note
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 pb-2">
            {[
              { icon: List, label: "All Notes", key: "all" },
              { icon: StarIcon, label: "Favorites", key: "starred" },
              { icon: Settings, label: "Settings", key: "settings" },
            ].map(({ icon: Icon, label, key }) => (
              <motion.button
                whileTap={{ scale: 0.97 }}
                key={key}
                onClick={async () => {
                  const saved = await flushPendingSelectedNote();
                  if (!saved) return;
                  handleCloseForm();
                  setSection(key);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  section === key
                    ? isDark ? "bg-zinc-800/70 text-zinc-100" : "bg-white text-zinc-900 shadow-sm"
                    : isDark ? "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300" : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-800"
                }`}
              >
                <Icon size={15} strokeWidth={section === key ? 2.2 : 1.8} />
                {label}
              </motion.button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide">
            <div className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400/80">
              {section === "starred" ? "Favorites" : "Notes"}
            </div>
          
            <div className="flex flex-col gap-0.5">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => {
                  const active = note._id === selectedId && section !== "settings";
                  return (
                    <motion.button
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      key={note._id}
                      onClick={async () => {
                        if (note._id === selectedId) return;
                        const saved = await flushPendingSelectedNote();
                        if (!saved) return;
                        handleCloseForm();
                        setSelectedId(note._id);
                        if (section === "settings") setSection("all");
                        setIsSidebarOpen(false);
                      }}
                      className={`group relative flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors duration-100 ${
                        active
                          ? isDark ? "bg-zinc-800/80 text-zinc-100" : "bg-white text-zinc-900 shadow-sm"
                          : isDark ? "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className={`truncate text-sm font-medium ${active ? (isDark ? "text-zinc-100" : "text-zinc-900") : ""}`}>
                          {note.title}
                        </span>
                        {note.starred && <StarIcon size={10} className={`ml-auto shrink-0 ${active && !isDark ? "fill-amber-500 text-amber-500" : "fill-zinc-400/60 text-zinc-400/60"}`} />}
                      </div>
                      <span className="text-[11px] text-zinc-400/70 mt-0.5">
                        {formatDate(note.updatedAt)}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {!loading && !filteredNotes.length && section !== "settings" ? (
                <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
                  <p className="text-xs font-medium text-zinc-400">No notes here yet.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`mt-auto shrink-0 px-3 py-3 transition-colors duration-300 ${isDark ? "border-t border-zinc-800/40" : "border-t border-zinc-100"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-700 dark:text-zinc-200 transition-all duration-300">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{user?.name || "User"}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`rounded-md p-1.5 transition-all ${isDark ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" : "text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"}`}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col transition-colors duration-300">
        <header className={`relative flex h-16 shrink-0 items-center justify-between px-4 py-2 transition-colors duration-300 md:px-8 ${isDark ? "bg-[#09090b]" : "bg-white"}`}>
          <div className="flex items-center gap-3">
             <button
               type="button"
               onClick={() => setIsSidebarOpen((current) => !current)}
               aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
               aria-expanded={isSidebarOpen}
               className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                 isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
               }`}
             >
               <Menu size={19} strokeWidth={2.2} />
             </button>
             <div className="relative w-40 min-w-0 sm:w-auto">
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
               <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search..."
                 className={`h-10 w-full min-w-0 rounded-xl border border-transparent pl-10 pr-4 text-[15px] outline-none transition-all sm:w-56 sm:focus:w-72 ${
                   isDark 
                    ? "bg-zinc-900/80 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-800" 
                    : "bg-[#f8f9fa] text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-200 focus:shadow-sm"
                 }`}
               />
             </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium transition-colors sm:px-4 ${
                isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <LogOut size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:px-12 md:py-14">
            <AnimatePresence mode="wait">
              {section === "settings" ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="w-full"
                >
                  <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">Settings</h1>
                  <p className="mb-10 text-base leading-7 text-zinc-500 sm:mb-12 sm:text-lg sm:leading-8">Configure your workspace and profile settings.</p>
                  
                  <div className="space-y-10">
                    <section>
                      <h3 className="mb-6 text-xl font-semibold tracking-tight">Profile Information</h3>
                      <div className={`rounded-2xl p-5 transition-colors duration-300 sm:p-8 ${isDark ? "bg-[#0f0f11]" : "bg-zinc-50"}`}>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</label>
                            <div className={`flex h-11 items-center rounded-lg px-4 text-sm font-medium ${isDark ? "bg-zinc-900 text-zinc-200" : "bg-white text-zinc-800"}`}>
                              {user?.name || "User"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email Address</label>
                            <div className={`flex h-11 items-center rounded-lg px-4 text-sm font-medium ${isDark ? "bg-zinc-900 text-zinc-200" : "bg-white text-zinc-800"}`}>
                              {user?.email || "user@example.com"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-6 text-xl font-semibold tracking-tight">Preferences</h3>
                      <div className={`rounded-2xl p-5 transition-colors duration-300 sm:p-8 ${isDark ? "bg-[#0f0f11]" : "bg-zinc-50"}`}>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-[1rem] mb-1">Visual Theme</p>
                            <p className="text-sm text-zinc-500">Swap between light and dark modes.</p>
                          </div>
                          <Button 
                            variant="secondary" 
                            onClick={toggleTheme} 
                            className="gap-2 px-5 h-10 rounded-lg text-sm"
                          >
                            {isDark ? <Moon size={16} /> : <Sun size={16} />}
                            {isDark ? "Dark" : "Light"}
                          </Button>
                        </div>
                      </div>
                    </section>
                  </div>
                </motion.div>
              ) : showForm ? (
                <motion.form
                  key="new-note"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="w-full"
                >
                  <div className="relative w-full pt-16 sm:pt-10">
                    <div className={`absolute right-0 top-0 flex items-center gap-2 rounded-2xl border p-1.5 shadow-sm ${
                      isDark
                        ? "border-zinc-800/80 bg-[#0f0f11]"
                        : "border-zinc-100/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                    }`}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCloseForm}
                        className="h-9 rounded-xl px-4 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating}
                        className="h-9 min-w-[104px] rounded-xl px-5 font-extrabold"
                      >
                        {creating ? "Saving..." : "Save"}
                      </Button>
                    </div>

                    <input
                      type="text"
                      autoFocus
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Untitled"
                      className={`mb-4 w-full bg-transparent text-[34px] font-[800] leading-[1.1] outline-none placeholder:opacity-30 sm:pr-56 sm:text-[44px] md:text-[52px] ${
                        isDark ? "text-zinc-50 placeholder:text-zinc-600" : "text-[#111827] placeholder:text-zinc-300"
                      }`}
                    />

                    <p className="mb-10 text-[15px] font-medium text-slate-400/90">
                      New note
                    </p>
                  </div>

                  <RichEditor
                    content={form.content}
                    onChange={(html) => setForm((current) => ({ ...current, content: html }))}
                    placeholder="Start writing..."
                  />
                </motion.form>
              ) : selectedNote ? (
                <motion.form
                  key={selectedNote._id}
                  onSubmit={handleSaveSelectedNote}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <div className="relative w-full pt-4">
                    <div className="mb-7 flex min-h-10 items-center justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-1 rounded-xl border p-1 shadow-sm ${
                          isDark
                            ? "border-zinc-800/80 bg-[#0f0f11]"
                            : "border-zinc-100/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                        }`}
                      >
                        <button
                          type="button"
                          title={selectedNote.starred ? "Remove from favorites" : "Add to favorites"}
                          aria-label={selectedNote.starred ? "Remove from favorites" : "Add to favorites"}
                          onClick={async () => {
                            const saved = await flushPendingSelectedNote();
                            if (!saved) return;
                            handleToggleStar(selectedNote._id);
                          }}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            selectedNote.starred
                              ? isDark
                                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              : isDark
                                ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                : "text-slate-500 hover:bg-[#f8f9fa] hover:text-slate-800"
                          }`}
                        >
                          <StarIcon size={16} strokeWidth={2} className={selectedNote.starred ? "fill-current" : ""} />
                        </button>
                        <button
                          type="button"
                          title="Delete note"
                          aria-label="Delete note"
                          onClick={async () => {
                            const saved = await flushPendingSelectedNote();
                            if (!saved) return;
                            setNoteToDelete(selectedNote._id);
                          }}
                          disabled={deletingId === selectedNote._id}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            isDark
                              ? "text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                              : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </motion.div>
                    </div>

                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Untitled"
                      className={`mb-4 w-full bg-transparent text-[34px] font-[800] leading-[1.1] outline-none placeholder:opacity-30 sm:text-[44px] md:text-[52px] ${
                        isDark ? "text-zinc-50 placeholder:text-zinc-600" : "text-[#111827] placeholder:text-zinc-300"
                      }`}
                    />

                    <motion.p 
                      layoutId={`date-${selectedNote._id}`}
                      className="mb-10 text-[15px] font-medium text-slate-400/90"
                    >
                      {formatDate(selectedNote.updatedAt)}
                    </motion.p>
                  </div>

                  <RichEditor
                    content={form.content}
                    onChange={(html) => setForm((current) => ({ ...current, content: html }))}
                    placeholder="Start writing..."
                  />
                </motion.form>
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative mb-8 flex h-[220px] w-[220px] items-center justify-center pt-4 sm:mb-10 sm:h-[280px] sm:w-[280px]"
                  >
                    <img 
                      src={isDark ? authDark : authLight} 
                      alt="No notes" 
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ 
                        WebkitMaskImage: "radial-gradient(circle, black 45%, transparent 68%)",
                        maskImage: "radial-gradient(circle, black 45%, transparent 68%)"
                      }}
                    />
                  </motion.div>
                  <h2 className="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">No note selected</h2>
                  <p className="mb-10 max-w-xs text-zinc-500 font-bold leading-relaxed">
                    Pick a note from the sidebar or create a new one to get started.
                  </p>
                  <Button
                    size="lg"
                    onClick={async () => {
                      const saved = await flushPendingSelectedNote();
                      if (!saved) return;
                      setForm({ title: "", content: "" });
                      setSelectedId(null);
                      setSection("all");
                      setShowForm(true);
                    }}
                    className="h-12 rounded-2xl px-8 font-extrabold tracking-tight shadow-xl shadow-zinc-900/10 sm:h-14 sm:px-12"
                  >
                    <Plus size={22} strokeWidth={3} />
                    Create Your First Note
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {!!noteToDelete && (
          <motion.div
            key="delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setNoteToDelete(null); }}
          >
            <motion.div
              key="delete-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl sm:p-8 ${
                isDark ? "bg-[#0f0f11] text-zinc-100" : "bg-white text-zinc-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
                isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
              }`}>
                <Trash2 size={24} strokeWidth={2} />
              </div>
              <h3 className="text-center text-xl font-bold tracking-tight mb-2">Delete Note</h3>
              <p className="text-center text-sm text-zinc-500 mb-8">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className={`w-full rounded-xl h-11 font-bold ${
                    isDark ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                  onClick={() => setNoteToDelete(null)}
                  disabled={!!deletingId}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="w-full rounded-xl h-11 font-bold"
                  disabled={!!deletingId}
                  onClick={() => handleDelete(noteToDelete)}
                >
                  {deletingId ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
