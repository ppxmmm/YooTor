# อยู่ต่อ (YooTor)

Brand: **เพราะความห่วงใย ไม่ได้จบลงที่การจากลา**. The two interwoven leaf outlines represent care that continues between people. The botanical drawing is an original code-native SVG; UI text and controls remain real HTML.

Palette: navy `#17384A`, teal `#24796F`, dark teal `#1B6259`, warm off-white `#F8FAF9`, white `#FFFFFF`, gold `#D7B67A`, ink `#233743`, supporting text `#52636D`. Thai typography: IBM Plex Sans Thai; numeric/Latin utility face: Manrope. Body uses weight 500 and controls/labels 600; supporting copy keeps contrast instead of pale gray. The current font stylesheet uses Google Fonts; production privacy review should self-host these font files.

The refined mark uses broader interlocking leaves with a shared stem: jade/navy on light backgrounds and white on dark backgrounds. `Brand` shares the geometry throughout the website; `src/app/icon.svg` uses a heavier small-size variant for browser tabs. The Thai wordmark is weight 600 with a jade English signature.

Homepage reading scale (`src/components/landing.css`): hero description 18px desktop / 17px phone; supporting sections 16px; primary actions 16px; navigation 15px; headings 28–32px and hero up to58px. Scope marketing styles under `.landing` to protect workspace density. Use a clear product statement, owner/family paths, explicit draft/preparation wording, a demo preview and a dark privacy section.

The homepage tree has a modest saturation increase and a6.8-second, ±1.8° breeze with a small skew anchored near its base. Hero lines enter in sequence; a separate decorative text line cycles through assets, policies and family intentions. Whole phrases move together to preserve Thai combining marks. Sections animate once when entering the viewport; content is visible without JavaScript or intersection classes. The homepage has no visible pause button; motion respects the system reduced-motion preference. `prefers-reduced-motion` removes animations, shows the first phrase, and hides the control. Leave room above the canopy for the brand message. Dashboard tree placements remain static. The homepage also has a gentle care-icon pulse, once-only demo progress entrance, and navigation hover underlines. The rotating phrase and its label share a 29px line box to preserve alignment.

Layout: fixed flat 238px navy desktop sidebar, white utility header, restrained 10px surface corners, teal functional controls, quiet green preparation illustration. Mobile uses a labeled menu drawer with an explicit close control. Native dialogs trap focus and support Escape; forms use visible labels, browser validation and server validation. Reduced-motion settings are respected.

Primary dashboard: five-category readiness ring, botanical care panel, three meaningful totals, recorded-asset table, next actions and actual activity log. The score is an organizational metric, not a legal evaluation. One incomplete asset category keeps the synthetic scenario at 80%.

`design-reference.png` is the initial generated dashboard concept, before the user selected YooTor. The final implementation retains its palette, sidebar/table/readiness composition and calm density, with the user's new brand and actual persisted data replacing concept copy. All frontend pages extend this system.

Initial concept brief (built-in Image Gen): “Full desktop Thai family legacy dashboard; navy240px sidebar, off-white background, teal accents, Thai readable typography, readiness panel with five lines, botanical care panel, asset/document/contact totals, actual-asset table, next actions and activity; no gradients or decorative growth charts.”

Localization foundation: `src/i18n/messages.ts` contains Thai and English brand/navigation dictionaries and an explicit default locale. Full page-copy translation and locale selection are future work; no nonfunctional language toggle is shown.

## Botanical realism refresh

The shared `TreeArt` now uses `public/images/yootor-tree-realistic.png` through
Next Image for responsive optimization. The original brand mark and UI content
remain unchanged. Landing, dashboard care card, and auth panels share the artwork.
The landing note sits above the canopy; dashboard copy stays to its left.

Generated with built-in ImageGen (transparent background). Final asset prompt:
“Photorealistic graceful young broad-canopied tree, full tree visible, natural
asymmetric branching, textured brown bark, sage and olive leaves, warm morning
studio light, small grass patch at roots, transparent background; quiet family
legacy mood; no text, UI, pot, floating island, cartoon, or landscape.”

Verified landing and dashboard care card at 1440px and 390px in Chrome. Dashboard
visual verification used browser-only synthetic state, without database writes.

## Distinct authentication experiences

Login uses a light sage welcome panel, slow tree breeze and horizontal form entrance. Registration uses navy, a once-only tree reveal, staggered preparation topics and a two-step progress line. Form state persists between steps; consent remains unchecked. Auth screens have no visible pause controls and respect the system reduced-motion preference. On desktop the login form sits right and registration form sits left, with the artwork opposite. Mobile uses a single form column with readable 16px inputs.

Authentication split panels remain visible from 641px upward, including the 778px in-app preview. Only phones at 640px and below collapse to a single form. Explicit grid and story display rules override legacy global mobile styles.

## Authentication refinement

Auth panels and botanical artwork are static: no clip reveal, rotation, skew, sliding form or staggered content. Keep login right / registration left above 640px. Left-aligned editorial copy, fine panel dividers, clear white fields and a compact form heading create a quieter account-entry experience. Only control colors and step progress transition.

Auth product styling: deep navy botanical workspace with a restrained 32px grid, static tree, three descriptive preparation categories, white form pane, crisp 6px inputs/buttons, teal primary action and subtle sample-data utility area. Both auth routes share the product palette while mirroring panel positions. No animated artwork or page transitions.
