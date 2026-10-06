# UI self-review

## Scope and result

This is a code-level review of the redesign work currently implemented. It is
not a visual or release sign-off: no browser automation package is installed
in the workspace, and no Railway staging/PR environment was available for
interactive testing.

## Checklist

| Area | Result | Notes |
|---|---|---|
| Phone widths: 320, 375, 390, 430 | Not visually verified | The app uses a dynamic viewport, a safe-area-aware mobile tab bar, and a capped message column. Test for clipping and keyboard overlap in a browser. |
| Tablet: 768 | Not visually verified | Responsive breakpoints compile; inspect sidebar and teacher panel behavior at tablet width. |
| Laptop: 1024 | Not visually verified | Sidebar defaults and three-column transitions remain driven by existing breakpoints. |
| Desktop: 1280 and 1536+ | Not visually verified | Reading column is capped; right panel behavior needs browser confirmation. |
| Light and night themes | Partially checked | Design-token contrast script passes required text-pair checks. Visual inspection of every active surface remains outstanding. |
| Urdu RTL | Not visually verified | Subjects home follows Urdu direction; assistant paragraphs and tables preserve direction-aware rendering. Verify mixed Latin/Urdu, inputs, menus, and tab order visually. |
| Keyboard and screen reader | Partially checked | New mobile tabs and reply controls have labels and focus styles. No screen-reader or full keyboard audit has been run. |
| Spacing and tokens | Checked for shared token sources | `npm run check:tokens` passes. Legacy feature-specific modules still contain pre-existing ad-hoc styling. |
| Message/code/table overflow | Partially checked | Message text can break long words; code blocks and tables use bounded horizontal scrolling. Stress cases such as 300-character code lines and wide tables need browser testing. |
| Core UI build and tests | Checked | `npm run lint`, `npm test` (28 tests), and `npm run build` pass. |
| First-run 5-second test | Not verified | Requires a 390px browser session and first-run storage state. |
| Staging-only deployment and API smoke | Not run | Requires owner-configured Railway staging/PR environment and staging credentials. |

## Known build output

The build still reports the existing missing Nastaleeq font asset, the
`CompiledNotesModal` static/dynamic import split warning, and a main JavaScript
chunk over 500 kB. No reliable clean-start bundle baseline was captured for
this review, so a before/after percentage is not claimed.

## Outstanding release checks

- Run visual and accessibility QA at every requested viewport in both themes,
  including the keyboard-open state and first-run storage state.
- Run the staging smoke script and empty staging database boot/idempotency
  checks in the owner-managed Railway PR environment only.
- Complete response-shape coverage for all required client endpoints and
  record the staging smoke results.
- **TODO(owner):** supply verified catalog titles, board/publisher details,
  persona-group mappings, and starter topics before adding catalog records.
