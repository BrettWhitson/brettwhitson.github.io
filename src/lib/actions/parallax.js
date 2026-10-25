import { motionOk } from "./motion.js";
import { guard } from "./guard.js";

/**
 * Parallax - Drives the backdrop layers and the reading-progress line from scroll position
 *
 * One passive scroll listener, throttled to animation frames, writes two custom properties;
 * the layers' own CSS decides how fast each one moves. The backdrop stays still under
 * reduced motion, but the progress line still tracks.
 *
 * @param {{ backdrop?: HTMLElement | null, progress?: HTMLElement | null }} elements
 * @returns {() => void} Removes the listeners
 */
function parallax({ backdrop, progress }) {
  if (!backdrop && !progress) return () => {};
  const moveBackdrop = motionOk();
  let pending = false;
  let raf;

  const update = () => {
    pending = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (moveBackdrop && backdrop) backdrop.style.setProperty("--scroll-y", y.toFixed(1));
    if (progress) progress.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();

  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(raf);
  };
}

const guarded = guard("parallax", parallax);
export { guarded as parallax };
