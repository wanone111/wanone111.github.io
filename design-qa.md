# Design QA — Homepage signal fields

## Evidence

- Source visual truth: local ImageGen option 1 concept capture (not committed to the public repository).
- Desktop hero implementation: local in-app browser capture after the final curve pass (not committed).
- Footer implementation: local in-app browser capture at the production footer (not committed).
- Mobile implementation: local in-app browser capture at 390 × 844 (not committed).
- Source viewport: 1536 × 1028 composite concept showing the hero and footer together.
- Browser-rendered desktop viewport: 1280 × 720 (the in-app browser's available desktop viewport).
- Browser-rendered mobile viewport: 390 × 844.
- State: light theme; desktop resting state, desktop pointer-active state, footer resting state, mobile fallback.

The source is a composite concept that omits the site's existing middle sections, so comparison used normalized hero and footer regions rather than treating the composite as a literal full-page layout.

## Full-view comparison evidence

- The existing warm cream surface, editorial typography, coral name emphasis, thin rules, navigation and content hierarchy remain unchanged.
- The hero now uses the source's left-copy/right-signal composition. Four semantic paths (ROS 2, PX4, FPGA and AI) converge into one pointer-reactive node without competing with the headline.
- The footer keeps copyright and build status on the left and navigation on the right, with a quieter, smaller signal echo in the center.
- At 390 × 844 both signal fields are removed from layout, preserving the original single-column hierarchy and preventing horizontal overflow.

## Focused region comparison evidence

Focused comparison was required because the selected concept combines two non-adjacent production regions.

- Hero: path labels, node colors, converging geometry, technical marks and the balance between copy and interaction match the selected direction. Curve weight is intentionally slightly lighter than the concept so the live motion stays secondary to the text.
- Footer: the four colored sources, dashed orbital trace and green convergence node reproduce the source's visual rhyme at lower contrast and density.
- Motion: pointer movement bends the convergence point; velocity offsets produce a small elastic trail; leaving the field returns it to its resting point. Reduced-motion preference renders a static field, and coarse/mobile layouts keep it hidden.

## Required fidelity surfaces

- Fonts and typography: Existing Segoe UI Variable / PingFang SC / Microsoft YaHei stacks, weights, line heights and wrapping are preserved. Canvas labels use the existing mono stack.
- Spacing and layout rhythm: The initial P1 auto-placement issue was fixed by placing copy and signal field on the same grid row. Final hero and footer align to the existing page shell and 12-column editorial grid.
- Colors and visual tokens: All signal colors come from existing semantic project, blog, knowledge and experiment tokens; the background, borders and muted marks use existing surface and border tokens. Dark-theme colors are read from the same live tokens.
- Image quality and asset fidelity: The signal field is the requested interactive visualization rather than a substituted static illustration. It renders on a DPR-aware canvas capped at 2× for sharp curves and nodes. No placeholder, emoji, inline SVG or CSS illustration is used.
- Copy and content: All existing Chinese copy, CTAs, navigation labels, copyright and build status remain unchanged.

## Findings

No actionable P0, P1 or P2 differences remain.

## Comparison history

1. Initial implementation — **P1**: the hero signal field auto-placed below the copy because the overlapping grid columns created a second implicit row. Fix: assigned both hero copy and signal field to grid row 1. Post-fix evidence: `home-signal-hero-final.png` shows the intended side-by-side composition.
2. First visual refinement — **P3**: resting paths read too straight compared with the selected concept. Fix: increased hero Bézier control reach while retaining subtle spring velocity offsets. Post-fix evidence: `home-signal-hero-final.png` shows the four distinct, softly curved paths.
3. Final pass — no actionable P0/P1/P2 findings. Mobile fallback has no horizontal overflow; browser console has no warnings or errors.

## Primary interactions tested

- Desktop pointer entry activates the spring state.
- Pointer movement changes the convergence point and produces a restrained elastic trail.
- Pointer exit returns the field toward its default resting point (automated browser test).
- Reduced-motion preference keeps the field static.
- Mobile and coarse layouts hide both decorative fields.
- Existing navigation and primary CTAs remain functional through the full browser suite.

## Verification

- `npm.cmd run content:publish`: passed.
- Browser interactions: 40 passed.
- Accessibility: 14 passed, including home desktop and mobile.
- Lighthouse: 1.00 median for performance, accessibility, best practices and SEO on all measured routes.
- In-app browser console: no warnings or errors.

## Follow-up polish

- Optional P3: after production review, path opacity can be reduced by another 5–8% if the motion feels too prominent on very large displays.

final result: passed
