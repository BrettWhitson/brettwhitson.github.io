<script>
  import { skillNames } from "#lib/render.js";
  import ListItem from "./ListItem.svelte";

  let { section, data } = $props();

  const names = $derived(skillNames(data));
</script>

<div class="section-body">
  <ul class="section-body-list{section.layout === 'rows' ? ' rows' : ''}" data-stagger>
    {#each section.body as item}
      <ListItem {item} {names} />
    {/each}
  </ul>
</div>
