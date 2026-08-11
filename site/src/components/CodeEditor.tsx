import { useEffect, useRef } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import {
  HighlightStyle,
  syntaxHighlighting,
  indentUnit,
  bracketMatching,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * Syntax colours, defined against the site's CSS variables.
 *
 * Using variables rather than two CodeMirror themes means the editor follows the light/
 * dark toggle instantly, with no editor teardown and no second theme bundle.
 */
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--cm-keyword)" },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: "var(--cm-name)" },
  { tag: [tags.function(tags.variableName), tags.labelName], color: "var(--cm-function)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--cm-string)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--cm-number)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: [tags.typeName, tags.className], color: "var(--cm-type)" },
  { tag: tags.operator, color: "var(--cm-operator)" },
  { tag: [tags.propertyName, tags.attributeName], color: "var(--cm-property)" },
  { tag: tags.definition(tags.variableName), color: "var(--cm-name)" },
]);

const theme = EditorView.theme({
  "&": {
    fontSize: "0.855rem",
    backgroundColor: "transparent",
    color: "var(--text)",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    padding: "0.85rem 0",
    caretColor: "var(--accent)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--text-faint)",
    border: "none",
    paddingRight: "0.4rem",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--accent) 7%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-muted)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { lineHeight: "1.62", overflowX: "auto" },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklch, var(--accent) 22%, transparent) !important",
  },
  ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired on Ctrl/Cmd+Enter — the shortcut for "run the tests". */
  onRun?: () => void;
  ariaLabel: string;
}

export function CodeEditor({ value, onChange, onRun, ariaLabel }: CodeEditorProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  // Held in a ref so changing the handler never forces the editor to be rebuilt, which
  // would lose cursor position and undo history mid-edit.
  const handlers = useRef({ onChange, onRun });
  handlers.current = { onChange, onRun };

  useEffect(() => {
    if (!host.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      bracketMatching(),
      highlightActiveLine(),
      python(),
      syntaxHighlighting(highlightStyle),
      // Python is whitespace-significant, so a real 4-space indent unit is not cosmetic.
      indentUnit.of("    "),
      EditorState.tabSize.of(4),
      theme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            handlers.current.onRun?.();
            return true;
          },
        },
        // Tab indents rather than moving focus. Placed after the run binding so the
        // shortcut wins, and Escape still releases focus for keyboard navigation.
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) handlers.current.onChange(update.state.doc.toString());
      }),
    ];

    const instance = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: host.current,
    });
    view.current = instance;

    return () => {
      instance.destroy();
      view.current = null;
    };
    // Built once per mount. External value changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset/solution buttons change `value` from outside. Only touch the document when it
  // genuinely differs, or every keystroke would round-trip and fight the cursor.
  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const current = instance.state.doc.toString();
    if (current === value) return;
    instance.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={host} className="overflow-hidden" />;
}
