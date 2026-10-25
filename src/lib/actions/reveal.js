import { guard } from "./guard.js";

/**
 * Reveal - Adds `is-visible` to an element as it scrolls into view, once, and dispatches a
 * `reveal` event on it
 *
 * The CSS only hides `.reveal` elements when <html> has `motion-ok`, which the head script
 * sets when JavaScript runs and reduced motion isn't requested.
 *
 * Reveal once an element's top passes 10% above the bottom edge. A margin rather than an area
 * threshold, because a section several screens tall can never have a fixed fraction of itself
 * visible.
 */
const ROOT_MARGIN = "0px 0px -10% 0px";

// One observer shared by every revealed element
const callbacks = new Map();
let observer = null;

function observe(node, callback) {
  observer ??= new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          const run = callbacks.get(entry.target);
          unobserve(entry.target);
          run?.();
        });
    },
    { threshold: 0, rootMargin: ROOT_MARGIN }
  );
  callbacks.set(node, callback);
  observer.observe(node);
}

function unobserve(node) {
  if (!callbacks.delete(node)) return;
  observer.unobserve(node);
  if (!callbacks.size) {
    observer.disconnect();
    observer = null;
  }
}

/** @type {import("svelte/action").Action<HTMLElement>} */
function reveal(node) {
  // Number the children of stagger lists so CSS can delay each one; long lists cap out
  // so the last items don't lag seconds behind
  node.querySelectorAll("[data-stagger]").forEach((list) => {
    [...list.children].forEach((child, i) => child.style.setProperty("--i", Math.min(i, 8)));
  });

  let timer;
  let cancelled = false;
  const show = () => {
    if (cancelled) return;
    node.classList.add("is-visible");
    node.dispatchEvent(new CustomEvent("reveal"));
    // After the entrance, drop the stagger delay so hover feedback is immediate
    timer = setTimeout(() => node.querySelectorAll("[data-stagger]").forEach((list) => list.classList.add("is-settled")), 1400);
  };

  // Without an observer, reveal right away, but after every component's actions have attached
  // their `reveal` listeners
  if ("IntersectionObserver" in window) observe(node, show);
  else queueMicrotask(show);

  return {
    destroy() {
      cancelled = true;
      clearTimeout(timer);
      if (observer) unobserve(node);
    },
  };
}

// If setup fails, show what the animation would have revealed
const guarded = guard("reveal", reveal, (node) => node.classList.add("is-visible"));
export { guarded as reveal };
