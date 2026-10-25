<script>
  import ChangelogModal from "./ChangelogModal.svelte";

  let { site } = $props();
  let changelogOpen = $state(false);

  // Without JavaScript, or on a modified click (new tab), the link opens the changelog page
  function openChangelog(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    changelogOpen = true;
  }
</script>

<footer class="site-footer">
  <p>Built with SvelteKit and SCSS, and prerendered from JSON into plain HTML.
    <a href={site.sourceUrl} target="_blank" rel="noopener noreferrer">View source<span class="visually-hidden">{" (opens in a new tab)"}</span></a>
    &middot; <a href="/changelog" aria-haspopup="dialog" onclick={openChangelog}>Changelog</a></p>
  <p>&copy; {site.name}</p>
</footer>

<ChangelogModal bind:open={changelogOpen} />
