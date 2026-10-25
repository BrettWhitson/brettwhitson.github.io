<script>
  import Seo from "#lib/components/Seo.svelte";
  import Backdrop from "#lib/components/shell/Backdrop.svelte";
  import Sidebar from "#lib/components/shell/Sidebar.svelte";
  import Nav from "#lib/components/shell/Nav.svelte";
  import Footer from "#lib/components/shell/Footer.svelte";
  import Section from "#lib/components/sections/Section.svelte";
  import { skillLinks } from "#lib/actions/skillLinks.js";

  let { data } = $props();

  const content = $derived(data.content);
</script>

<Seo data={content} />

<a class="skip-link" href="#content">Skip to content</a>

<Backdrop />

<div class="layout">
  <header class="sidebar">
    <Sidebar data={content} />
    <Nav sections={content.sections} />
  </header>

  <div class="content">
    <main id="content" use:skillLinks>
      {#each content.sections as section, index (section.section)}
        <Section {section} {index} data={content} />
      {/each}
    </main>

    <Footer site={content.site} />
  </div>
</div>
