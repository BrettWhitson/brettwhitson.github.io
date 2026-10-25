<script>
  import { sectionIndex } from "#lib/render.js";
  import { reveal } from "#lib/actions/reveal.js";
  import Paragraph from "./Paragraph.svelte";
  import List from "./List.svelte";
  import Skills from "./Skills.svelte";
  import Resume from "./Resume.svelte";

  let { section, index, data } = $props();

  const BODIES = { pg: Paragraph, ls: List, skills: Skills, rs: Resume };

  const Body = $derived.by(() => {
    const body = BODIES[section.type];
    if (!body) throw new Error(`Section "${section.section}" has unknown type "${section.type}"`);
    return body;
  });
</script>

<section id={section.section} class="section reveal" aria-labelledby="{section.section}-title" use:reveal>
  <h2 id="{section.section}-title" class="section-title"><span class="section-index" aria-hidden="true">{sectionIndex(index)} /</span> {section.title}</h2>
  <Body {section} {data} />
</section>
