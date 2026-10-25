<script>
  import { sectionIndex } from "#lib/render.js";
  import { scrollSpy } from "#lib/actions/scrollSpy.js";
  import ThemeToggle from "./ThemeToggle.svelte";

  let { sections } = $props();
</script>

<div class="nav-bar">
  <nav class="navigation" aria-label="Sections" use:scrollSpy>
    <ol class="nav-list">
      {#each sections as s, i (s.section)}
        <li><a class="nav-link" href="#{s.section}"><span class="nav-index" aria-hidden="true">{sectionIndex(i)}</span><span class="nav-line" aria-hidden="true"></span><span class="nav-label">{s.title}</span></a></li>
      {/each}
    </ol>
  </nav>
  <ThemeToggle />
</div>
