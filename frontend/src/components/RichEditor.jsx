import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import {
  List, ListOrdered,
  Heading2, Braces, Heading3, Minus,
  Pilcrow, Plus, Quote, GripVertical,
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

  const moveBlockToPosition = useCallback((fromIndex, gapIndex) => {
    if (!editor) return;
    const { state } = editor;

    const blocks = [];
    state.doc.forEach((node) => blocks.push(node));

    const [moved] = blocks.splice(fromIndex, 1);
    const targetIndex = gapIndex > fromIndex ? gapIndex - 1 : gapIndex;
    blocks.splice(targetIndex, 0, moved);

    const { tr } = state;
    tr.replaceWith(0, state.doc.content.size, blocks);
    editor.view.dispatch(tr.scrollIntoView());

    let pos = 0;
    for (let i = 0; i < targetIndex; i++) pos += tr.doc.child(i).nodeSize;
    editor.commands.setTextSelection(pos + 1);
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

  const handleGripDrag = useCallback((e) => {
    e.preventDefault();
    if (!editor || !editorWrapRef.current) return;

    const { state } = editor;
    const { $from } = state.selection;
    const dragIndex = $from.index(0);
    const wrapperRect = editorWrapRef.current.getBoundingClientRect();

    // gap positions between blocks
    const gaps = [];
    let offset = 0;
    for (let i = 0; i < state.doc.childCount; i++) {
      try {
        const coords = editor.view.coordsAtPos(offset);
        gaps.push(coords.top - wrapperRect.top);
      } catch {
        gaps.push(i * 28);
      }
      offset += state.doc.child(i).nodeSize;
    }
    try {
      const endCoords = editor.view.coordsAtPos(offset);
      gaps.push(endCoords.top - wrapperRect.top);
    } catch {
      gaps.push((gaps[gaps.length - 1] || 0) + 28);
    }

    // drop indicator line
    const line = document.createElement("div");
    line.style.cssText =
      "position:absolute;left:2rem;right:0;height:2px;background:#3b82f6;border-radius:1px;z-index:50;pointer-events:none;display:none;";
    editorWrapRef.current.appendChild(line);

    // ghost preview
    const proseMirror = editorWrapRef.current.querySelector(".ProseMirror");
    const blockDom = proseMirror?.children[dragIndex];
    const ghost = document.createElement("div");
    if (blockDom) {
      ghost.textContent = blockDom.textContent;
      ghost.style.cssText =
        `position:fixed;pointer-events:none;z-index:999;opacity:0.7;
         padding:4px 12px;border-radius:6px;font-size:0.95rem;max-width:320px;
         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
         background:${document.documentElement.classList.contains("dark") ? "#27272a" : "#f4f4f5"};
         color:${document.documentElement.classList.contains("dark") ? "#e4e4e7" : "#18181b"};
         box-shadow:0 4px 12px rgba(0,0,0,0.15);display:none;`;
    }
    document.body.appendChild(ghost);


    if (blockDom) blockDom.style.opacity = "0.35";

    let targetGap = dragIndex;

    const onPointerMove = (moveEvent) => {

      ghost.style.display = "block";
      ghost.style.left = `${moveEvent.clientX + 12}px`;
      ghost.style.top = `${moveEvent.clientY - 14}px`;

      const pointerY = moveEvent.clientY - wrapperRect.top;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < gaps.length; i++) {
        const dist = Math.abs(pointerY - gaps[i]);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      targetGap = closest;

      if (closest === dragIndex || closest === dragIndex + 1) {
        line.style.display = "none";
      } else {
        line.style.display = "block";
        line.style.top = `${gaps[closest]}px`;
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      line.remove();
      ghost.remove();
      if (blockDom) blockDom.style.opacity = "";

      if (targetGap !== dragIndex && targetGap !== dragIndex + 1) {
        moveBlockToPosition(dragIndex, targetGap);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [editor, moveBlockToPosition]);

  const handleEditorAreaClick = (event) => {
    if (!editor) return;
    if (event.target.closest(".ProseMirror")) return;
    if (event.target.closest("button")) return;

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
      requestAnimationFrame(updateBlockMenuPosition);
    };
    const handleBlur = () => {
      window.setTimeout(() => {
        if (!editorWrapRef.current?.contains(document.activeElement)) {
          setBlockMenu((current) => ({ ...current, visible: false, open: false }));
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
  }, [editor, updateBlockMenuPosition]);

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
        className="relative min-h-[50vh] cursor-text scroll-smooth pb-28 pl-16 sm:pb-32 sm:pl-20"
      >
        {blockMenu.visible ? (
          <div
            className="absolute z-20 flex items-center gap-2"
            style={{ top: `${blockMenu.top}px`, left: "-2px" }}
          >
            <button
              type="button"
              title="Add block"
              aria-label="Add block"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setBlockMenu((current) => ({ ...current, open: !current.open }))}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                isDark
                  ? "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              }`}
            >
              <Plus size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              onPointerDown={handleGripDrag}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-all cursor-grab active:cursor-grabbing ${
                isDark
                  ? "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              }`}
            >
              <GripVertical size={18} strokeWidth={2} />
            </button>

            {blockMenu.open ? (
              <div
                className={`absolute left-0 top-full mt-2 max-h-[60vh] w-[min(16rem,calc(100vw-4rem))] overflow-y-auto rounded-lg border p-1.5 shadow-2xl ${
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
