<script>
  // Preview is a plain link to the PDF; the client upgrades it to an inline viewer on wide screens
  import { basename } from "#lib/render.js";
  import { ICONS } from "#lib/icons.js";
  import { resumePreview } from "#lib/actions/resumePreview.js";

  let { section } = $props();
</script>

<div class="section-body">
  <div class="resume-actions">
    <a class="btn btn-primary btn-download" href={section.file} download={basename(section.file)}>Download PDF{@html ICONS.download}</a>
    <a class="btn btn-secondary" id="resume-preview-btn" use:resumePreview href={section.file} target="_blank" rel="noopener" aria-controls="resume-preview-container" aria-expanded="false">Preview<span class="visually-hidden">{" (opens in a new tab)"}</span></a>
  </div>
  <div id="resume-preview-container" class="resume-preview-container hidden"></div>
</div>
