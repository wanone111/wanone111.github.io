# Website Rules

This directory contains the public Astro + Starlight site.

## Boundaries

- Auto-detect the sibling `../knowledge_base` repository when a workspace config is absent.
- Treat `../knowledge_base` as private.
- Read publishable source only from `../knowledge_base/40_Publish`.
- Generated content and assets are outputs; never use them to overwrite source notes.
- Never copy inbox, engineering, debugging, private notes, archives, or unapproved knowledge-base files into this repository.

## Product Ownership

The user owns visual direction, information architecture, content meaning, and final design approval. Do not independently change primary colors, fonts, navigation, homepage hierarchy, public URLs, or article wording.

## Required Checks

For content changes, run `npm.cmd run content:validate`, `npm.cmd run content:check-secrets`, `npm.cmd run content:sync`, `npm.cmd run test:generated`, `npm.cmd run test:content`, `npm.cmd run check`, `npm.cmd run build`, `npm.cmd run test:links`, `npm.cmd run test:routes`, `npm.cmd run test:redirects`, and `npm.cmd run test:qa`. `npm.cmd run content:publish` runs this publishing verification chain. CI must block deployment if any required check fails.

## Generated Directories

Generated blog, project, and fixed-page content belongs under `src/content/generated/`. Generated Starlight documents are manifest-owned files below `src/content/docs/knowledge/`. Generated public assets belong under `public/images/generated/`. Never overwrite a file without the generated marker, and only remove outputs recorded in `generated-content-manifest.json`.
