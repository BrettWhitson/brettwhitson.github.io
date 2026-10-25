<script>
  let { site } = $props();
</script>

<footer class="site-footer">
  <p>Built with SvelteKit and SCSS, and prerendered from JSON into plain HTML.
    <a href={site.sourceUrl} target="_blank" rel="noopener noreferrer">View source<span class="visually-hidden">{" (opens in a new tab)"}</span></a></p>
  <p>&copy; {site.name}</p>
</footer>
