import { motionOk } from "./motion.js";
import { guard } from "./guard.js";

/**
 * QueryTyper - Types out the intro's SQL once, then "runs" it to reveal the result rows
 *
 * Untyped characters stay in the DOM as transparent text, so the box is laid out at its
 * final size from the start and nothing below it moves. Skipped under reduced motion. The
 * text is already in the server HTML; this only hides and re-shows it.
 *
 * Use on the `.query` figure.
 *
 * @type {import("svelte/action").Action<HTMLElement, { duration?: number, delay?: number } | undefined>}
 *   duration: milliseconds to type the whole query; delay: wait for the intro entrance to bring
 *   the box in first
 */
function queryTyper(figure, { duration = 900, delay = 550 } = {}) {
  const code = figure.querySelector("code");
  if (!code) return;
  if (!motionOk()) {
    figure.classList.add("is-run");
    return;
  }

  // Split every text node into a typed part and a transparent "ghost" part. This replaces text
  // nodes the {@html} block rendered, which is safe only because the query never re-renders.
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const parts = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) parts.push(node);

  const segments = parts.map((node) => {
    const typed = document.createTextNode("");
    const ghost = document.createElement("span");
    ghost.className = "ghost";
    ghost.textContent = node.textContent;
    node.replaceWith(typed, ghost);
    return { typed, ghost, text: ghost.textContent };
  });
  const total = segments.reduce((sum, s) => sum + s.text.length, 0);
  figure.classList.add("is-typing");

  const caret = document.createElement("span");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");

  let start = null;
  let raf;
  let timer;

  const frame = (time) => {
    start ??= time;
    const progress = Math.min(1, (time - start) / duration);
    let remaining = Math.round(progress * total);

    let caretPlaced = false;
    for (const segment of segments) {
      const shown = Math.min(segment.text.length, remaining);
      remaining -= shown;
      segment.typed.textContent = segment.text.slice(0, shown);
      segment.ghost.textContent = segment.text.slice(shown);
      // Caret sits at the first character not yet typed
      if (!caretPlaced && shown < segment.text.length) {
        segment.ghost.before(caret);
        caretPlaced = true;
      }
    }

    if (progress < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      code.append(caret);
      timer = setTimeout(() => {
        caret.remove();
        figure.classList.add("is-run");
      }, 250);
    }
  };

  timer = setTimeout(() => (raf = requestAnimationFrame(frame)), delay);

  return {
    destroy() {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      caret.remove();
    },
  };
}

// If setup fails, show what the animation would have revealed
const guarded = guard("queryTyper", queryTyper, (figure) => figure.classList.add("is-run"));
export { guarded as queryTyper };
