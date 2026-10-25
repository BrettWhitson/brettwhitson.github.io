import { guard } from "./guard.js";

/**
 * ScrollSpy - Marks the nav link for the section currently being read
 *
 * A section counts as current while it crosses a thin band just below the sticky header.
 * On phones the nav scrolls sideways, so the active link is also kept in view.
 *
 * Use on the element that contains the links.
 *
 * @type {import("svelte/action").Action<HTMLElement, { linkSelector?: string, activeClass?: string } | undefined>}
 */
function scrollSpy(node, { linkSelector = ".nav-link", activeClass = "active" } = {}) {
  const links = new Map(
    [...node.querySelectorAll(linkSelector)]
      .map((link) => [document.getElementById(link.hash.slice(1)), link])
      .filter(([section]) => section)
  );
  if (!links.size || !("IntersectionObserver" in window)) return;

  let current = null;
  let pinned = null;

  /** @param {Element} section - A tracked section, or any other element to clear the highlight */
  const setActive = (section) => {
    if (section === current) return;
    current = section;

    links.forEach((link, s) => {
      const active = s === section;
      link.classList.toggle(activeClass, active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    // Keep the active tab visible in the horizontally scrolling mobile nav, without moving the page
    const link = links.get(section);
    const nav = link?.closest(".navigation");
    if (nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
    }
  };

  /** @returns {boolean} Whether the page is scrolled to the end (and the last section was made active) */
  const checkBottom = () => {
    if (pinned) return false;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) setActive([...links.keys()].at(-1));
    return atBottom;
  };

  // On narrow screens the intro scrolls above the first section, and nothing is active while
  // it's being read. On wide screens it sits in the sticky sidebar and is always in view.
  const intro = document.querySelector(".intro");
  const introInFlow = window.matchMedia("(max-width: 1023px)");

  // The band sits 25-35% down the viewport, below the header on any screen
  const observer = new IntersectionObserver(
    (entries) => {
      if (pinned || checkBottom()) return;
      const entry = entries.filter((e) => e.isIntersecting && (e.target !== intro || introInFlow.matches)).at(-1);
      if (entry) setActive(entry.target);
    },
    { rootMargin: "-25% 0px -65% 0px" }
  );
  links.forEach((_, section) => observer.observe(section));
  if (intro) observer.observe(intro);

  // The last section is often too short to reach the band before the page ends
  const onScroll = () => checkBottom();
  window.addEventListener("scroll", onScroll, { passive: true });

  // A clicked link stays active through the jump, even for a section near the end of the
  // page that can't scroll up to the band; the visitor's own scrolling hands control back
  const clicks = [...links].map(([section, link]) => {
    const onClick = () => {
      pinned = section;
      setActive(section);
    };
    link.addEventListener("click", onClick);
    return () => link.removeEventListener("click", onClick);
  });
  const unpin = () => (pinned = null);
  const UNPIN_EVENTS = ["wheel", "touchstart", "keydown"];
  UNPIN_EVENTS.forEach((type) => window.addEventListener(type, unpin, { passive: true }));

  return {
    destroy() {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      clicks.forEach((off) => off());
      UNPIN_EVENTS.forEach((type) => window.removeEventListener(type, unpin));
    },
  };
}

const guarded = guard("scrollSpy", scrollSpy);
export { guarded as scrollSpy };
