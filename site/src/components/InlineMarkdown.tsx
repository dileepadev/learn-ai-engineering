import type { ReactNode } from "react";

/**
 * Renders the small subset of markdown that appears inside single-line strings.
 *
 * Exit criteria and drill labels are pulled straight out of markdown, so they arrive with
 * `` `code` `` and `**bold**` still in them. Those strings never reach a markdown
 * pipeline — they are React props — so without this, a criterion reads
 * "`termchat` is complete" with the backticks visible.
 *
 * Deliberately not a markdown parser: only inline code and bold, no links or nesting.
 * Anything richer belongs in the markdown files, which are rendered properly.
 */

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*)/g;

export function InlineMarkdown({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN).filter((part) => part !== "");

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded border border-line bg-sunken px-1 py-0.5 font-mono text-[0.85em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
