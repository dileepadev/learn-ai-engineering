import { afterEach, describe, expect, it } from "vitest";
import {
  isHorizontallyScrollable,
  isSearchShortcut,
  isTypingTarget,
  shouldHandleArrowNavigation,
  shouldHandlePlainShortcut,
} from "./keys.ts";

/** Dispatch a real keydown on `target` and hand back the event the listener saw. */
function press(target: Element, init: KeyboardEventInit): KeyboardEvent {
  let seen: KeyboardEvent | undefined;
  const listener = (event: Event): void => {
    seen = event as KeyboardEvent;
  };
  document.addEventListener("keydown", listener);
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
  document.removeEventListener("keydown", listener);
  if (!seen) throw new Error("keydown never reached the document");
  return seen;
}

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isTypingTarget", () => {
  it("treats form fields and editable regions as typing", () => {
    mount(`
      <input id="i"><textarea id="t"></textarea><select id="s"></select>
      <div contenteditable="true"><span id="inside">x</span></div>
    `);
    for (const id of ["i", "t", "s", "inside"]) {
      expect(isTypingTarget(document.getElementById(id))).toBe(true);
    }
  });

  it("treats the CodeMirror wrapper as typing even when focus is not on the content", () => {
    mount(`<div class="cm-editor"><div id="gutter">1</div></div>`);
    expect(isTypingTarget(document.getElementById("gutter"))).toBe(true);
  });

  it("does not treat ordinary page content, or contenteditable=false, as typing", () => {
    mount(`<p id="p">Hi</p><div contenteditable="false"><b id="b">no</b></div>`);
    expect(isTypingTarget(document.getElementById("p"))).toBe(false);
    expect(isTypingTarget(document.getElementById("b"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("shouldHandlePlainShortcut", () => {
  it("fires on page content, including Shift for `?`", () => {
    const body = mount(`<p>lesson</p>`);
    expect(shouldHandlePlainShortcut(press(body, { key: "/" }))).toBe(true);
    expect(shouldHandlePlainShortcut(press(body, { key: "?", shiftKey: true }))).toBe(true);
  });

  it("stays out of the way while typing", () => {
    mount(`<div class="cm-editor"><div id="code" contenteditable="true"></div></div>`);
    const code = document.getElementById("code")!;
    expect(shouldHandlePlainShortcut(press(code, { key: "/" }))).toBe(false);
  });

  it("never claims browser or OS combinations", () => {
    const body = mount(`<p>lesson</p>`);
    expect(shouldHandlePlainShortcut(press(body, { key: "/", ctrlKey: true }))).toBe(false);
    expect(shouldHandlePlainShortcut(press(body, { key: "/", metaKey: true }))).toBe(false);
    expect(shouldHandlePlainShortcut(press(body, { key: "/", altKey: true }))).toBe(false);
  });

  it("yields to an open dialog", () => {
    mount(`<dialog open><p id="in">x</p></dialog>`);
    expect(shouldHandlePlainShortcut(press(document.body, { key: "?" }))).toBe(false);
  });
});

describe("shouldHandleArrowNavigation", () => {
  it("handles bare left and right arrows only", () => {
    const body = mount(`<p>lesson</p>`);
    expect(shouldHandleArrowNavigation(press(body, { key: "ArrowRight" }))).toBe(true);
    expect(shouldHandleArrowNavigation(press(body, { key: "ArrowLeft" }))).toBe(true);
    expect(shouldHandleArrowNavigation(press(body, { key: "ArrowUp" }))).toBe(false);
    // Shift+Arrow extends a text selection; it must keep doing that.
    expect(shouldHandleArrowNavigation(press(body, { key: "ArrowRight", shiftKey: true }))).toBe(
      false,
    );
  });

  it("does not move pages from inside the drill editor", () => {
    mount(`<div class="cm-editor"><div id="code" contenteditable="true"></div></div>`);
    const code = document.getElementById("code")!;
    expect(shouldHandleArrowNavigation(press(code, { key: "ArrowRight" }))).toBe(false);
  });

  it("leaves arrows to a focused block that scrolls sideways", () => {
    mount(`<pre id="wide" tabindex="0">a very long line</pre>`);
    const wide = document.getElementById("wide")!;
    // jsdom does no layout, so give the block the dimensions a browser would.
    Object.defineProperty(wide, "scrollWidth", { configurable: true, value: 900 });
    Object.defineProperty(wide, "clientWidth", { configurable: true, value: 300 });
    wide.focus();
    expect(isHorizontallyScrollable(wide)).toBe(true);
    expect(shouldHandleArrowNavigation(press(wide, { key: "ArrowRight" }))).toBe(false);
  });
});

describe("isSearchShortcut", () => {
  it("accepts Ctrl+K and ⌘K, in either case", () => {
    const body = mount(`<p>x</p>`);
    expect(isSearchShortcut(press(body, { key: "k", ctrlKey: true }))).toBe(true);
    expect(isSearchShortcut(press(body, { key: "K", metaKey: true }))).toBe(true);
  });

  it("works from a text field, but not from the drill editor", () => {
    mount(`<input id="i"><div class="cm-editor"><div id="code" contenteditable="true"></div></div>`);
    expect(isSearchShortcut(press(document.getElementById("i")!, { key: "k", ctrlKey: true }))).toBe(
      true,
    );
    expect(
      isSearchShortcut(press(document.getElementById("code")!, { key: "k", ctrlKey: true })),
    ).toBe(false);
  });

  it("rejects a bare k and other modifier mixes", () => {
    const body = mount(`<p>x</p>`);
    expect(isSearchShortcut(press(body, { key: "k" }))).toBe(false);
    expect(isSearchShortcut(press(body, { key: "k", ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isSearchShortcut(press(body, { key: "k", ctrlKey: true, altKey: true }))).toBe(false);
  });
});
