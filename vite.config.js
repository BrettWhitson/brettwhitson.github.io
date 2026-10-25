import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-static";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // SvelteKit 3 takes its config here; svelte.config.js is no longer read
    sveltekit({
      // No fallback page: every route is prerendered, so there is no SPA shell for crawlers to hit
      adapter: adapter({ pages: "build", assets: "build", fallback: undefined, strict: true }),
      // changelog.json is only fetched by script, so the crawler can't discover it from a link
      prerender: { entries: ["*", "/changelog.json"], handleHttpError: "fail", handleMissingId: "fail" },
    }),
  ],
  css: {
    preprocessorOptions: {
      // The partials still use @import; silence the deprecation warnings until they move to @use
      scss: { silenceDeprecations: ["import", "global-builtin"] },
    },
  },
});
