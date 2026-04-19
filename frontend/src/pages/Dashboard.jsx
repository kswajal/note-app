import { useEffect, useMemo, useState } from "react";
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
  Edit2,
  Trash2,
  Maximize2,
  Minimize2,
  X,
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
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [section, setSection] = useState("all");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      if (editingId) {
        const { data } = await API.patch(`/notes/${editingId}`, { title, content });
        setNotes((current) => current.map((n) => (n._id === editingId ? data : n)));
        toast.success("Note saved");
      } else {
        const { data } = await API.post("/notes", { title, content });
        setNotes((current) => [data, ...current]);
        setSelectedId(data._id);
        setSearch("");
        setSection("all");
        toast.success("Note created");
      }
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
    setIsFullScreen(false);
    setForm({ title: "", content: "" });
    setEditingId(null);
  };

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
    logout();
    navigate("/login");
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#09090b] text-zinc-100 selection:bg-blue-500/30" : "bg-white text-zinc-900 selection:bg-blue-500/20"}`}>
      <aside className={`relative z-10 flex w-[260px] shrink-0 flex-col transition-colors duration-300 ${isDark ? "border-r border-zinc-800/40 bg-[#0a0a0c]" : "border-r border-zinc-100 bg-zinc-50/80"}`}>
        <div className="px-4 pt-6 pb-4">
          <div className="mb-6 flex items-center gap-2 px-1">
               <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-900 text-white"}`}>
                 <BookOpen size={14} strokeWidth={2.5} />
               </div>
               <span className="text-[0.95rem] font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">NoteFlow</span>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setForm({ title: "", content: "" });
              setEditingId(null);
              setIsFullScreen(false);
              setShowForm(true);
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
              onClick={() => setSection(key)}
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
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400/80 mb-2 px-2 mt-5">
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
                      onClick={() => {
                        setSelectedId(note._id);
                        if (section === "settings") setSection("all");
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
              <div className="px-3 py-8 text-center flex flex-col items-center gap-3">
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
      </aside>

      <main className="flex min-w-0 flex-1 flex-col transition-colors duration-300">
        <header className={`relative flex h-16 shrink-0 items-center justify-between px-8 py-2 transition-colors duration-300 ${isDark ? "bg-[#09090b]" : "bg-white"}`}>
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
               <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search..."
                 className={`h-10 w-56 rounded-xl pl-10 pr-4 text-[15px] outline-none transition-all focus:w-72 border border-transparent ${
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <LogOut size={16} strokeWidth={2} />
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-3xl px-8 py-16">
            <AnimatePresence mode="wait">
              {section === "settings" ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="w-full"
                >
                  <h1 className="mb-2 text-5xl font-bold tracking-tight">Settings</h1>
                  <p className="mb-12 text-zinc-500 text-lg leading-8">Configure your workspace and profile settings.</p>
                  
                  <div className="space-y-10">
                    <section>
                      <h3 className="mb-6 text-xl font-semibold tracking-tight">Profile Information</h3>
                      <div className={`rounded-2xl p-8 transition-colors duration-300 ${isDark ? "bg-[#0f0f11]" : "bg-zinc-50"}`}>
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
                      <div className={`rounded-2xl p-8 transition-colors duration-300 ${isDark ? "bg-[#0f0f11]" : "bg-zinc-50"}`}>
                        <div className="flex items-center justify-between">
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
              ) : selectedNote ? (
                <motion.div
                  key={selectedNote._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <div className="relative w-full pt-10">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute right-4 top-2 flex items-center gap-1 rounded-2xl p-1.5 shadow-sm border ${
                        isDark 
                          ? "bg-[#0f0f11] border-zinc-800/80" 
                          : "bg-white border-zinc-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                        <button
                          type="button"
                          onClick={() => handleToggleStar(selectedNote._id)}
                          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                            selectedNote.starred 
                              ? (isDark ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-amber-50 text-amber-700 hover:bg-amber-100")
                              : (isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "text-slate-500 hover:bg-[#f8f9fa] hover:text-slate-800")
                          }`}
                        >
                          <StarIcon size={16} strokeWidth={2} className={selectedNote.starred ? "fill-current" : ""} />
                          Star
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                             setForm({ title: selectedNote.title, content: selectedNote.content });
                             setEditingId(selectedNote._id);
                             setShowForm(true);
                          }}
                          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "text-slate-500 hover:bg-[#f8f9fa] hover:text-slate-800"}`}
                        >
                          <Edit2 size={16} strokeWidth={2} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteToDelete(selectedNote._id)}
                          disabled={deletingId === selectedNote._id}
                          className={`flex items-center justify-center rounded-xl px-3 py-2 text-sm transition-colors ${isDark ? "text-zinc-400 hover:bg-red-500/10 hover:text-red-400" : "text-slate-400 hover:bg-red-50 hover:text-red-600"}`}
                        >
                          <div className="flex gap-0.5 items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                          </div>
                        </button>
                    </motion.div>

                    <motion.h1 
                      layoutId={`title-${selectedNote._id}`}
                      className={`mb-4 text-[44px] md:text-[52px] font-[800] leading-[1.1] tracking-[-0.02em] ${isDark ? "text-zinc-50" : "text-[#111827]"}`}
                    >
                      {selectedNote.title}
                    </motion.h1>

                    <motion.p 
                      layoutId={`date-${selectedNote._id}`}
                      className="mb-10 text-[15px] font-medium text-slate-400/90"
                    >
                      {formatDate(selectedNote.updatedAt)}
                    </motion.p>
                  </div>

                  <div 
                    className={`prose prose-zinc max-w-none space-y-4 text-[1.05rem] leading-[1.9] ${isDark ? "prose-invert" : ""} 
                    [&>p]:text-zinc-600 dark:[&>p]:text-zinc-400 [&>p]:leading-8 [&>p]:mb-0
                    [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mt-0
                    [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mt-0
                    [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:mt-10 [&>h2]:mb-4
                    [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-3
                    prose-code:bg-zinc-100 prose-code:text-blue-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-800/80 dark:prose-code:text-blue-400
                    [&>pre]:bg-zinc-900 [&>pre]:text-zinc-100 [&>pre]:p-6 [&>pre]:rounded-xl [&>pre]:font-mono [&>pre]:text-sm
                    [&_strong]:font-semibold [&_a]:text-blue-500 [&_a]:no-underline [&_a]:hover:underline
                    [&>hr]:my-10 [&>hr]:border-zinc-100 dark:[&>hr]:border-zinc-800`}
                    dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                  />
                </motion.div>
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-10 relative flex h-[280px] w-[280px] items-center justify-center pt-4"
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
                  <h2 className="mb-3 text-3xl font-extrabold tracking-tight">No note selected</h2>
                  <p className="mb-10 max-w-xs text-zinc-500 font-bold leading-relaxed">
                    Pick a note from the sidebar or create a new one to get started.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => {
                      setForm({ title: "", content: "" });
                      setEditingId(null);
                      setIsFullScreen(false);
                      setShowForm(true);
                    }}
                    className="rounded-2xl px-12 h-14 font-extrabold tracking-tight shadow-xl shadow-zinc-900/10"
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
        {showForm && (
          <motion.div
            key="create-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseForm(); }}
          >
            <motion.div
              key="create-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full max-w-[680px] rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? "bg-[#0f0f11] text-zinc-100" : "bg-white text-zinc-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`relative px-8 pt-8 pb-4 border-b ${
                isDark ? "border-zinc-800/60" : "border-zinc-100"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">
                      {editingId ? "Edit note" : "New note"}
                    </h2>
                    <p className={`text-sm mt-1 ${
                      isDark ? "text-zinc-400" : "text-zinc-500"
                    }`}>
                      {editingId ? "Make your changes and save when you're ready." : "Write down the next thing you want to remember."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setIsFullScreen(true); }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                        isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <Maximize2 size={15} strokeWidth={2.5} />
                      Expand
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className={`rounded-lg p-1.5 transition-colors ${
                        isDark ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      }`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-5">
                <div className="space-y-2">
                  <label className={`text-[11px] font-bold uppercase tracking-widest ${
                    isDark ? "text-zinc-500" : "text-zinc-400"
                  }`}>Note Title</label>
                  <input
                    type="text"
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                    placeholder="Enter note title..."
                    className={`h-12 w-full rounded-xl border px-4 text-sm font-medium outline-none transition-all focus:ring-2 ${
                      isDark
                        ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:ring-zinc-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[11px] font-bold uppercase tracking-widest ${
                    isDark ? "text-zinc-500" : "text-zinc-400"
                  }`}>Content</label>
                  <RichEditor
                    content={form.content}
                    onChange={(html) => setForm((c) => ({ ...c, content: html }))}
                    placeholder="Tell your story or list your tasks..."
                  />
                </div>

                <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                  isDark ? "border-zinc-800" : "border-zinc-100"
                }`}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseForm}
                    className="h-11 px-6 rounded-xl font-bold"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="h-11 px-8 rounded-xl font-extrabold min-w-[140px]"
                  >
                    {creating ? "Saving..." : (editingId ? "Save Note" : "Create Note")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className={`w-full max-w-sm rounded-2xl p-8 shadow-2xl ${
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

      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed inset-0 z-50 flex flex-col ${isDark ? "bg-[#09090b] text-zinc-100" : "bg-white text-zinc-900"}`}
          >
            <div className={`flex w-full shrink-0 flex-row items-center justify-between px-8 py-4 border-b ${isDark ? "border-zinc-800/40" : "border-zinc-200/80"}`}>
               <button
                 type="button"
                 onClick={() => {
                   setIsFullScreen(false);
                   setShowForm(true);
                 }}
                 className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
               >
                 <Minimize2 size={16} strokeWidth={2.5} />
                 Back to modal
               </button>

               <div className="flex gap-3">
                 <Button
                   type="button"
                   variant="ghost"
                   onClick={handleCloseForm}
                   className="h-10 px-6 rounded-xl font-bold"
                 >
                   Discard
                 </Button>
                 <Button
                   type="button"
                   onClick={handleSubmit}
                   disabled={creating}
                   className="h-10 px-6 rounded-xl font-extrabold"
                 >
                   {creating ? "Saving..." : "Save Note"}
                 </Button>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 w-full overflow-y-auto scrollbar-hide">
              <div className="mx-auto max-w-4xl px-8 md:px-12 py-16 md:py-24 pb-40">
                <input
                  type="text"
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  placeholder="Untitled"
                  className={`w-full bg-transparent text-[3.5rem] font-extrabold leading-tight tracking-tight outline-none placeholder:opacity-30 ${isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-300"}`}
                />
                
                <div className="mt-8 w-full notion-editor-wrapper">
                  <RichEditor
                     content={form.content}
                     onChange={(html) => setForm((current) => ({ ...current, content: html }))}
                     placeholder="Start writing..."
                     seamless={true}
                  />
                </div>

                <button type="submit" className="hidden" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
