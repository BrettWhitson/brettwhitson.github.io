<script>
  let { data } = $props();
</script>

<svelte:head>
  <title>Changelog - {data.name}</title>
  <!-- The modal on the home page is the main way in; this page only backs it up -->
  <meta name="robots" content="noindex">
</svelte:head>

<main class="changelog-page">
  <a class="changelog-back" href="/">&larr; {data.name}</a>
  <h1 class="changelog-heading">Changelog</h1>
  <article class="changelog-content">{@html data.html}</article>
</main>
