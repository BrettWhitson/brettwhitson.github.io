<script>
  import { countUp } from "#lib/actions/countUp.js";

  let { stats } = $props();
</script>

{#if stats?.length > 0}
  <dl class="stats" data-stagger use:countUp>
    {#each stats as s}
      <div class="stat"><dt>{s.label}</dt><dd>{s.value}</dd></div>
    {/each}
  </dl>
{/if}
