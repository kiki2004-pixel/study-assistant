# Design System — Scrub

## Product Context
- **What this is:** B2B email validation & list cleaning SaaS — syntax + DNS MX checks, disposable detection, bulk CSV, REST API
- **Who it's for:** Growth/marketing teams and developers who send bulk email and need high deliverability
- **Space/industry:** Email deliverability tools (ZeroBounce, NeverBounce, Bouncer, Hunter)
- **Project type:** Marketing landing page + authenticated web app

## Aesthetic Direction
- **Direction:** Editorial-Utilitarian — rigorous grid, strong typographic hierarchy, functional but with a point of view. "Tool made by people who care about craft."
- **Decoration level:** Intentional — dot-grid backgrounds, subtle card shadows, no gratuitous decoration
- **Mood:** Warm, confident, precise. Not clinical-enterprise. Not startup-playful. The gap in the market: every competitor is blue/purple/corporate; Scrub is warm, serif-forward, and human.
- **Competitive rationale:** All competitors (ZeroBounce, NeverBounce, Bouncer, Hunter) use blue/purple palettes + geometric sans-serif + centered corporate layouts + clinical white backgrounds. Every design decision below is a deliberate departure from this.

## Typography
- **Display/Hero:** Instrument Serif — a contemporary serif with warmth and confidence. Zero competitors use serif. Signals craft and intention; immediately memorable in this category.
- **Body:** DM Sans — clean, highly readable. Not in the overused Inter/Roboto/Montserrat crowd.
- **UI/Labels:** DM Sans — same as body, weight 500 for labels
- **Data/Tables:** Geist Mono with `font-variant-numeric: tabular-nums` — technical credibility for stats, prices, and validation results
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN
  ```
  https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Geist+Mono:wght@400;500;600&display=swap
  ```
- **Scale:**
  | Token      | Font               | Size (px) | Weight | Letter-spacing |
  |------------|--------------------|-----------|--------|----------------|
  | display-xl | Instrument Serif   | 72–88     | 400    | -0.03em        |
  | display-lg | Instrument Serif   | 48–60     | 400    | -0.03em        |
  | display-md | Instrument Serif   | 28–36     | 400    | -0.02em        |
  | heading    | DM Sans            | 18–20     | 600    | 0              |
  | body-lg    | DM Sans            | 18        | 400    | 0              |
  | body-md    | DM Sans            | 16        | 400    | 0              |
  | body-sm    | DM Sans            | 14        | 400    | 0              |
  | caption    | DM Sans            | 12        | 400    | 0              |
  | label      | DM Sans            | 11–12     | 500    | 0.08em (UC)    |
  | mono       | Geist Mono         | 14        | 400–600| 0              |

## Color
- **Approach:** Restrained — color is rare and meaningful. Green = action. Yellow = highlight/landmark. Everything else is neutral.
- **Brand green:** #22C55E (brand.solid) — primary action color (buttons, success states)
- **Accent yellow:** #FFD600 (accent.solid) — highlight accent, CTA variant, Best Value badge. Nobody in the email validation space uses yellow — every element that uses it becomes a landmark.
- **bg:** #F5F5F0 (light) / #0D0D0D (dark) — warm off-white, not clinical white. The warmth is a deliberate departure from competitors.
- **bg.subtle:** #FFFFFF (light) / #1A1A1A (dark)
- **bg.muted:** #E8E8E2 (light) / #2A2A2A (dark)
- **fg:** #111111 (light) / #F5F5F0 (dark)
- **fg.muted:** #555555 (light) / #AAAAAA (dark)
- **border:** #D4D4CF (light) / #333333 (dark)
- **Semantic (validation states):**
  | State   | bg       | fg       | border   |
  |---------|----------|----------|----------|
  | valid   | #dcfce7  | #15803d  | #bbf7d0  |
  | invalid | #fee2e2  | #b91c1c  | #fecaca  |
  | risky   | #fef9c3  | #854d0e  | #fde68a  |
  | unknown | bg.muted | fg.muted | border   |
- **Dark mode:** Surfaces invert, saturation unchanged, contrast maintained.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — generous section padding, breathing room between elements
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64) 4xl(80) 5xl(128)
- **Section vertical padding:** 80px (base) / 128px (md+)

## Layout
- **Approach:** Hybrid — strict grid for feature/pricing/dashboard sections; grid-breaking allowed for hero and CTA
- **Grid:** 12 columns, max content width 1100px
- **Max content width:** 1100px (5xl in Chakra)
- **Hero card hierarchy:** The FeatureCardsSection uses three floating cards (DirtyListCard, ValidatedListCard, ValidatorInputCard). The two outer cards should be scaled smaller than the center card to create visual hierarchy and focus the user's eye toward the primary interaction.
- **Footer:** The existing custom footer design is intentional and unique — preserve it as-is.

## Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| sm    | 6px   | Tags, small chips |
| md    | 10px  | Buttons, inputs |
| lg    | 16px  | Cards |
| xl    | 24px  | Large cards, modals |
| full  | 9999px| Pills, badges, tab toggles |

## Motion
- **Approach:** Intentional — subtle fade+slide entrances on scroll, no theatrical scroll-driven effects
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Anti-patterns:** No parallax, no scroll-jacking, no bounce easings

## Decisions Log
| Date       | Decision | Rationale |
|------------|----------|-----------|
| 2026-04-10 | Instrument Serif for display headings | No competitor uses serif. Signals craft; instantly memorable in the category. |
| 2026-04-10 | DM Sans for body copy | Avoids the overused Inter/Montserrat crowd while maintaining excellent readability. |
| 2026-04-10 | Geist Mono for data/stats | Technical credibility for numbers, prices, and validation results. |
| 2026-04-10 | Warm off-white (#F5F5F0) background | Competitors use clinical white. Warmth reads as human and considered. |
| 2026-04-10 | Yellow (#FFD600) accent | Nobody in email validation uses yellow. Every element using it becomes a landmark. |
| 2026-04-10 | Card hierarchy in hero section | Outer cards scaled smaller than center card for visual hierarchy and user focus. |
| 2026-04-10 | Preserve custom footer | The existing footer design is intentional and unique to the brand. |
