# StraySync Palette — Single Source of Truth

The **only** place to change colors is `src/app/globals.css`, inside the
`:root` block at the top. Every component references these tokens through
Tailwind utility classes (`bg-paper`, `text-accent`, `stroke-highlight`, etc.)
or inline `var(--token)` in SVG attributes.

## The 12 tokens

| Token | Current | Used for |
|---|---|---|
| `--paper` | `#EDECE7` | Page background, panel background, silhouette paper fill |
| `--paper-card` | `#F5F4F0` | Card background (cat blocks, modals, panels) |
| `--paper-hover` | `#FAF9F6` | Hover state for interactive paper surfaces |
| `--paper-muted` | `#DCDBD5` | Darker step (rarely used, for nested panels) |
| `--accent` | `#A01AB1` | Primary accent — buttons, RX labels, active states, ink-top edge |
| `--accent-hover` | `#84108F` | Hover state for accent buttons |
| `--highlight` | `#3FD6CA` | Secondary accent — badges, eyes, ears, safety pin, "%" pill |
| `--highlight-hover` | `#63E0D5` | Hover state for highlight buttons |
| `--ink` | `#0d0d0d` | Text, borders, shadows |
| `--ink-muted` | `#3a3a3a` | Secondary text |
| `--pencil` | `#666666` | Tertiary text (rarely used) |

## Tailwind utility names

Each token maps automatically:
- `--color-paper` → `bg-paper`, `text-paper`, `border-paper`, etc.
- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- Same for `--color-highlight`, `--color-ink`, `--color-ink-muted`, ...

For box shadows with a color, use the CSS variable directly:
`shadow-[4px_4px_0_0_var(--accent)]`

## Changing the palette

1. Edit the hex values inside `:root` in `globals.css`.
2. Update `background_color` in `src/app/manifest.ts` to match the new `--paper`.
3. Done. No component edits needed.

## Adding a new accent color (e.g. an error/warning state)

1. Add `--error: #ff3355;` to `:root` in `globals.css`.
2. Add `--color-error: var(--error);` inside `@theme`.
3. Use `bg-error`, `text-error`, `border-error` anywhere.