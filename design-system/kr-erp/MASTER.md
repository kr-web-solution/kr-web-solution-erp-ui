# KR ERP — Design System Master

> Hands-on operations ERP. Source: ui-ux-pro-max design-system search
> (`enterprise CRM ERP pipeline delivery`, variance 4 / motion 3 / density 8)
> **adapted** to KR Web Solution brand. Do **not** replace KR red/yellow with
> generic SaaS blue.

## Product framing

| | |
|---|---|
| **Product** | B2B ERP/CRM — sales pipeline (01–05) → project delivery (06–11) |
| **Users** | Founder/CEO, workers, clients — daily operators, not casual consumers |
| **Goal** | Fast task completion: advance stages, upload docs, invoice, track delivery |
| **Feel** | Dense, calm, decisive — “tool in the hand”, not marketing dashboard |

## Design dials

- **Variance:** 4 — balanced, grid-first, no brutalism/bento chaos
- **Motion:** 3 — subtle only (150–200ms color/opacity); skip under `prefers-reduced-motion`
- **Density:** 8 — dashboard spacing 8–32px; body 14/20; compact tables & boards

## Theme (recommended)

**Name:** KR Flat Ops (Flat Design + Minimal Swiss discipline)

| Keep | Drop |
|------|------|
| Flat surfaces, clear borders, typography hierarchy | Glassmorphism, multi-layer shadows, 3D |
| One brand accent system (red + yellow) | Purple/indigo SaaS defaults |
| Lucide outline icons, consistent 1.5–2px stroke | Emoji icons, mixed fill/outline at same level |
| Light mode as default ops surface | Dark-as-default (optional later for finance night shift) |

## Color tokens (KR — use these, not skill blue)

| Role | Hex | Usage |
|------|-----|--------|
| **Brand primary** | `#E32B2B` | Primary actions, focus ring, current stage, destructive-adjacent brand |
| **Brand primary hover** | `#C81F26` | Hover |
| **Brand primary active** | `#A8171E` | Pressed |
| **Brand tint** | `#FFF1F0` | Selected rows, soft alerts |
| **Accent / CTA** | `#FADC59` | Advance stage, “go” buttons, attention chips |
| **On accent** | `#5B4300` / `#0F172A` | Text on yellow (prefer ink for buttons) |
| **Accent tint** | `#FEF6D8` | Kanban column wash, highlight panels |
| **Ink** | `#12141C` / `#0F172A` | Sidebar, headings, body |
| **Background** | `#F6F7F9` | App chrome |
| **Surface** | `#FFFFFF` | Cards, sheets, drawers |
| **Border** | `#E6E8EE` | Dividers, inputs |
| **Muted** | `#64748B` | Secondary labels |
| **Success** | `#16A34A` + `#E8F7EE` | Paid, done, won |
| **Info** | `#2563EB` + `#E8F0FE` | Links, informational only — **not** brand primary |
| **Danger** | `#B91C1C` + `#FDECEC` | Errors, overdue (pair with icon/text) |

### Color rules (hands-on)

1. **Red = brand + urgency**, never “error only”. Errors use danger + icon + text.
2. **Yellow = forward motion** (advance, handoff, primary CTA on stage screens).
3. **Green/blue = semantic status only** — do not rebrand the product blue.
4. Status never by color alone (label + icon).
5. Focus ring: `2px solid #E32B2B`.

## Typography

| Role | Font | Notes |
|------|------|--------|
| **Heading** | Plus Jakarta Sans | Keep existing — already ERP-ready |
| **Body** | Inter / system sans via `--font-sans` | 14px / 20px base |
| **Optional upgrade** | Lexend + Source Sans 3 | Only if rewriting font stack; not required |

### Type scale (locked)

- h1: 28/36/700 −0.02em
- h2: 18/26/600 −0.01em
- h3: 15/22/600
- Body: 14/20
- Meta/labels: 11–12px, uppercase sparingly (section eyebrows only)
- Money/IDs: `.tabular-nums`

## Spacing (density 8)

```
--space-1: 8px
--space-2: 12px
--space-3: 16px
--space-4: 20px
--space-5: 24px
--space-6: 32px
```

- Page padding: `16px` mobile → `24–32px` desktop (prefer tighter than marketing `p-8` on data pages)
- Card padding: `16–20px`
- Board column gap: `12–16px`
- Table row height: ~40–44px

## Layout structure (best ERP IA)

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │ TopBar (search / role / notifications)  │
│ 264→76   ├─────────────────────────────────────────┤
│ ink-900  │ PageHeader: title · filters · primary   │
│          │ CTA                                     │
│ MAIN     ├─────────────────────────────────────────┤
│ SALES    │ Main: one job per view                  │
│ FINANCE  │  - Board OR table OR stage workspace    │
│ ADMIN    │  - Sticky stage rail on engagement      │
└──────────┴─────────────────────────────────────────┘
```

### Navigation groups

1. **MAIN** — Dashboard, Projects, Clients  
2. **SALES** — Pipeline, Leads  
3. **FINANCE** — Invoices  
4. **ADMIN** — Settings  

Role-aware labels: Pipeline → “My Delivery” / “My Progress” for worker/client.

### Page patterns

| Page | Pattern | Hands-on rule |
|------|---------|----------------|
| Dashboard | KPI strip + work queue + alerts | Max 4 KPIs; rest is actionable list |
| Pipeline board | 5 columns (01–05), compact cards | Yellow wash on active columns; drag + keyboard move |
| Engagement detail | Stage stepper + stage workspace | One primary CTA: advance / upload / handoff |
| Projects | Dense table + delivery stepper tab | Features/docs as work panels, not marketing cards |
| Finance | Paper-like invoice + status table | Tabular nums; green = paid |

### Charts

- Pipeline conversion: **funnel** (3–8 stages) or stage table fallback
- Delivery progress: linear stepper / stacked bar — not decorative pie

## Interaction (operator UX)

- Primary CTA always visible in stage footer / page header
- Forms: validate on blur; after failed submit → focus error summary + inline errors
- Async: skeletons / pulse — never frozen blank
- Kanban: drag optional; always provide move-up/down or stage menu (WCAG 2.2)
- Motion: 150–200ms ease; no scroll-hijack GSAP on ops screens
- Clickable: `cursor-pointer` + hover border/bg — no layout-shifting transforms

## Anti-patterns (avoid)

- Generic blue primary replacing KR red
- Glass cards / heavy shadows / glow
- Hero marketing blocks inside authenticated app
- Stat strips competing with the work queue
- Purple-on-white AI-default themes
- Emoji as nav/status icons
- Color-only status
- Spacious marketing padding on tables/boards

## Stack notes (Next.js + Tailwind)

- Fonts on `body` in root layout only
- Skeletons for async regions (avoid CLS)
- Prefer tokens from `globals.css` `@theme` over raw hex in new code
- Lucide icons; decorative → `aria-hidden`

## Implementation priority

1. ~~Token discipline~~ — `globals.css` ops tokens + utilities (`ops-surface`, `ops-page`, density scale)  
2. ~~Pipeline density + stage move menu~~ — flat board, advance/regress menu (not drag-only)  
3. ~~Stage screens~~ — `StageAdvanceBar` yellow CTA; flat `StageShell`  
4. ~~Dashboard work-queue first~~ — needs-you + KPIs + status table (no vanity pie/funnel)  
5. Optional dark mode later (ink surfaces + same brand accents)
