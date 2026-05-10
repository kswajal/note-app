import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import {
  Bold, Italic, List, ListOrdered,
  Heading2, Braces, Heading3, Minus,
  Pilcrow, Plus, Quote,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const NotionKeyboardShortcuts = Extension.create({
  name: "notionKeyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          return editor.commands.insertContent("\t");
        }

        if (editor.isActive("listItem")) {
          return editor.commands.sinkListItem("listItem");
        }

        return false;
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          return true;
        }

        if (editor.isActive("listItem")) {
          return editor.commands.liftListItem("listItem");
        }

        return false;
      },
    };
  },
});

const getEditorClasses = (isDark) => {
  const classes = `notion-editor min-h-[160px] py-2 outline-none ${isDark ? "notion-editor-dark" : ""}`;
  return classes.replace(/\s+/g, " ").trim();
};

const RichEditor = ({ content = "", onChange, placeholder = "Start writing..." }) => {
  const { isDark } = useTheme();
  const editorWrapRef = useRef(null);
  const [blockMenu, setBlockMenu] = useState({ open: false, visible: false, top: 16 });
  const [inlineMenu, setInlineMenu] = useState({ visible: false, top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "tiptap-empty relative before:content-[attr(data-placeholder)] before:absolute before:text-zinc-400 before:opacity-60 before:pointer-events-none",
      }),
      NotionKeyboardShortcuts,
    ],
    content,
    editorProps: {
      attributes: {
        class: getEditorClasses(isDark),
        spellCheck: "false",
      },
    },
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()); },
  });

  const updateBlockMenuPosition = useCallback(() => {
    if (!editor || !editorWrapRef.current || !editor.isFocused) {
      setBlockMenu((current) => ({ ...current, visible: false, open: false }));
      return;
    }

    try {
      const coords = editor.view.coordsAtPos(editor.state.selection.from);
      const wrapperRect = editorWrapRef.current.getBoundingClientRect();
      const nextTop = Math.max(8, coords.top - wrapperRect.top - 6);

      setBlockMenu((current) => ({
        ...current,
        visible: true,
        top: nextTop,
      }));
    } catch {
      setBlockMenu((current) => ({ ...current, visible: false, open: false }));
    }
  }, [editor]);

  const updateInlineMenuPosition = useCallback(() => {
    if (!editor || !editorWrapRef.current || !editor.isFocused) {
      setInlineMenu((current) => ({ ...current, visible: false }));
      return;
    }

    const { from, to, empty } = editor.state.selection;
    if (empty) {
      setInlineMenu((current) => ({ ...current, visible: false }));
      return;
    }

    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const wrapperRect = editorWrapRef.current.getBoundingClientRect();
      const selectionCenter = (start.left + end.right) / 2;

      setInlineMenu({
        visible: true,
        top: Math.max(4, start.top - wrapperRect.top - 42),
        left: Math.max(0, selectionCenter - wrapperRect.left - 44),
      });
    } catch {
      setInlineMenu((current) => ({ ...current, visible: false }));
    }
  }, [editor]);

  const blockActions = useMemo(() => ([
    {
      label: "Text",
      hint: "Plain paragraph",
      icon: Pilcrow,
      active: () => editor?.isActive("paragraph"),
      action: () => editor?.chain().focus().setParagraph().run(),
    },
    {
      label: "Bold",
      hint: "Strong text",
      icon: Bold,
      active: () => editor?.isActive("bold"),
      action: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      hint: "Emphasized text",
      icon: Italic,
      active: () => editor?.isActive("italic"),
      action: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading 2",
      hint: "Section title",
      icon: Heading2,
      active: () => editor?.isActive("heading", { level: 2 }),
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      hint: "Small heading",
      icon: Heading3,
      active: () => editor?.isActive("heading", { level: 3 }),
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bullet list",
      hint: "Simple list",
      icon: List,
      active: () => editor?.isActive("bulletList"),
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      hint: "Ordered steps",
      icon: ListOrdered,
      active: () => editor?.isActive("orderedList"),
      action: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      hint: "Callout text",
      icon: Quote,
      active: () => editor?.isActive("blockquote"),
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code block",
      hint: "Code snippet",
      icon: Braces,
      active: () => editor?.isActive("codeBlock"),
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Divider",
      hint: "Horizontal line",
      icon: Minus,
      active: () => false,
      action: () => editor?.chain().focus().setHorizontalRule().run(),
    },
  ]), [editor]);

  const runBlockAction = (action) => {
    action();
    setBlockMenu((current) => ({ ...current, open: false }));
    requestAnimationFrame(updateBlockMenuPosition);
  };

  const handleEditorAreaClick = (event) => {
    if (!editor) return;
    if (event.target.closest(".ProseMirror")) return;

    const lastBlock = editor.state.doc.lastChild;
    const shouldCreateLine = lastBlock && lastBlock.content.size > 0;

    if (shouldCreateLine) {
      editor
        .chain()
        .insertContentAt(editor.state.doc.content.size, { type: "paragraph" })
        .focus("end")
        .run();
      return;
    }

    editor.chain().focus("end").run();
  };

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: getEditorClasses(isDark),
          spellCheck: "false",
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

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      requestAnimationFrame(() => {
        updateBlockMenuPosition();
        updateInlineMenuPosition();
      });
    };
    const handleBlur = () => {
      window.setTimeout(() => {
        if (!editorWrapRef.current?.contains(document.activeElement)) {
          setBlockMenu((current) => ({ ...current, visible: false, open: false }));
          setInlineMenu((current) => ({ ...current, visible: false }));
        }
      }, 100);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("focus", handleUpdate);
    editor.on("transaction", handleUpdate);
    editor.on("blur", handleBlur);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("focus", handleUpdate);
      editor.off("transaction", handleUpdate);
      editor.off("blur", handleBlur);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [editor, updateBlockMenuPosition, updateInlineMenuPosition]);

  if (!editor) return (
    <div className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white"}`}>
      <div className={`h-10 border-b ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"}`} />
      <div className="px-5 py-4 min-h-[160px]">
        <div className={`h-4 w-3/4 rounded animate-pulse mb-3 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`} />
        <div className={`h-4 w-1/2 rounded animate-pulse ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`} />
      </div>
    </div>
  );
  return (
    <div className="w-full transition-all">
      <div
        ref={editorWrapRef}
        onClick={handleEditorAreaClick}
        className="relative min-h-[50vh] cursor-text scroll-smooth pb-28 pl-8 sm:pb-32 sm:pl-10"
      >
        {inlineMenu.visible ? (
          <div
            className={`absolute z-30 flex items-center gap-1 rounded-lg border p-1 shadow-xl ${
              isDark
                ? "border-zinc-700 bg-zinc-900 text-zinc-100 shadow-black/30"
                : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-900/10"
            }`}
            style={{
              top: `${inlineMenu.top}px`,
              left: `min(${inlineMenu.left}px, calc(100% - 96px))`,
            }}
          >
            <button
              type="button"
              title="Bold"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                editor.isActive("bold")
                  ? isDark ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-white"
                  : isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Bold size={15} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              title="Italic"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                editor.isActive("italic")
                  ? isDark ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-white"
                  : isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Italic size={15} strokeWidth={2.5} />
            </button>
          </div>
        ) : null}
        {blockMenu.visible ? (
          <div
            className="absolute z-20"
            style={{ top: `${blockMenu.top}px`, left: "0px" }}
          >
            <button
              type="button"
              title="Add block"
              aria-label="Add block"
              aria-expanded={blockMenu.open}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setBlockMenu((current) => ({ ...current, open: !current.open }))}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                isDark
                  ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <Plus size={16} strokeWidth={2.4} />
            </button>

            {blockMenu.open ? (
              <div
                className={`mt-2 max-h-[60vh] w-[min(16rem,calc(100vw-4rem))] overflow-y-auto rounded-lg border p-1.5 shadow-2xl ${
                  isDark
                    ? "border-zinc-800 bg-[#101012] text-zinc-100 shadow-black/40"
                    : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-900/10"
                }`}
              >
                {blockActions.map(({ label, hint, icon: Icon, active, action }) => (
                  <button
                    key={label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runBlockAction(action)}
                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                      active()
                        ? isDark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-zinc-950"
                        : isDark ? "text-zinc-300 hover:bg-zinc-800/80" : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isDark ? "bg-zinc-900 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate text-xs text-zinc-500">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichEditor;
