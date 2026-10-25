<script>
  // item.main is trusted author HTML from data.json, so it renders unescaped
  import { roleSpan } from "#lib/render.js";
  import Role from "./Role.svelte";

  let { item, names } = $props();

  const span = $derived(roleSpan(item.roles));
</script>

<li class="section-list-item">
  {#if item.subsubheader}
    <p class="list-item-date">{item.subsubheader}</p>
  {/if}
  <div class="list-item-body">
    {#if item.header}
      <h3 class="list-item-header">{item.header}</h3>
    {/if}
    {#if span}
      <p class="list-item-caption">{span}</p>
    {/if}
    {#if item.subheader}
      <p class="list-item-subheader">{item.subheader}</p>
    {/if}
    {#if item.main}
      <div class="list-item-main">{@html item.main}</div>
    {/if}
    {#if item.roles?.length > 0}
      <div class="roles">
        {#each item.roles as role, i}
          <Role {role} index={i} {names} />
        {/each}
      </div>
    {/if}
    {#if item.link?.href}
      <a class="list-item-link" href={item.link.href} target="_blank" rel="noopener noreferrer">{item.link.label || item.link.href}<span class="visually-hidden">{" (opens in a new tab)"}</span></a>
    {/if}
  </div>
</li>
