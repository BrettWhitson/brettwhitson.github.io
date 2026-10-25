/**
 * @fileoverview Connects each skill to the roles where it was used.
 * Hovering or focusing a skill chip highlights every chip for that skill and
 * the roles that list it, and dims the rest; tapping or pressing Enter pins the highlight (touch
 * has no hover). A status line under the skills table spells the connection out in words.
 */

import { guard } from "./guard.js";
const HINT = "Hover or tap a skill to see where I've used it.";

/**
 * Svelte action for the element that gets `is-linking` while a skill is shown (main#content).
 * @param {HTMLElement} root
 */
function skillLinks(root) {
  const status = document.querySelector(".skills-status");
  const chips = [...root.querySelectorAll(".chip[data-skill]")];
  const roles = [...root.querySelectorAll(".list-item-role[data-skills]")];
  if (!chips.length) return;

  let pinned = null;

  function show(key) {
    const linkedRoles = roles.filter((role) => role.dataset.skills.split(" ").includes(key));

    root.classList.add("is-linking");
    chips.forEach((chip) => {
      const linked = chip.dataset.skill === key;
      chip.classList.toggle("is-linked", linked);
      chip.setAttribute("aria-pressed", String(linked && pinned === key));
    });
    roles.forEach((role) => role.classList.toggle("is-linked", linkedRoles.includes(role)));

    if (status) {
      const name = chips.find((chip) => chip.dataset.skill === key).textContent;
      const titles = linkedRoles.map((role) => role.querySelector(".list-item-role-title").textContent);
      status.textContent = titles.length ? `-- ${name}: ${titles.join("; ")}` : `-- ${name}: coursework and side projects`;
    }
  }

  function clear() {
    root.classList.remove("is-linking");
    chips.forEach((chip) => {
      chip.classList.remove("is-linked");
      chip.setAttribute("aria-pressed", "false");
    });
    roles.forEach((role) => role.classList.remove("is-linked"));
    if (status) status.textContent = HINT;
  }

  function unpin() {
    pinned = null;
    clear();
  }

  function toggle(key, chip) {
    if (pinned === key) {
      unpin();
      // Still hovered or focused: fall back to the preview instead of going blank
      if (chip.matches(":hover") || chip === document.activeElement) show(key);
    } else {
      pinned = key;
      show(key);
    }
  }

  const cleanups = chips.map((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-pressed", "false");

    const key = chip.dataset.skill;
    const preview = () => pinned || show(key);
    const leave = () => pinned || clear();
    const onClick = () => toggle(key, chip);
    const onKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle(key, chip);
      } else if (event.key === "Escape") {
        unpin();
      }
    };

    const listeners = [
      ["mouseenter", preview],
      ["mouseleave", leave],
      ["focus", preview],
      ["blur", leave],
      ["click", onClick],
      ["keydown", onKeydown],
    ];
    listeners.forEach(([type, fn]) => chip.addEventListener(type, fn));
    return () => listeners.forEach(([type, fn]) => chip.removeEventListener(type, fn));
  });

  // Clicking anywhere else releases a pinned highlight
  const onDocumentClick = (event) => {
    if (pinned && !event.target.closest(".chip")) unpin();
  };
  document.addEventListener("click", onDocumentClick);

  if (status) {
    status.hidden = false;
    status.textContent = HINT;
  }

  return {
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      document.removeEventListener("click", onDocumentClick);
    },
  };
}

const guarded = guard("skillLinks", skillLinks);
export { guarded as skillLinks };
