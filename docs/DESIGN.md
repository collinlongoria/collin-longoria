# Website design spec

Source of truth: Figma "New Website Design"
https://www.figma.com/design/cI80Cecyr49BXM1gofTBOm/New-Website-Design
Pages: Foundations · Desktop · Mobile. Exported frames live in `docs/frames/`.

## Decisions
- Permanent dark mode. No light theme.
- Home = **A Tidy** (straight grid). Messiness comes from Collin's own pixel art, not from layout.
- No filler copy: no taglines, no subtitles under page headings. Headings are just the page name.
- Home is reached by clicking the logo (no Home tab).

## Colour tokens
| token | hex | use |
|---|---|---|
| bg/base | #0A0A0B | page background |
| bg/raised | #121214 | sidebar, panels, inputs |
| bg/surface | #18181B | cards, image slots |
| bg/placeholder | #26262B | placeholder bars |
| border/subtle | #232327 | dividers, row separators |
| border/strong | #3A3A40 | input borders, secondary buttons |
| text/primary | #FFFFFF | main text |
| text/secondary | #A3A3AA | nav labels, secondary text |
| text/muted | #707078 | dates, meta, section labels |
| accent/burgundy | #6E1A2B | active nav, primary buttons (white text on top) |
| accent/burgundy-hover | #8A2236 | hover |
| accent/burgundy-deep | #2E0B13 | tag backgrounds |
| accent/burgundy-text | #D27A8C | links, tag text, status dot (burgundy tint legible on black) |

Never use #6E1A2B as small text on black (fails contrast).

## Type
- Display / headings / nav: **Silkscreen** (pixel, all caps). Sizes 32 / 24 / 16 only (multiples of 8). Fonts are final.
- Body: **Geist**. Post title 40 SemiBold, card title 16–18 SemiBold/Medium, body 17 / 160%.
- Meta: **Geist Mono** 11–12 (dates `YYYY-MM-DD`, read time, tags).

## Layout (desktop)
- Frame 1440 wide. Sidebar 248 expanded / 64 collapsed, full height, right border border/subtle.
- Main: padding 56 top, 64 sides, 96 bottom → content width 1064. Section gap 40–56.
- Reading column 680 (posts, about). Story reader text column 640 with sticky chapter list on the left.
- Radius: 4 (buttons, cards), 6 (panels), 999 (filter chips).

## Components
- **Sidebar**: wordmark logo (animated GIF, 184 wide; it is the title, no separate name) → status box (dot + `Currently feeling [feeling]` from the latest thought, bg/surface) → nav (8 items) → spacer → collapse button (32×32, «/»). Collapsed = 64px icon rail: "CL" in Silkscreen, status dot, icons, expand button.
- **Nav item**: 16px icon slot + label, padding 10, radius 4. Active = burgundy fill, white label/icon.
- **Section header**: Silkscreen 16 muted label + "all →" (Geist Mono 12) right-aligned.
- **Game card**: capsule 460×215 ratio (340×159 in 3-col grid), title, `[status] · [year]`.
- **Story card**: 2:3 cover (200×300, 5-col grid), title, type tag (book / short story / screenplay).
- **Post row**: date column (96) | title (Medium 18), one-line excerpt, tags. Bottom border.
- **Thought**: text, then an optional muted line `Currently feeling [feeling]`, then footer: timestamp · ↗ X · ↗ Threads. Body + feeling together fit 280 (X).
- **Guestbook entry**: name, location (muted), date, message; Admin=On adds × delete button.
- **Buttons**: primary = burgundy fill; secondary = border/strong outline. Tags = burgundy-deep bg + burgundy-text mono.
- **Filter chips**: pill; active = white fill with black text, others outlined.

## Pages
- **Home (Tidy)**: intro (pixel portrait 112 + text) → Pinned (big capsule 616×288 + title, meta, link button) → Blog | Devlogs (two columns, 4 compact rows each) → Thoughts (2 side by side) → Stories (4 covers) → Games (3 capsules).
- **About Me**: heading, optional image, markdown body.
- **Games**: 3-col capsule grid. **Game page**: ← Games, hero (library hero 3840×1240), title + meta, markdown body (680) + meta panel (Status, Platforms, Engine, Released, Role, store/links buttons, related devlogs).
- **Stories**: filter chips (all/books/short stories/screenplays), 5-col cover grid. **Reader**: collapsed sidebar, cover + type + title + meta, Download PDF + chapter picker, chapter list + 640 text column, prev/next chapter. Screenplays via Fountain. PDF generated at build.
- **Blog**: filter chips (personal/politics/news), featured latest post (title 40 + excerpt + optional image), next two posts, "Older" list of post rows.
- **Post template** (Blog + Devlogs): back link, tags, title, date · read time, markdown (h2, blockquote with 3px burgundy left border, images, code blocks on bg/raised), prev/next.
- **Devlogs**: project filter chips, rows: date | project tag + #number, title, excerpt | 192×108 gif thumb.
- **Thoughts**: feed column 600. Signed in: "you · sign out" pill + composer (textarea, feeling field, X/Threads toggles, 0/280 counter covering body + feeling line, Post). Sign-in at hidden route (/login).
- **Guestbook**: sticky form 360 (name, location, message, Turnstile captcha, Sign) | entries list with count.
- **Contact**: form 560 (name, email, message, Send → PHP mail).
- **Footer** (every page): top border, `© <year> Collin Longoria` left, social icons right (Geist Mono 12, fg-3, hover fg).

## Mobile (to finish during build)
- Top bar 56: wordmark 40 tall, status dot, menu button. Menu opens a 300px drawer (same content as sidebar) over a scrim.
- Single column, 20px side padding. Grids collapse to 1 column (games) or horizontal scroll (stories).

## Behind the scenes
See `docs/GUIDE.md` for how the site is built, run and deployed.
