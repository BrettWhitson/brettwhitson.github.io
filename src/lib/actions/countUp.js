import { motionOk } from "./motion.js";
import { guard } from "./guard.js";

/**
 * CountUp - Counts the stats inside `node` up from zero the first time their section is revealed
 *
 * The real numbers are in the HTML; this only animates to them, ends on the exact server text,
 * and does nothing under reduced motion.
 *
 * @type {import("svelte/action").Action<HTMLElement, { selector?: string, duration?: number } | undefined>}
 */
function countUp(node, { selector = ".stat dd", duration = 1100 } = {}) {
  const numbers = [...node.querySelectorAll(selector)].filter((el) => /^\d+$/.test(el.textContent.trim()));
  if (!numbers.length || !motionOk()) return;
  const section = node.closest(".reveal");
  if (!section) return;

  const originals = numbers.map((el) => el.textContent);
  const targets = originals.map(Number);
  // Write to the existing text node rather than replacing it, so Svelte's reference stays valid
  const write = (el, text) => {
    if (el.firstChild?.nodeType === Node.TEXT_NODE && el.childNodes.length === 1) el.firstChild.nodeValue = text;
    else el.textContent = text;
  };

  let raf;
  const run = () => {
    const start = performance.now();
    // Ease out so the numbers settle rather than stop dead
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      numbers.forEach((el, i) => write(el, t < 1 ? String(Math.round(targets[i] * ease(t))) : originals[i]));
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };

  section.addEventListener("reveal", run, { once: true });

  return {
    destroy() {
      section.removeEventListener("reveal", run);
      cancelAnimationFrame(raf);
      numbers.forEach((el, i) => write(el, originals[i]));
    },
  };
}

const guarded = guard("countUp", countUp);
export { guarded as countUp };
