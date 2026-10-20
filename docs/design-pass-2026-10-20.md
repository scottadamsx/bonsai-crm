# Design pass, 2026-10-20

Rebuilt the UI against Scott's two spec docs: `~/workspace/ux-rules-16.md` (17 UX rules + Apple Cleanness Standard) and `~/workspace/design-patterns-top-apps.md` (Isolation Effect, Metric First Label Second, no pure black). Visual/design-system pass only: no schema changes, no new features, no new dependencies, no data changes.

## System-wide (globals.css, AppLayout)

- **Surface system (Ban Pure Black):** the Tailwind gray scale is remapped in `@theme` to a tinted off-black ramp: bg `#0a0f1a` (navy-tinted), raised surface `#101724`, inset/border `#1d2736`, strong border `#2e3d55`, with slightly lifted text grays. Every existing `gray-*` class now resolves to the tinted system; no `#000` or flat void anywhere (modal scrims remain translucent overlays, not surfaces). `color-scheme: dark` set.
- **Type scale (Apple rule 3, 5 steps):** Playfair Display is now reserved for page titles and the wordmark only. The old global `h1, h2` serif rule is gone; section headings render in DM Sans, and small section labels use DM Mono uppercase. Page titles unified at 28px Playfair. Body text never below 14px; 11-12px is used only for DM Mono labels/captions.
- **Accent discipline (Isolation Effect, Apple rule 2):** brand green is rationed to one primary action per screen plus the active nav state (desktop nav icon, mobile tab). Logo tiles went neutral (gray tile, green sprout glyph). All stat icons, "View all" links, section icons, and phone/email links are neutral gray now.
- **Layout (Apple rules 4 and 8):** content max width is now 1200px with 32px desktop padding; spacing follows the 4/8 rhythm.
- **Targets (Apple rule 1, Fitts):** nav links, sign-out, menu button, and mobile tabs are minimum 44px; the mobile bottom tab bar is unchanged in structure, with the active tab now carrying the green accent.

## Dashboard (/)

- **Hierarchy (Von Restorff):** the six identical stat cards are gone. Follow-ups Due is the single hero panel; Recent Activity is demoted to a plain hairline list beside it on wide screens (1fr + 360px grid), stacked on mobile.
- **Stats strip (Metric First, Label Second):** one horizontal strip with hairline top/bottom rules and thin dividers instead of boxes. DM Mono number first, small DM Mono uppercase label second. No icons, no green.
- **Copy:** the "Your sales at a glance" subtitle is deleted.
- **Empty states teach:** Follow-ups empty shows a calm "All caught up" hero state with one green "Log an activity" action (routes to Leads, where the activity flow lives). Recent Activity empty explains what will appear and offers the same action as a neutral button. Due rows now flag overdue dates in red.

## Inbox (/reminders)

- Section headers are DM Mono uppercase labels with counts (Overdue keeps semantic red; Due Today and Upcoming are neutral).
- "Done" buttons are neutral dark instead of green-tinted; phone and Done are 44px targets. Contact links hover white, not green.
- Empty state teaches: explains follow-ups are set from a lead, with a "Browse leads" action. No more dead-end text.

## Leads (/contacts)

- **Rule 17 (Recognition Over Recall):** the Type and Category `<select>` dropdowns are replaced with visible pill rows. The active pill stays visible (filled light neutral), and the "N leads" count moved to a DM Mono caption under the title so it stays accurate while filtering.
- **Table:** the card box around the list is removed. Hairline dividers, mono uppercase column headers, rows at ~50px with a hover state, neutral phone links.
- **Empty states teach:** zero leads shows "Add lead" (green, primary) plus "Import from CSV" (neutral). A filter with no matches shows a "Clear search and filters" action instead of a dead end.
- Add Lead modal inputs and buttons are 44px.

## Lead detail (/contacts/[id])

- Accent rationing: Log Activity keeps the one green primary; Set Follow-up and Call Now stay neutral. Follow-ups "Add"/"Done", phone and email links, and activity icons are neutral.
- Edit/Delete icon buttons are true 44px targets; back link too. Phone number, due dates, and timestamps render in DM Mono. All modal and edit-form inputs/buttons are 44px.

## Activities (/activities)

- **Rule 17:** the type `<select>` is now a visible pill row (All types, Calls, Emails, SMS, Meetings, Notes).
- Card boxes replaced with a hairline-divided list; activity icons neutral gray; timestamps in DM Mono.
- Empty state teaches with a "Log an activity" action to Leads.

## Pipeline (/pipeline)

- Drag and drop untouched. The Websites/Clubs switch is now a pill toggle with a neutral selected state (was a green block). Stage counts and all money values render in DM Mono; phone links neutral; card hover uses a real palette shade (the old `gray-750` class did not exist).

## Smart Views (/views) and Sequences (/sequences)

- Selected item state is neutral (gray border + raised background) instead of a green border; list icons neutral. Results are a hairline list with a DM Mono count; placeholder boxes removed.
- Delete glyphs replaced with Lucide X icons with aria labels and bigger targets (was a bare "×" text character).
- Sequences step numbers are DM Mono in neutral circles (were green-tinted). "New View"/"Create View" keep the green primary.

## Settings (/settings)

- Section icons neutral; pipeline toggle uses a neutral selected state. "New Template" is neutral; "Add Stage" keeps the green primary, and the template modal's Save keeps green inside the modal.
- The ↑ / ↓ / × text glyphs are now Lucide ChevronUp/ChevronDown/X icon buttons with aria labels and 44px-class targets.

## Login (/login) and Import (/contacts/import)

- Login logo tile is neutral with the Lucide Sprout mark (was a green square with a "B"); wordmark in Playfair with the app tracking. Focus rings are neutral gray; green lives only on Sign In.
- Import: the "←" text arrow is now a Lucide ArrowLeft with a 44px target; focus ring neutral; Import button keeps the green primary.

## Deliberately not done

- Priority stars stay yellow: they are a status marker, not the accent color, and changing them was not in the brief.
- No Thinking Orbs: there is no AI waiting state in this app yet; the patterns doc says not to use an orb where a skeleton or nothing communicates better.
- No new components or abstractions: every change reuses the existing Tailwind tokens and page structures (Ponytail).

## Verification

- `npm run build` passes with TypeScript clean and all 13 routes generated. Local builds need placeholder Supabase env vars to prerender (pre-existing: the untouched baseline fails identically without them; Vercel has the real vars).
- `npm run lint`: 40 problems after vs 42 before (all pre-existing `any`/hooks issues; this pass fixed two, added none). No test suite exists in this repo.

## Amendment (2026-10-20, later): serif removed

Scott rejected the serif outright: "I don't like the serif, I want the headers like things Lift Club." Checked against the clubhouse app (the Lift Club's own surface): its headings are a clean sans stack at weight 500, letter-spacing -0.015em, line-height 1.12. BONSAI now matches: Playfair Display is removed entirely (import, CSS variable, theme token). Page titles and the wordmark resolve to DM Sans; h1 carries weight 500, -0.015em tracking, 1.12 line height. DM Mono still carries numbers and labels. The "Lift Club fonts = Playfair" note in earlier records was wrong; Scott's direct statement and the clubhouse code are the spec.
