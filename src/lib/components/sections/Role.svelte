<script>
  // --i orders the timeline animation (see components/_timeline.scss)
  import { isCurrent } from "#lib/render.js";
  import Chip from "./Chip.svelte";

  let { role, index, names } = $props();
</script>

<div class="list-item-role{isCurrent(role.dates) ? ' is-current' : ''}" style="--i: {index}" data-skills={(role.stack ?? []).join(" ")}>
  <h4 class="list-item-role-title">{role.title}</h4>
  {#if role.dates}
    <p class="list-item-date">{role.dates}</p>
  {/if}
  {#if role.bullets?.length > 0}
    <ul class="list-item-bullets">
      {#each role.bullets as bullet}
        <li>{bullet}</li>
      {/each}
    </ul>
  {/if}
  {#if role.stack?.length > 0}
    <ul class="chips" aria-label="Used in this role">
      {#each role.stack as key}
        <Chip {key} name={names.get(key)} />
      {/each}
    </ul>
  {/if}
</div>
