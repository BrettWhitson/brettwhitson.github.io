/** @returns {boolean} Whether the head script allowed scripted motion (JS ran, reduced motion not requested) */
export const motionOk = () => document.documentElement.classList.contains("motion-ok");
