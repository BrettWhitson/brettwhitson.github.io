<script>
  // The styled query is hidden from assistive tech, which gets the result as a plain sentence instead
  import { highlightSql } from "#lib/render.js";
  import { queryTyper } from "#lib/actions/queryTyper.js";

  let { query } = $props();
</script>

{#if query}
  <p class="visually-hidden">Specialties: {query.rows.join(", ")}.</p>
  <figure class="query" style="--i: 4" aria-hidden="true" use:queryTyper>
    <pre class="query-sql"><code>{@html highlightSql(query.sql)}</code></pre>
    <table class="query-result">
      <thead>
        <tr><th>{query.column}</th></tr>
      </thead>
      <tbody>
        {#each query.rows as row, i}
          <tr style="--i: {i}"><td>{row}</td></tr>
        {/each}
      </tbody>
    </table>
    <figcaption class="query-caption">{query.rows.length} {query.rows.length === 1 ? "row" : "rows"} selected.</figcaption>
  </figure>
{/if}
