<script>
  import { jsonLd } from "#lib/data.js";

  let { data } = $props();

  const site = $derived(data.site);
  const title = $derived(`${site.name} - ${site.headline}`);
  // Built as one string so Svelte inserts it as-is; jsonLd() already escapes "<"
  const ldScript = $derived(`<script type="application/ld+json">${jsonLd(data)}<\/script>`);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={site.description}>
  <link rel="canonical" href={site.url}>

  <meta property="og:type" content="profile">
  <meta property="og:url" content={site.url}>
  <meta property="og:title" content={title}>
  <meta property="og:description" content={site.description}>
  <meta property="og:image" content={site.image}>
  <meta name="twitter:card" content="summary">

  {@html ldScript}
</svelte:head>
