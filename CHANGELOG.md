# Changelog

## 2.0.0

### Fixed

- **Same-tick imperative calls no longer see stale state.** `open()` followed by `push()` in one event handler previously replaced the stack instead of stacking; two `pop()` calls in one tick popped once. The internal stack ref is now synchronized at set-time instead of in an effect. (Regression tests in `Drawer.bugs.test.tsx`.)
- **`push()` during the close transition no longer wedges the page.** It used to cancel the pending stack-clear, append to the dying stack, and never re-reveal — leaving an invisible full-screen overlay that swallowed every click. It now cleanly reopens the drawer with the pushed layer.
- **`showHeader: false` no longer leaves the dialog unnamed.** `aria-labelledby` pointed at a title element that was not rendered; the dialog now falls back to `aria-label` with the layer title.
- **`onClose` is now a reliable per-layer dismissal callback.** Every layer fires it exactly once when it leaves the stack — popped, removed via breadcrumb navigation, replaced by `open()`, or on full close (top-most first). Previously only the top layer at close time ever heard about it.
- **Escape handling hardened.** Ignored during IME composition (`isComposing`) and when a nested widget already called `preventDefault()`; when several drawers are mounted, only the top-most open drawer responds to Escape and traps Tab (one keypress no longer closes all of them). Escape during the close transition no longer restarts the close timer.
- **Focus management on stack changes.** Pushing, popping, and breadcrumb navigation now move focus into the newly revealed top layer instead of dropping it on `<body>`. Focus restoration on close runs after background `inert` is lifted; unmounting while open also restores focus.
- **Scroll lock compensates scrollbar width.** Opening the drawer no longer shifts the page layout; previous inline `overflow`/`padding-right` values are restored.
- **Packaging.** `package.json` no longer starts with a UTF-8 BOM; `exports` provide per-condition type declarations (`.d.mts` for ESM), fixing "masquerading as CJS" under `moduleResolution: node16`; `typesVersions` covers legacy resolvers; build output carries a `"use client"` banner so the components work in RSC environments (Next.js App Router).
- **Docs.** README examples used a wrong package name and a nonexistent `theme` prop; corrected to `@jslibkit/react-common-drawer` and `classNames` everywhere, examples included.

### Added

- **Placements**: `placement` prop with `end` (default), `start`, `left`, `right`, `top`, `bottom`. `start`/`end` resolve against the document direction, making RTL work automatically. Both the pure CSS and the Tailwind preset style all placements via `data-placement`.
- **`closeOnEscape`, `closeOnBackdrop`** opt-outs for dirty-form flows.
- **`inertBackground`** (default on): background content receives `inert` while the drawer is open; refcounted across instances.
- **`zIndex`** prop.
- **Per-layer `initialFocus`** selector and a free-form `meta` slot on layers.
- **`prefers-reduced-motion`** support in both styling modes.
- **Headless entrypoint** `@jslibkit/react-common-drawer/headless`: the previously unshipped `HeadlessDrawer` is now built, exported, and documented; it shares the same behavior engine and supports placements and render-prop overrides. It also respects `showHeader: false` now.
- **`./package.json`** export and a CHANGELOG.

### Changed

- Internal: the two React entrypoints are now thin wrappers around one shared view (`DrawerView.shared.tsx`), removing ~250 lines of drift-prone duplication.
- `onClose` semantics as described under Fixed — if you relied on lower layers being skipped at close, gate on your own state.

### Breaking

- `onClose` now fires for layers dismissed by replacement/navigation, not only the top layer at close.
- Background content is `inert` by default while the drawer is open (pass `inertBackground={false}` to restore the old behavior).
- Custom CSS that targeted `.common-drawer__panel`'s bare `translate` values must key on `data-placement` (the packaged CSS already does).

## 1.0.2

Initial public version.
