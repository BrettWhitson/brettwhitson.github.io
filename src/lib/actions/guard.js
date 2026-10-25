/**
 * Wraps an enhancement so a failure only loses that enhancement. An error thrown during
 * hydration would otherwise make SvelteKit replace the whole prerendered page with its error
 * page instead of leaving the static content in place.
 *
 * @template {(...args: any[]) => any} T
 * @param {string} name for the error log (function names don't survive minification)
 * @param {T} enhance an action, or any setup function that may return a cleanup or { update, destroy }
 * @param {(...args: Parameters<T>) => void} [fallback] runs if setup throws, e.g. to show content the
 *   enhancement would have revealed
 * @returns {T}
 */
export function guard(name, enhance, fallback) {
  const attempt = (fn, ...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(`${name} failed:`, error);
    }
  };

  return /** @type {T} */ ((...args) => {
    let failed = true;
    const result = attempt((...a) => {
      const value = enhance(...a);
      failed = false;
      return value;
    }, ...args);
    if (failed && fallback) attempt(fallback, ...args);
    if (typeof result === "function") return () => attempt(result);
    if (!result) return result;
    return {
      update: result.update && ((params) => attempt(result.update, params)),
      destroy: result.destroy && (() => attempt(result.destroy)),
    };
  });
}
