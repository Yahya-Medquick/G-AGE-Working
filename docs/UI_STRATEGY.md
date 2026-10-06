# UI strategy

## Direction

Keep the current React/Tailwind v4/Lucide stack and working API flows. Reorder
the product around Subjects and one obvious next action; make Me/profile the
home for infrequent tools. Keep assistant answers flat, user messages distinct,
and filters, Explore and reply actions progressively disclosed. Do not revive
the unmounted category/search surfaces.

## Tokens

`src/styles/tokens.css` is the only source of design color values. Light/dark
surfaces share the same semantic names; subject and callout colors are limited
to the five subject tints plus equation/exam-tip semantics. Spacing uses a
4-point scale (4, 8, 12, 16, 24, 32, 48; 64 only for hero spacing), with
8/12/16/24/pill radii, three elevation levels, and 120/180/260ms motion tokens.
Typography retains the existing system stack until the product font asset is
verified; body text is 16px and answer line-height is relaxed.

`npm run check:tokens` guards stylesheets and shared UI primitives against new
raw hex colors and checks required light/dark text pairs for WCAG AA. Existing
feature-specific TSX modules still contain legacy arbitrary colors; migrate
them to semantic tokens as each surface is redesigned rather than masking that
debt with a repository-wide exception.

## Component rules

- Buttons have one primary treatment per view; icon-only buttons need an
  accessible name, and all controls use semantic focus styling.
- Inputs remain at least 16px; tiles and sheets are the only routine grouped
  surfaces. Avoid nested cards and use dividers/whitespace for hierarchy.
- Avatars use initials and muted fills; badges carry text as well as color.
- Skeleton, empty-state, callout and toast primitives accept localized content
  from their caller instead of embedding UI copy.
- Chat is a centered reading column; only user messages are filled bubbles.
  Composer controls, filters and Explore should remain visually distinct and
  touch accessible in both themes.

## Navigation and responsive behavior

Desktop keeps the existing three-column shell until each feature is migrated;
mobile uses full-screen chat and bottom-sheet/drawer patterns rather than
shrinking desktop panels. Keep focus visible, safe-area aware and content
within the viewport. Urdu shell direction follows the selected UI language;
assistant paragraphs keep their current paragraph-level direction behavior.
