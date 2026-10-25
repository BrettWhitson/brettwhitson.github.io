<script>
  import Query from "#lib/components/Query.svelte";
  import { ICONS } from "#lib/icons.js";
  import { copy } from "#lib/actions/copy.js";

  let { data } = $props();

  const site = $derived(data.site);
  const resume = $derived(data.sections.find((s) => s.type === "rs"));
  const profiles = $derived(Object.entries(data.ext ?? {}));
</script>

<div class="intro">
  <img class="intro-portrait" style="--i: 0" src="/data/images/me-192.webp" width="72" height="72" alt="Portrait of {site.name}">
  <h1 class="intro-name" style="--i: 1">{site.name}</h1>
  <p class="intro-role" style="--i: 2">{site.headline}</p>
  <p class="intro-org" style="--i: 3">{site.org}</p>
  <Query query={site.query} />
  <div class="intro-contact" style="--i: 5">
    <a class="intro-email" href="mailto:{site.email}">{site.email}</a>
    <button type="button" class="icon-button copy-button" use:copy data-copy={site.email} aria-label="Copy email address" title="Copy email address" hidden>
      <svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
    </button>
    <span class="copy-status" role="status"></span>
  </div>
  <div class="intro-actions" style="--i: 6">
    <a class="btn btn-primary btn-download" href={resume.file} download>Download resume{@html ICONS.download}</a>
    <ul class="profile-links">
      {#each profiles as [label, { icon, link }] (label)}
        <li><a class="icon-button" href={link} target="_blank" rel="noopener noreferrer" aria-label="{label} (opens in a new tab)" title={label}>{@html ICONS[icon]}</a></li>
      {/each}
    </ul>
  </div>
</div>
