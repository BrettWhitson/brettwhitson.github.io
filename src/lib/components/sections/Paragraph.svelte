<script>
  import Stats from "./Stats.svelte";

  let { section, data } = $props();
</script>

<div class="section-body section-body-paragraph">
  <p>{section.body}</p>
  {#if section.section === "about"}
    <Stats stats={data.site.stats} />
  {/if}
</div>
