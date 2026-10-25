<script>
  import { onMount } from "svelte";
  import "../../styles/scss/styles.scss";

  let { children } = $props();

  // Tells the head script in app.html that the app loaded, so it keeps the motion classes.
  // Set once hydration has finished, so a page that fails to
  // hydrate still falls back to fully visible content after 4s.
  onMount(() => document.documentElement.classList.add("js-ready"));
</script>

{@render children()}
