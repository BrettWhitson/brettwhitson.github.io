<script>
  import { onMount } from "svelte";
  import { parallax } from "#lib/actions/parallax.js";

  let backdrop = $state();
  let progress = $state();

  onMount(() => parallax({ backdrop, progress }));
</script>

<!-- Decorative backdrop; its layers move at different speeds as the page scrolls -->
<div class="backdrop" aria-hidden="true" bind:this={backdrop}>
  <div class="backdrop-grid"></div>
  <div class="backdrop-glow glow-1"></div>
  <div class="backdrop-glow glow-2"></div>
  <div class="backdrop-glow glow-3"></div>
</div>
<div class="scroll-progress" aria-hidden="true" bind:this={progress}></div>
