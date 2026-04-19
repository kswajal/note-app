import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, List, ListOrdered,
  Heading2, Code, RotateCcw, RotateCw,
} from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const ToolBtn = ({ onClick, active, disabled, children, title, isDark }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    disabled={disabled}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all
      ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
      ${active 
        ? (isDark ? 'bg-zinc-200 text-zinc-900 shadow-sm ring-1 ring-zinc-300' : 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-900') 
        : (isDark ? 'text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800')}
    `}
  >
    {children}
  </button>
);

const Divider = ({ isDark }) => (
  <div className={`mx-1 h-4 w-px shrink-0 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />
);

const getEditorClasses = (isDark) => {
  const classes = `prose max-w-none min-h-[160px] py-4 text-[15px] leading-relaxed outline-none prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-blue-600 prose-code:before:content-none prose-code:after:content-none ${isDark ? "text-zinc-200 prose-invert prose-code:bg-zinc-800 prose-code:text-blue-400" : "text-zinc-800"}`;
  return classes.replace(/\s+/g, " ").trim();
};

const RichEditor = ({ content = "", onChange, placeholder = "Start writing...", maxChars = 5000, seamless = false }) => {
  const { isDark } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "tiptap-empty relative before:content-[attr(data-placeholder)] before:absolute before:text-zinc-400 before:opacity-60 before:pointer-events-none",
      }),
      CharacterCount.configure({ limit: maxChars }),
    ],
    content,
    editorProps: {
      attributes: {
        class: getEditorClasses(isDark),
      },
    },
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()); },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: getEditorClasses(isDark),
        },
      },
    });
  }, [editor, isDark]);

  useEffect(() => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    if (content !== currentContent) {
      if (content === "" && currentContent === "<p></p>") return;
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return (
    <div className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white"}`}>
      <div className={`h-10 border-b ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"}`} />
      <div className="px-5 py-4 min-h-[160px]">
        <div className={`h-4 w-3/4 rounded animate-pulse mb-3 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`} />
        <div className={`h-4 w-1/2 rounded animate-pulse ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`} />
      </div>
    </div>
  );
  const chars = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className={`transition-all ${
      seamless 
        ? "w-full" 
        : `overflow-hidden rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white"}`
    }`}>
      <div className={`flex flex-wrap items-center gap-1 p-2 ${
        seamless 
          ? "border-b border-zinc-200 dark:border-zinc-800 bg-transparent mb-4 opacity-50 hover:opacity-100 transition-opacity" 
          : `border-b ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"}`
      }`}>
        <ToolBtn isDark={isDark} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold size={15} /></ToolBtn>
        <ToolBtn isDark={isDark} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic size={15} /></ToolBtn>
        <ToolBtn isDark={isDark} title="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}><Code size={15} /></ToolBtn>
        <Divider isDark={isDark} />
        <ToolBtn isDark={isDark} title="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 size={15} /></ToolBtn>
        <ToolBtn isDark={isDark} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List size={15} /></ToolBtn>
        <ToolBtn isDark={isDark} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered size={15} /></ToolBtn>
        <Divider isDark={isDark} />
        <ToolBtn isDark={isDark} title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><RotateCcw size={15} /></ToolBtn>
        <ToolBtn isDark={isDark} title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><RotateCw size={15} /></ToolBtn>
        <div className={`ml-auto text-xs tabular-nums px-2 ${chars >= maxChars * 0.9 ? "text-red-500" : "text-zinc-500"}`}>
          {chars}/{maxChars}
        </div>
      </div>
      <div className={`scroll-smooth ${seamless ? "min-h-[50vh] pb-32" : "px-5 max-h-[40vh] overflow-y-auto"}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichEditor;
