<script>
  import Chip from "./Chip.svelte";

  let { section } = $props();
</script>

<div class="section-body">
  <table class="skills-table">
    <thead>
      <tr><th scope="col">skill_group</th><th scope="col">members</th></tr>
    </thead>
    <tbody data-stagger>
      {#each section.body as group}
        <tr>
          <th scope="row">{group.group}</th>
          <td>
            <ul class="chips">
              {#each group.items as item}
                <Chip key={item.key} name={item.name} />
              {/each}
            </ul>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="skills-status" aria-live="polite" hidden></p>
</div>
