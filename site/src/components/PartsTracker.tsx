import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { setPart, setParts } from "../lib/progress.ts";
import { useHydrated, useProgress } from "../lib/useProgress.ts";

export interface PartRef {
  key: string;
  section: string;
  sectionTitle: string;
}

interface SectionMount {
  section: string;
  title: string;
  keys: string[];
  element: HTMLElement;
}

/**
 * Brings a phase page's inline part checkboxes to life.
 *
 * The checkboxes are already in the static HTML — the loader turned every list item into a
 * task item and stamped each box with `data-part` (see `lib/parts.ts`). They ship
 * `disabled`, so a page whose JavaScript never runs shows the checklist but never pretends
 * to save. This island finds them, enables them, keeps them in step with the progress store
 * (other tabs included), and adds a "Mark section done" control under each section's
 * heading — the fast path for someone who already knows a block of material.
 *
 * Enhancing existing markup, rather than re-rendering the prose in React, keeps the page's
 * reading content as plain server-rendered HTML: fast, indexable, and identical to what the
 * markdown says.
 */
export function PartsTracker({ parts }: { parts: PartRef[] }) {
  const state = useProgress();
  const hydrated = useHydrated();
  const [boxes, setBoxes] = useState<HTMLInputElement[]>([]);
  const [sections, setSections] = useState<SectionMount[]>([]);

  useEffect(() => {
    const known = new Set(parts.map((part) => part.key));
    const found = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-part]")).filter(
      (box) => known.has(box.dataset.part ?? ""),
    );

    const onChange = (event: Event): void => {
      const box = event.currentTarget as HTMLInputElement;
      const key = box.dataset.part;
      if (key) setPart(key, box.checked);
    };
    for (const box of found) {
      box.disabled = false;
      box.addEventListener("change", onChange);
    }

    // One control per section, placed directly under the heading its list belongs to.
    const bySection = new Map<string, PartRef[]>();
    for (const part of parts) {
      const group = bySection.get(part.section) ?? [];
      group.push(part);
      bySection.set(part.section, group);
    }

    const mounts: SectionMount[] = [];
    for (const [section, group] of bySection) {
      const firstBox = found.find((box) => box.dataset.section === section);
      const heading = firstBox ? headingFor(firstBox) : null;
      if (!heading) continue;
      const element = document.createElement("div");
      element.className = "part-section-bar";
      heading.insertAdjacentElement("afterend", element);
      mounts.push({
        section,
        title: group[0]!.sectionTitle,
        keys: group.map((part) => part.key),
        element,
      });
    }

    setBoxes(found);
    setSections(mounts);

    return () => {
      for (const box of found) {
        box.removeEventListener("change", onChange);
        box.disabled = true;
      }
      for (const mount of mounts) mount.element.remove();
    };
  }, [parts]);

  // The store is the source of truth; the DOM boxes only mirror it.
  useEffect(() => {
    for (const box of boxes) box.checked = Boolean(state.parts[box.dataset.part ?? ""]);
  }, [boxes, state]);

  if (!hydrated) return null;

  return (
    <>
      {sections.map((mount) =>
        createPortal(
          <SectionControl title={mount.title} keys={mount.keys} ticked={state.parts} />,
          mount.element,
          mount.section,
        ),
      )}
    </>
  );
}

/** The nearest H2/H3 above a checkbox's list. */
function headingFor(box: HTMLElement): HTMLElement | null {
  let sibling = box.closest("ul, ol")?.previousElementSibling ?? null;
  while (sibling) {
    if (sibling.tagName === "H2" || sibling.tagName === "H3") return sibling as HTMLElement;
    sibling = sibling.previousElementSibling;
  }
  return null;
}

function SectionControl({
  title,
  keys,
  ticked,
}: {
  title: string;
  keys: string[];
  ticked: Record<string, boolean>;
}) {
  const done = keys.filter((key) => ticked[key]).length;
  const complete = done === keys.length;

  return (
    <div className="-mt-2 flex items-center gap-3 text-xs text-muted">
      <span className="tabular-nums">
        {done}/{keys.length} done
      </span>
      <button
        type="button"
        onClick={() => setParts(keys, !complete)}
        className="rounded-md border border-line px-2 py-0.5 font-medium transition-colors hover:border-line-strong hover:text-ink"
        aria-label={`${complete ? "Clear every part in" : "Mark every part done in"} ${title}`}
      >
        {complete ? "Clear section" : "Mark section done"}
      </button>
    </div>
  );
}
