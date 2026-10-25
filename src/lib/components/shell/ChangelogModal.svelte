<script>
  let { open = $bindable(false) } = $props();

  /** @type {HTMLDialogElement} */
  let dialog;
  let html = $state("");
  let failed = $state(false);

  async function load() {
    if (html) return;
    failed = false;
    try {
      const response = await fetch("/changelog.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = (await response.json()).html;
    } catch (error) {
      console.error("changelog failed:", error);
      failed = true;
    }
  }

  $effect(() => {
    if (open && !dialog.open) {
      dialog.showModal();
      load();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  // A click on the backdrop lands on the dialog element itself
  const onClick = (event) => event.target === dialog && (open = false);
</script>

<dialog class="changelog-dialog" aria-labelledby="changelog-title" bind:this={dialog} onclose={() => (open = false)} onclick={onClick}>
  <div class="changelog-dialog-header">
    <h2 id="changelog-title" class="changelog-heading">Changelog</h2>
    <button type="button" class="icon-button" aria-label="Close changelog" onclick={() => (open = false)}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </div>
  <div class="changelog-dialog-body">
    {#if html}
      <article class="changelog-content">{@html html}</article>
    {:else if failed}
      <p class="changelog-status">Couldn't load the changelog. <a href="/changelog">Open it as a page</a>.</p>
    {:else}
      <p class="changelog-status" role="status">Loading&hellip;</p>
    {/if}
  </div>
</dialog>
