# ErisAI Frontend — Design System Reference

This document is a literal inventory of the design system as implemented in the codebase (Next.js App Router + Tailwind v4 + `@theme`). It exists so that **all future work reuses these exact values** instead of inventing new colors, sizes, spacing, or component patterns. When building something new, find the closest existing pattern below and copy its values.

Stack: Next.js 16, React 19, Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`), fonts via `next/font/google` (Geist Sans / Geist Mono).

---

## 1. Color Palette

### Theme tokens (`src/app/globals.css` `@theme` block)

| Token | Value | Usage |
|---|---|---|
| `--color-paper` | `#f9f8f3` | Primary background (light sections), text-on-dark |
| `--color-parchment` | `#eee8dc` | Secondary/alternate section background, hover states |
| `--color-dusk` | `#8c8477` | Borders, dividers, muted/secondary text, decorative bullets |
| `--color-ink` | `#0b0b0b` | Primary text, dark section backgrounds, primary button bg |
| `--color-ink-70` | `rgba(11,11,11,0.7)` | Secondary body text |
| `--color-ink-60` | `rgba(11,11,11,0.6)` | Tertiary text |
| `--color-ink-50` | `rgba(11,11,11,0.5)` | Meta text (dates, captions) |
| `--color-ink-30` | `rgba(11,11,11,0.3)` | Faint dividers/decorative (blockquote borders, `* * *` HR) |
| `--color-ink-20` | `rgba(11,11,11,0.2)` | Very faint borders |

Access as Tailwind utilities (`bg-paper`, `text-ink/70`, etc.) or CSS vars (`var(--color-ink)`), both patterns are used interchangeably across the codebase.

### One-off / inline colors found in components

| Value | Where used | Purpose |
|---|---|---|
| `#2d2d2a` | Hover/active state of ink-colored buttons (Hero, Navbar, Footer CTAs, SectionTwo... all primary dark buttons) | Darkened ink on hover |
| `rgba(11,11,11,0.1)` | `selection:bg-[...]` globally | Text selection highlight on light backgrounds |
| `rgba(11,11,11,0.06)` | Eyebrow tag backgrounds inside cards (`bg-ink/[0.06]`) — SectionTwo, PartnershipCapabilities | Subtle tag chip on paper bg |
| `rgba(11,11,11,0.12)` | `border-ink/[0.12]` — divider above card CTA links (SectionTwo) | Card internal divider |
| `rgba(11,11,11,0.02)` | Hover bg on publication list rows; table header bg (ArticleBody) | Very subtle hover/zebra |
| `rgba(11,11,11,0.04)` | Inline `<code>` background (ArticleBody) | Code chip bg |
| `rgba(238,232,220,0.60)` | Eyebrow/tag pill backgrounds site-wide on inner pages (Product/Research/Solutions/Synapse headers, cards) — this is parchment at 60% | Standard "eyebrow label" chip bg on paper sections |
| `rgba(249,248,243,0.65)` / `.6` / `.55` / `.5` / `.35` / `.3` / `.28` / `.18` | Paper (white) at various opacities, used as body text on dark (`ink`) sections | Text hierarchy on dark backgrounds |
| `#d4ccbe` | Spotlight.css `.spotlight-eyebrow` color (hardcoded, noted in code comment as intentionally different from `--color-dusk`) | Eyebrow text specifically on the dark Spotlight card |
| `#CBD5E1` | Code block (`<pre>`) text color in ArticleBody | Syntax/code text on ink bg |
| `rgba(140,132,119,0.3)` / `0.45` / `0.55` / `0.6` | dusk at various opacities — touch-active card shadow border color, SVG diagram lines/arrows in SynapseFlowDiagram | Card touch/hover border, diagram line color |
| Mermaid theme colors | `#F5EFE6` (primary), `#0B0B0B` (text/line), `#A8A29E` (border), `#E8E2D9` (secondary) | Mermaid diagram theming (MermaidDiagram.tsx) — approximate ink/parchment/dusk equivalents since Mermaid needs literal hex |

### Color-by-purpose summary
- **Light section bg:** `paper` (#f9f8f3)
- **Alternate light section bg:** `parchment` (#eee8dc)
- **Dark section bg:** `ink` (#0b0b0b)
- **Body text (light bg):** `ink` / `ink-70` / `ink-60` / `ink-50`
- **Body text (dark bg):** `paper` / `rgba(249,248,243, 0.5–0.7)`
- **Borders/dividers (light bg):** `dusk` or `dusk/10`, `dusk/30` on hover
- **Eyebrow/label chip bg:** `parchment/60` (`rgba(238,232,220,0.60)`) on light sections; plain `parchment/60` also inside Hero (`bg-parchment/60`)
- **Primary button:** bg `ink`, text `paper`, hover bg `#2d2d2a`
- **Secondary/inverted button (on dark section):** bg `paper`, text `ink`, hover bg `parchment`

---

## 2. Typography

### Font families
- `--font-sans`: Geist Sans (via `next/font/google`), fallback `ui-sans-serif, system-ui, sans-serif` — body copy, headings, buttons
- `--font-mono`: Geist Mono, fallback `ui-monospace, monospace` — eyebrow labels, nav links, tags, meta text, code
- `font-serif` (system default) — used only for KaTeX math rendering

### Type scale by role

| Role | Size | Weight | Line-height | Tracking | Example component |
|---|---|---|---|---|---|
| **Hero H1** (largest) | `clamp(40px,5.5vw,72px)` | bold (700) | 1.05 | -0.03em | Hero.tsx, ChatPage h1 |
| **Page H1** (inner pages) | `clamp(36px,4.5vw,64px)` | bold (700) | 1.05 | -0.03em | ProductHeader, ResearchHeader, SolutionsHeader, SynapseHeader |
| **Publication H1** | `clamp(28px,3.8vw,52px)` | bold (700) | 1.10 | -0.025em | `[slug]/page.tsx` article title |
| **Display headline** (extra-large statement) | `clamp(40px,5.5vw,80px)` | bold (700) | 1.05 | -0.03em | SynapseBuildCTA |
| **Section H2 — large statement** | `clamp(32px,4vw,56px)` | bold (700) | 1.10 | -0.025em | SectionThree, SolutionsCTA; also `clamp(32px,4vw,56px)` weight 700 leading 1.05 for product spotlight H2s (OwnifySpotlight/SynapseSpotlight) |
| **Section H2 — standard** | `clamp(28px,3.5vw,44px)` | semibold (600) | 1.15 | -0.02em | SectionTwo, ResearchFocus, WhatsComing, EngagementModels, PartnershipCapabilities, ProductCTA/ResearchCTA H2 (uses `-0.025em` tracking variant) |
| **Section H2 — medium** | `clamp(28px,3.2vw,42px)` | semibold (600) | 1.15 | -0.02em | SynapseWhat, SynapseCapabilities |
| **Section H2 — smaller** | `clamp(26px,3vw,40px)` | semibold (600) | 1.15 | -0.02em | Partners.tsx heading |
| **Section H2 — compact** | `clamp(24px,2.5vw,36px)` | semibold (600) | 1.15–1.20 | -0.02em | PublicationsIndex "Publications" heading, ClosingCTAStrip |
| **Sub-heading / method strip H2** | `clamp(22px,2.5vw,32px)` | semibold (600) | 1.20 | -0.02em | MethodologyStrip |
| **Card H3** | `clamp(22px,2.2vw,28px)` | semibold (600) | 1.25 | -0.02em | SectionTwo cards |
| **Card H3 (compact)** | `clamp(20px,2vw,24px)` | semibold (600) | 1.25 | -0.02em | ResearchFocus cards |
| **Panel H3** | `clamp(18px,1.7vw,22px)` | semibold (600) | 1.25 | -0.02em | EngagementModels |
| **Capability card H3** | `clamp(20px,2vw,26px)` | semibold (600) | 1.25 | -0.02em | PartnershipCapabilities |
| **Grid item H3** | `clamp(17px,1.4vw,20px)` | semibold (600) | 1.25 | -0.01em | SynapseCapabilities |
| **Principle H3 (small)** | `clamp(15px,1.1vw,17px)` | semibold (600) | 1.30 | -0.01em | SynapseWhat principles |
| **Article H3** | `clamp(18px,1.5vw,22px)` | medium (500) | 1.40 | -0.01em | ArticleBody |
| **Article H4** | `16px` fixed | medium (500) | 1.50 | uppercase, 0.04em | ArticleBody, Bibliography, ClosingCTAStrip labels |
| **Body — hero subhead** | `clamp(17px,1.4vw,19px)` | normal (400) | 1.70 | none | Hero, ChatPage |
| **Body — standard** | `clamp(16px,1.2vw,18px)` / `clamp(15px,1.2vw,17px)` | normal (400) | 1.70–1.75 | none | Most section intro paragraphs |
| **Body — card text** | `clamp(15px,1.1vw,16px)` / `clamp(14px,1.05vw,15px)` | normal (400) | 1.80 | none | Card bodies (SectionTwo, ResearchFocus, PartnershipCapabilities) |
| **Body — article prose** | `clamp(16px,1.3vw,18px)` | normal (400) | 1.85 | none | ArticleBody `<P>` |
| **Body — small/panel** | `clamp(13px,0.95vw,14px)` / `clamp(13px,1.0vw,14px)` | normal (400) | 1.65–1.80 | none | EngagementModels descriptor/bullets, SynapseCapabilities, SynapseSecurityStrip |
| **Eyebrow / label (pill)** | `11px` fixed | medium (500) or semibold (600 on Partners) | 1.5 (when present) | uppercase, 0.12em | Universal "eyebrow" pattern — see §8 |
| **Eyebrow — small variant** | `10px` fixed | semibold (600) | — | uppercase, 0.14–0.16em | EngagementModels number tags, SynapseCapabilities `tag`, Partners column labels |
| **Nav link (desktop)** | `12px` fixed | medium (500) | — | uppercase, 0.06em | Navbar desktop links |
| **Nav link (mobile)** | `13px` fixed | medium (500) | — | uppercase, 0.10em | Navbar mobile overlay links |
| **Button text** | `14px` fixed | medium (500) | — | 0.01–0.02em | All primary/secondary CTA buttons |
| **Footer link** | `13px` fixed | medium (500) | — | none | Footer nav links, copyright |
| **Meta/caption text** | `12px`–`13px` fixed | normal (400) | 1.60 | 0.02–0.04em (mono) | Dates, breadcrumbs, publication meta |
| **Micro label** | `9px`–`10px` fixed | medium (500) | 1.5 | uppercase, 0.10–0.12em | Partners program-partner name labels |
| **Decorative giant number** | `clamp(64px,7vw,96px)` (EngagementModels) or `140px` fixed (ResearchFocus bg number) | bold (700) | 1 / none | `text-ink/[0.06]` or `text-ink/[0.03]` | Background decorative numerals |

### Weight usage
- **400 (normal)** — all body copy, descriptions
- **500 (medium)** — eyebrows, nav links, buttons, article H3/H4, publication titles
- **600 (semibold)** — H2/H3 headings throughout
- **700 (bold)** — H1s, hero-scale headlines, large display statements

### Letter-spacing (tracking) conventions
- Large headlines (H1/display): **-0.03em to -0.025em** (tighter as size increases)
- Standard H2/H3: **-0.02em to -0.01em**
- Body text: **none** (default)
- Eyebrows/labels/uppercase mono text: **+0.06em to +0.16em** (wider, always uppercase)
- Buttons: **+0.01em to +0.02em**

---

## 3. Spacing Scale

Spacing is largely bespoke pixel values inside Tailwind arbitrary-value brackets (`px-[16px]`), not a strict 4/8px system, but a consistent set of values recurs:

### Section vertical padding (the dominant rhythm)
- **Large section**: `py-[80px] lg:py-[120px]` — used by nearly every full content section (SectionTwo, SectionThree, ResearchFocus, PublicationsIndex, OwnifySpotlight, SynapseSpotlight, EngagementModels, PartnershipCapabilities, SynapseWhat, SynapseCapabilities, SolutionsCTA)
- **Medium section**: `py-[72px] lg:py-[100px]` — CTA/strip sections (Partners, WhatsComing, ProductCTA, ResearchCTA)
- **Compact section**: `py-[80px] lg:py-[112px]` (SynapseFlowDiagram) or `py-[64px]` (PostArticleNav)
- **Small strip**: `py-[48px] lg:py-[64px]` (SynapseSecurityStrip), `py-[32px]` (SynapseResearchStrip)
- **Header sections**: `pt-[144px] pb-[80px]` with `min-h-[360px] lg:min-h-[480px]` — every inner-page header (Product/Research/Solutions/Synapse)
- **Hero**: `pt-[96px] md:pt-[120px] pb-[120px] md:pb-[160px]`

### Container padding (horizontal)
- Two container conventions exist side by side:
  1. Tailwind `container max-w-[1200px] mx-auto px-[16px] xl:px-[48px]` — used on Product/Research/Solutions/Synapse pages and their sub-components
  2. `max-w-[960px]/[1080px]/[1280px] mx-auto px-6` — used on homepage components (SectionTwo, SectionThree, Partners, Footer, Navbar)
- Content max-widths: `700px` (hero text), `760px` (article body), `960px`–`1080px` (card grids), `1200px` (page container), `1280px` (navbar)

### Component spacing (margins between elements, top-to-bottom)
- Eyebrow → H1/H2: `mb-6` (24px) or `mb-[20px]`–`mb-[28px]`
- H1/H2 → subhead paragraph: `mb-4` (16px) or `mb-[16px]`–`mb-[24px]`
- Section header block → content grid: `mb-[48px]`–`mb-[64px]` (pb variants used equally)
- Card internal padding: `p-[40px_32px] lg:p-[56px_48px]` (SectionTwo) or `p-[40px_32px] lg:p-[48px_40px]` (ResearchFocus, PartnershipCapabilities)
- Card grid gap: `gap-8` (32px) universally for 2–3 column card grids
- Button group gap: `gap-[16px]` (CTA pairs) or `gap-6` (Hero)
- Form field gap: `gap-[12px]`

### Common fixed px values seen repeatedly (treat as the de-facto spacing scale)
`4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 100, 112, 120, 144, 160`

---

## 4. Border Radius

| Radius | Usage |
|---|---|
| `4px` (`rounded-[4px]`) | Publication list row hover, inline `<code>` chip |
| `8px` (`rounded-[8px]` / `rounded-lg`) | **The standard radius** — buttons, eyebrow pills, nav CTA, input fields, image containers (OwnifySpotlight/SynapseSpotlight visual frame), skip-link, mobile menu items |
| `12px` (`rounded-[12px]`) | Larger surfaces: article hero image, Callout aside box, code `<pre>` block, MermaidDiagram wrapper |
| `20px` → `48px` desktop / `16px` mobile (dynamic `--sp-radius`) | Spotlight.tsx hero card only — animates from 20px (rest) toward 0 as user scrolls (mobile starts/ends at 16px) |
| `full`/`rounded-full` | Hamburger icon bars, small decorative dot bullets |

**Rule of thumb:** buttons, pills, and small containers → `8px`. Larger media/callout surfaces → `12px`. Nothing else deviates except the animated Spotlight card.

---

## 5. Borders & Dividers

| Style | Value | Usage |
|---|---|---|
| Standard divider | `border-t`/`border-b border-dusk` (solid, 1px, full-opacity dusk) | Header `<hr>` under hero text, MethodologyStrip `border-y`, mobile menu item separators, Navbar scrolled state `border-b` |
| Faint divider | `border-dusk/10` | Partners section top border, card default border |
| Hover divider | `border-dusk/30` | Card hover/touch-active border |
| Dashed border | `border-dashed border-dusk/30` → `/50` active | AISealCard in Partners |
| Ink divider (on-card) | `border-ink/[0.12]` | Divider above CTA link inside SectionTwo cards |
| Table borders | `border-b border-dusk` per row, outer `border border-dusk rounded-[8px]` | ArticleBody comparison tables |
| Input border | `border border-paper/20` (dark form) or `border border-[rgba(238,232,220,0.2)]` (light-on-dark form) | SynapseWaitlistForm, ResearchSubscribeForm |
| Blockquote border | `border-l-[3px] border-ink/20` | ArticleBody blockquote |
| Vertical/horizontal split divider | `w-px bg-dusk` (desktop vertical) / `h-px bg-dusk` (mobile horizontal) | Partners two-column split, EngagementModels/SynapseSecurityStrip three-column split (`divide-x`/`divide-y divide-dusk`) |

Border width is virtually always **1px**, except the blockquote left-border (**3px**) and focus outlines (**2px**).

---

## 6. Shadows

| Shadow | Usage |
|---|---|
| `shadow-sm` (Tailwind default) | Resting state of all bordered content cards |
| `shadow-[0_0_30px_rgba(0,0,0,0.08)]` | Card hover/touch-active state (SectionTwo, ResearchFocus, PartnershipCapabilities) — soft, wide, very low-opacity glow, not a directional drop shadow |
| `shadow-[0_4px_24px_rgba(0,0,0,0.10)]` | Article hero image |
| Dynamic: `0 8px 48px rgba(11,11,11,var(--sp-shadow)), 0 2px 12px rgba(11,11,11,calc(var(--sp-shadow)*0.55))` | Spotlight.tsx card — shadow opacity animates from 0.18 toward 0 on scroll |

**Pattern:** cards use a large, extremely soft, low-opacity black glow rather than a tight directional shadow. No shadow exceeds ~0.10 opacity except the animated Spotlight card at rest (0.18).

---

## 7. Layout Patterns

### Breakpoints
- Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px) — used throughout for grid/flex direction switches and type scaling context
- Custom raw-CSS breakpoints (Spotlight.tsx/css only): `768px` (mobile/desktop split for JS calc and CSS media queries)

### Container widths (recurring max-widths)
- `480px` — narrow content (forms, short body text on dark CTA sections)
- `520px`–`600px` — paragraph/body text max-width under headings
- `700px` — hero/statement text blocks
- `760px` — article/publication body column
- `960px`–`1080px` — card grid containers
- `1200px` — standard page container
- `1280px` — navbar container (widest)

### Grid/flex patterns
- **3-column card grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8` — the standard card-grid pattern (SectionTwo, ResearchFocus, PartnershipCapabilities)
- **2-column split (image+content)**: `grid grid-cols-1 md:grid-cols-2 gap-[48px] md:gap-[80px] items-center`, with `order-1/2` swap on mobile vs desktop — OwnifySpotlight, SynapseSpotlight
- **3-column divider panel (no cards)**: `grid grid-cols-1 sm:grid-cols-3` with `divide-x`/border-based separators instead of gaps — EngagementModels, SynapseSecurityStrip
- **2-column editorial (label+content vs. list)**: `grid grid-cols-1 lg:grid-cols-2 gap-[64px] lg:gap-[96px]` — SynapseWhat
- **Publication row**: `flex flex-col md:grid md:grid-cols-[100px_1fr_auto]` — PublicationsIndex list items

### Page skeleton (used identically on Product/Research/Solutions/Synapse)
```
<div className="flex flex-col min-h-screen selection:bg-[rgba(11,11,11,0.1)] selection:text-[var(--color-ink)]">
  <Navbar />
  <main id="main-content" className="flex-grow flex flex-col">
    <PageHeader />
    ...sections alternating bg-paper / bg-parchment / bg-ink...
  </main>
  <Footer />
</div>
```

### Background alternation rule
Sections alternate `paper` → `parchment` → `paper` → `ink` in sequence down a page to create rhythm; the final CTA before the footer is almost always `bg-ink` (dark). Homepage: paper (Hero) → ink (Spotlight card, inset) → parchment (SectionTwo) → paper (Partners) → ink (SectionThree) → paper (Footer).

---

## 8. Reusable Component Structures

### 8.1 "Eyebrow" label (the most repeated atom in the system)
```
<span className="font-mono font-medium text-[11px] text-[var(--color-ink-70)] uppercase tracking-[0.12em] bg-[rgba(238,232,220,0.60)] px-[16px] py-[6px] rounded-[8px] mb-[28px] inline-block">
  Label Text
</span>
```
- On dark (`ink`) sections, swap to `text-paper/80` and drop the background (no pill bg on dark sections, just plain uppercase mono text)
- On Hero specifically, background is `bg-parchment/60` with `px-4 py-1.5` (Tailwind spacing utility instead of raw px)
- Weight is `medium` (500) everywhere except Partners.tsx which uses `semibold` (600)

### 8.2 CTA Button — Primary (dark, on light bg)
```
className="bg-[var(--color-ink)] text-[var(--color-paper)] px-[28px] py-[14px] rounded-[8px] hover:bg-[#2d2d2a] active:bg-[#2d2d2a] transition-all duration-150 font-sans font-medium text-[14px] tracking-[0.02em] touch-manipulation"
```
Used identically (with only bracket-syntax vs Tailwind-var swaps) in: Hero, Navbar, SectionThree, OwnifySpotlight, SynapseSpotlight, ResearchCTA.

### 8.3 CTA Button — Inverted (light, on dark bg)
```
className="bg-[var(--color-paper)] text-[var(--color-ink)] px-[28px] py-[14px] rounded-[8px] hover:bg-[var(--color-parchment)] active:bg-[var(--color-parchment)] transition-colors duration-150 font-sans font-medium text-[14px] tracking-[0.02em] touch-manipulation"
```
Used on: SectionThree secondary, ProductCTA, ResearchCTA, SolutionsCTA, SynapseBuildCTA — always the primary action on an `ink` background section.

### 8.4 CTA — Secondary text link (with arrow)
```
className="text-[var(--color-dusk)] hover:text-[var(--color-paper)] hover:underline underline-offset-[3px] transition-colors duration-150 font-sans font-medium text-[14px]"
```
Paired next to a primary button on almost every CTA section, label always ends in `→`.

### 8.5 Touch/hover shadow card (the standard "feature card")
```
const CARD_CLASS = "relative flex flex-col bg-paper p-[40px_32px] lg:p-[56px_48px] rounded-lg shadow-sm border border-dusk/10 hover:border-dusk/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.08)] transition-all duration-500 reveal touch-manipulation";
```
Structure: eyebrow tag chip (`bg-ink/[0.06]`) → H3 → body paragraph(s) → spacer (`flex-grow`) → bordered footer with arrow link (SectionTwo), or no footer link (ResearchFocus, PartnershipCapabilities). Card active/touch state is driven by the shared `useTouchShadow()` hook (`src/hooks/useTouchShadow.ts`), applying an inline style equal to the hover state so touch devices get the same visual feedback without `:hover`.

### 8.6 Inner-page Header (Product/Research/Solutions/Synapse — identical structure)
```
<section className="bg-[var(--color-paper)] min-h-[360px] lg:min-h-[480px] pt-[144px] pb-[80px]">
  <div className="container max-w-[1200px] mx-auto px-[16px] xl:px-[48px] text-left">
    <div className="reveal">
      {eyebrow}
      <h1 className="... text-[clamp(36px,4.5vw,64px)] ...">{headline}</h1>
      <p className="... max-w-[600px]">{subhead}</p>
    </div>
  </div>
  <div className="container max-w-[1200px] mx-auto px-[16px] xl:px-[48px]">
    <hr className="border-t border-[var(--color-dusk)] mt-[48px] lg:mt-[80px]" />
  </div>
</section>
```
All four page headers (ProductHeader, ResearchHeader, SolutionsHeader, SynapseHeader) are byte-for-byte this same structure with only text/eyebrow content changed. **Any new page header must follow this exact template.**

### 8.7 "Divider panel" (numbered/tagged columns without cards)
Used in EngagementModels (3 cols) and SynapseSecurityStrip (3 cols): a `grid grid-cols-1 sm:grid-cols-3` with `border-t`/`divide-x` between columns instead of gap+card styling, each column = small eyebrow/tag → heading → body → (optional bullet list with `w-[3px] h-[3px] rounded-full bg-dusk` dot markers).

### 8.8 CTA Section (dark, centered, on `ink` bg)
Shared shape across SectionThree, ProductCTA, ResearchCTA, SolutionsCTA:
```
eyebrow (plain text, text-paper/80, no bg) → H2 (bold, paper) → body paragraph (paper/65) → button row (primary paper button + secondary dusk text link)
```

### 8.9 Article prose primitives (ArticleBody.tsx)
Reusable typographic components defined locally: `P`, `H3`, `H4`, `UL`, `OL`, `LI`, `Blockquote`, `Code`, `Pre` (with copy button), `HR` (decorative `* * *`), `Callout` (bordered aside box, `bg-parchment border-dusk rounded-[12px] p-[32px]`). These are the canonical building blocks for any future long-form article content — reuse them rather than writing new prose styles.

### 8.10 Form field pattern (email capture)
```
<input className="bg-paper/10 border border-paper/20 text-paper placeholder:text-paper/40 font-sans font-normal text-[16px] px-[20px] py-[14px] rounded-[8px] w-full focus:outline-none focus:border-paper/40 transition-colors duration-200" />
<button className="bg-paper text-ink font-sans font-medium text-[14px] tracking-[0.02em] px-[28px] py-[14px] rounded-[8px] hover:bg-parchment transition-colors duration-200" />
```
Both SynapseWaitlistForm and ResearchSubscribeForm follow this shape (form is `flex flex-col sm:flex-row gap-[12px]`, `max-w-[480px] mx-auto`), always on a dark background, with a `sr-only` label and `aria-live` status paragraph for a11y.

### 8.11 Navbar
Fixed, `z-50`, transitions between transparent (`py-[28px]`) and scrolled (`bg-paper/90 backdrop-blur-md border-b border-dusk py-3`) states at `scrollY > 20`. Desktop nav links: mono, uppercase, 12px. "Talk to Synapse" is always styled as the primary ink button, both desktop-inline and mobile-block. Mobile menu is a full-screen overlay (`fixed inset-0 z-40`), sibling of `<nav>` (not nested, to avoid backdrop-filter containing-block issues), staggered link reveal via `transitionDelay: i * 30ms`.

### 8.12 Footer
Centered layout: logo (opacity 30%, hover 50%) → copyright → nav link row → social icons + email row. All text `13px`, links use `text-ink/70 hover:text-ink hover:underline underline-offset-[3px]`.

---

## 9. Animation & Transition System

### Durations & easing (by purpose)
| Purpose | Duration | Easing |
|---|---|---|
| Micro interactions (color/opacity on hover) | `150ms` | `ease` |
| Standard transitions (link underline, button bg) | `150–200ms` | `ease` (Tailwind default) |
| Card hover (border+shadow) | `500ms` | `ease` (`transition-all duration-500`) |
| Reveal-on-scroll (`.reveal` class) | `0.55s` | `ease` — animates `opacity` + `transform: translateY(16px→0)` |
| Fade-up entrance (`animate-fade-up` / `fadeUp` keyframes) | `0.6s` (`0.8s` in ArticleBody) | `ease` / `ease-out` |
| Navbar scroll-state | `300ms` | default |
| Mobile menu overlay | `600ms` | `cubic-bezier(0.4,0,0.2,1)` |
| Hamburger icon morph | `300ms` | `ease-in-out` |
| Spotlight scroll-shrink | continuous RAF loop | lerp factor `0.1` (not CSS transition) |

### Mechanisms
1. **`.reveal` class + `RevealObserver.tsx`** — global `IntersectionObserver` (threshold 0.15) adds `.visible` class once an element enters viewport; defined in `globals.css`. This is the default "content fades/slides in on scroll" mechanism used on nearly every section wrapper.
2. **`animate-fade-up` + inline `animationDelay`** — used for staggered entrance on page load (Hero eyebrow/h1/p/CTA at 0.1s/0.25s/0.4s/0.55s intervals; Spotlight.css elements at 1.0s–1.5s to run after the hero).
3. **Manual RAF + lerp** (Spotlight.tsx only) — scroll-linked shrink/inset/radius/shadow animation, smoothed via linear interpolation (`factor 0.1`) rather than a CSS transition, because the values are being read every frame from scroll position.
4. **`transitionDelay` staggering** — used to cascade multiple sibling elements (card grids, focus areas, capability cards) via `${index * 50-80}ms` or `${index * 0.06-0.15}s` per item.

### Reduced motion
Every animation mechanism (`.reveal`, `.animate-fade-up`, Spotlight RAF loop) explicitly checks/respects `prefers-reduced-motion: reduce` — either via `window.matchMedia` (JS) or `@media (prefers-reduced-motion: reduce)` (CSS), snapping straight to the end state with zero animation. **Any new animated component must include this fallback.**

### Properties animated
Only `opacity`, `transform` (`translateY`, `translateX`, `scale`, `rotate`), `background-color`, `border-color`, `box-shadow`, and (Spotlight only) `width`/`margin-left`/`border-radius` via CSS custom properties driven by JS — i.e., compositor-cheap properties, never `top`/`left`/`height` animated directly via CSS transition (Spotlight's `will-change: width, margin-left, border-radius` is a deliberate, isolated exception).

---

## 10. Spotlight.css — Full Component Reference

The one non-Tailwind component stylesheet in the project (`src/components/Spotlight.css`). Kept as raw CSS because of the scroll-driven custom-property animation.

Key custom properties: `--sp-inset` (48px → 16px mobile), `--sp-radius` (20px → 16px mobile), `--sp-shadow` (0.18 → 0). Card is `display:grid; grid-template-columns: 1fr 1.5fr` desktop, stacks to `1fr` / `grid-template-rows: 240px 1fr` on mobile (≤768px). Content padding `56px 48px 56px 56px` desktop → `40px 24px` mobile. Full property values are documented inline in the file — treat that file as authoritative for any Spotlight-pattern reuse (e.g., a second "flagship spotlight" card elsewhere).

---

## 11. Accessibility Conventions (carry forward)

- `touch-manipulation` class on all interactive elements (removes 300ms tap delay)
- `useTouchShadow()` hook mirrors `:hover` visual state on `touchstart`/`touchend` for touch devices, applied via inline `style` override
- `focus-visible` outline: `2px solid rgba(11,11,11,0.72)` with `outline-offset: 3px` (global, `globals.css`)
- `::selection` custom styling matched per-background (light bg: `rgba(11,11,11,0.1)`; dark bg: `rgba(249,248,243,0.3)`) applied via `selection:` Tailwind variants on nearly every text block
- `sr-only` labels + `aria-live="polite"` status text on all forms
- Skip-link (`#main-content`) present in root layout
- Every `<main>` has `id="main-content"`

---

## 12. Rules for Future Work

1. **Never introduce a new color.** Use `paper`, `parchment`, `dusk`, `ink` and their opacity variants only. If a dark-bg equivalent is needed, use `paper` at reduced opacity (0.5–0.7 range), matching the existing pattern.
2. **Never introduce a new border-radius.** `8px` for buttons/pills/small containers, `12px` for large media/callouts. No other values except the animated Spotlight card.
3. **Reuse the eyebrow, button, and card patterns verbatim** (§8) — copy the className strings, don't reinvent.
4. **Section vertical rhythm:** default to `py-[80px] lg:py-[120px]` for full sections, `py-[72px] lg:py-[100px]` for CTA/strip sections, unless matching an existing narrower strip.
5. **New page headers** must follow the §8.6 template exactly.
6. **All headings use `clamp()` for responsive sizing** — never a fixed px heading size except H4 (16px) and card/UI micro-labels.
7. **New animated elements** must use the `.reveal` class (or `animate-fade-up` for load-time stagger) and must respect `prefers-reduced-motion`.
8. **Only animate compositor-cheap properties** (`opacity`, `transform`, color/shadow) per §9 — this is a deliberate performance decision, not an oversight.
