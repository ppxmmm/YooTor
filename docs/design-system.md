# อยู่ต่อ (YooTor)

Brand: **เพราะความห่วงใย ไม่ได้จบลงที่การจากลา**. The two interwoven leaf outlines represent care that continues between people. The botanical drawing is an original code-native SVG; UI text and controls remain real HTML.

Palette: navy `#142B45`, teal `#2F8C88`, warm off-white `#F8FAF9`, white `#FFFFFF`, gold `#D7B67A`, slate `#243244`. Thai typography: IBM Plex Sans Thai; numeric/Latin utility face: Manrope. The current font stylesheet uses Google Fonts; production privacy review should self-host these font files.

Layout: fixed flat 238px navy desktop sidebar, white utility header, restrained 10px surface corners, teal functional controls, quiet green preparation illustration. Mobile uses a labeled menu drawer with an explicit close control. Native dialogs trap focus and support Escape; forms use visible labels, browser validation and server validation. Reduced-motion settings are respected.

Primary dashboard: five-category readiness ring, botanical care panel, three meaningful totals, recorded-asset table, next actions and actual activity log. The score is an organizational metric, not a legal evaluation. One incomplete asset category keeps the synthetic scenario at 80%.

`design-reference.png` is the initial generated dashboard concept, before the user selected YooTor. The final implementation retains its palette, sidebar/table/readiness composition and calm density, with the user's new brand and actual persisted data replacing concept copy. All frontend pages extend this system.

Initial concept brief (built-in Image Gen): “Full desktop Thai family legacy dashboard; navy240px sidebar, off-white background, teal accents, Thai readable typography, readiness panel with five lines, botanical care panel, asset/document/contact totals, actual-asset table, next actions and activity; no gradients or decorative growth charts.”

Localization foundation: `src/i18n/messages.ts` contains Thai and English brand/navigation dictionaries and an explicit default locale. Full page-copy translation and locale selection are future work; no nonfunctional language toggle is shown.
