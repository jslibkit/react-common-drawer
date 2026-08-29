# @jslibkit/react-common-drawer

A practical drawer library for React with one job: mount once, keep a ref somewhere sensible, and open drawers from wherever you need them.

It supports:

- React 18 via `@jslibkit/react-common-drawer/react18`
- React 19 via `@jslibkit/react-common-drawer/react19`
- a headless build via `@jslibkit/react-common-drawer/headless`
- `pure` styling mode backed by the package CSS file
- `tailwind` styling mode backed by a class-name object you create in your app
- nested drawer layers through `open`, `push`, `pop`, and `close`
- placements: `end` (default), `start`, `left`, `right`, `top`, `bottom` — `start`/`end` follow the document direction, so RTL apps work without configuration
- optional footer and optional header per layer
- root-level mounting with a shared registry helper
- focus trapping, focus restoration, per-layer `initialFocus`, background `inert`, scroll locking with scrollbar-width compensation, and `prefers-reduced-motion` support

This README is intentionally detailed. It is written for the future when we forget how this worked after two weeks, not for internet applause.

## Guides

- [INSTALLATION.md](INSTALLATION.md) — step-by-step setup for a brand-new project, from `node -v` to a working drawer.
- [UPGRADING.md](UPGRADING.md) — step-by-step upgrade from 1.x to 2.0.0, including all three breaking changes.
- [CHANGELOG.md](CHANGELOG.md) — what changed in each version.
- [RELEASING.md](RELEASING.md) — maintainer guide for publishing to npm and GitHub (kept in the repo, not shipped in the package).

## Mental model

Think of the drawer as a single mounted component that owns an internal stack.

- `open(layer)` replaces the whole stack with a new root layer.
- `push(layer)` adds a new layer on top of the current one.
- `pop()` removes the top layer.
- `close()` closes the entire drawer.

If you only use `open()` and `close()`, it behaves like a normal side drawer.
If you also use `push()`, it behaves like a stacked workflow drawer.

## Package structure

Public entrypoints:

- `@jslibkit/react-common-drawer`
  Exposes shared types, class-name helpers, and the drawer registry helper.
- `@jslibkit/react-common-drawer/react18`
  Exposes the React 18 drawer component (`forwardRef`).
- `@jslibkit/react-common-drawer/react19`
  Exposes the React 19 drawer component (`ref` as a prop).
- `@jslibkit/react-common-drawer/headless`
  Exposes `HeadlessDrawer`: same behavior engine, zero styling, render-prop slots.
- `@jslibkit/react-common-drawer/drawer.css`
  CSS file used by `cssMode="pure"`.

Useful exports from the root package:

- `createDrawerRegistry`
- `createDrawerClasses`
- `PURE_DRAWER_CLASS_NAMES`
- `TAILWIND_DRAWER_CLASS_NAMES`
- `DrawerHandle`
- `DrawerSize`
- `DrawerPlacement`

## Installation

```bash
npm install @jslibkit/react-common-drawer react react-dom
```

If you use `cssMode="pure"`, import the CSS once:

```tsx
import '@jslibkit/react-common-drawer/drawer.css'
```

If you use `cssMode="tailwind"`, do not import `drawer.css`. Instead, create a class-name object in your application source and pass it to the component.

## Quick start

### React 18 + pure mode

```tsx
import '@jslibkit/react-common-drawer/drawer.css'
import { CommonDrawer } from '@jslibkit/react-common-drawer/react18'
import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/react-common-drawer'

const drawer = createDrawerRegistry<DrawerLayer>()

export function App() {
  return (
    <>
      <Routes />
      <CommonDrawer ref={drawer.ref} cssMode="pure" />
    </>
  )
}
```

### Open it from anywhere

```tsx
import { drawer } from './drawerRegistry'

drawer.open({
  title: 'Edit profile',
  content: <ProfileForm />,
})
```

That is the basic pattern this library is designed for.

## Core concepts

### 1. Mount once near the root

The drawer is not intended to be sprinkled across the tree. Mount it once, near your app shell or root layout.

### 2. Save the ref through a registry

The registry helper gives you a stable place to store and reuse the imperative handle.

```ts
import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/react-common-drawer'

export const drawer = createDrawerRegistry<DrawerLayer>()
```

Then pass `drawer.ref` into the mounted component.

### 3. Pass layers, not booleans

You do not manage `isOpen` or `currentScreen` state yourself. Instead, you pass complete layer objects:

```tsx
drawer.open({
  title: 'Account settings',
  size: 'lg',
  content: <SettingsForm />,
  footer: <SaveActions />,
})
```

## API reference

### `DrawerLayer`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | required | Used for the header title and dialog labelling. |
| `content` | `ReactNode` | required | Main drawer body. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Width preset (height preset for `top`/`bottom` placements). |
| `footer` | `ReactNode` | `undefined` | Optional footer section. |
| `showHeader` | `boolean` | `true` | Hides the entire header when `false` (the dialog is then labelled via `aria-label`). |
| `onClose` | `() => void` | `undefined` | Runs once when this layer is dismissed — popped, removed via breadcrumb navigation, replaced by `open()`, or when the whole drawer closes. |
| `initialFocus` | `string` | `undefined` | CSS selector, resolved inside the panel, that receives focus when this layer becomes the top layer. |
| `meta` | `unknown` | `undefined` | Free slot for app-specific data attached to a layer. |

### `CommonDrawer` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `transitionMs` | `number` | `280` | Animation duration. |
| `portalTarget` | `Element \| null` | `document.body` | Where the drawer portals to. |
| `cssMode` | `'pure' \| 'tailwind'` | `'pure'` | Which class-name preset to start from. |
| `classNames` | `Partial<CommonDrawerClassNames>` | `undefined` | Per-slot class overrides (see the theme system below). |
| `placement` | `'start' \| 'end' \| 'left' \| 'right' \| 'top' \| 'bottom'` | `'end'` | Edge the drawer slides in from. `start`/`end` respect the document direction (RTL-aware). |
| `closeOnEscape` | `boolean` | `true` | Escape pops the top layer (closes at root). Ignored during IME composition and when a nested widget already handled the key. |
| `closeOnBackdrop` | `boolean` | `true` | Clicking the backdrop closes the drawer. |
| `inertBackground` | `boolean` | `true` | Applies `inert` to background content while the drawer is open. |
| `zIndex` | `number` | preset value (`1000`) | Overrides the z-index of the drawer root. |

### `DrawerHandle<TLayer>`

| Method | Signature | Meaning |
| --- | --- | --- |
| `open` | `(layer: TLayer) => void` | Replace the entire stack. |
| `push` | `(layer: TLayer) => void` | Add a nested layer on top. |
| `pop` | `() => void` | Remove one layer, or close at root. |
| `close` | `() => void` | Close the whole drawer. |

Rapid sequences are safe: `open()` followed by `push()` in the same tick stacks correctly, two `pop()` calls in one tick pop two layers, and calling `open()`/`push()` while the drawer is mid-close reopens it cleanly (the interrupted layers still get their `onClose`).

### `DrawerRegistry<TLayer>`

The object returned by `createDrawerRegistry()` exposes:

- `ref`
- `getHandle`
- `open`
- `push`
- `pop`
- `close`

It is just a convenience wrapper around the imperative handle so the component can stay mounted at the root while the rest of the app can open it from elsewhere.

## Styling modes

### `cssMode="pure"`

Use this when you want the package CSS.

Pros:

- easiest setup
- no Tailwind scanning concerns
- reliable default styling

Requirements:

```tsx
import '@jslibkit/react-common-drawer/drawer.css'
```

Optional override path:

You can still pass `classNames` in pure mode if you want to replace specific class names with your own CSS module or CSS class contract.

### `cssMode="tailwind"`

Use this when you want the structure and behavior from the component, but want Tailwind utility classes for styling.

Important:

Tailwind mode should be paired with a class-name object created in your own app source. That is the safest way to ensure Tailwind sees the classes during scanning.

```ts
import { createDrawerClasses } from '@jslibkit/react-common-drawer'

export const drawerTheme = createDrawerClasses('tailwind')
```

Then:

```tsx
<CommonDrawer ref={drawer.ref} cssMode="tailwind" classNames={drawerTheme} />
```

## Theme system

### Built-in presets

The package exports two preset objects:

- `PURE_DRAWER_CLASS_NAMES`
- `TAILWIND_DRAWER_CLASS_NAMES`

These are useful as references, or as a base when you want to inspect or extend the default slot map.

### `createDrawerClasses(mode, overrides)`

This helper returns a complete class-name object.

```ts
import { createDrawerClasses } from '@jslibkit/react-common-drawer'

export const drawerTheme = createDrawerClasses('tailwind', {
  panelLg: 'max-w-3xl',
  header: 'flex items-center gap-3 border-b border-zinc-200 px-6 py-5',
  content: 'flex-1 overflow-y-auto px-6 py-5',
})
```

### Available theme slots

- `root`
- `backdrop`
- `panel`
- `panelSm`
- `panelMd`
- `panelLg`
- `panelXl`
- `panelFull`
- `breadcrumb`
- `breadcrumbItem`
- `breadcrumbButton`
- `breadcrumbCurrent`
- `header`
- `title`
- `iconButton`
- `content`
- `footer`

Placement is expressed through `data-placement` attributes on the root and panel elements, so both the pure CSS file and the Tailwind preset style all four placements out of one slot set.

## Tailwind setup

Tailwind mode only works when Tailwind scans the drawer class strings.

### Tailwind v4

Dependencies in `node_modules` are ignored by default. Add the package as a source in your main stylesheet:

```css
@import "tailwindcss";
@source "../node_modules/@jslibkit/react-common-drawer";
```

Adjust the relative path to match your project.

If you create your `drawerTheme` in your own app source, Tailwind will see those classes there as well, which is why that path is recommended.

### Tailwind v3

Add the package build output to the `content` array in `tailwind.config.js` or `tailwind.config.ts`:

```ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@jslibkit/react-common-drawer/dist/**/*.{js,mjs}',
  ],
}
```

Again, if your local `drawerTheme.ts` file lives inside your app source, Tailwind will also detect the classes there.

## Headless mode

`HeadlessDrawer` reuses the exact same behavior engine (stack, focus trap, scroll lock, Escape handling, `inert`) but renders unstyled elements with `data-drawer-*` attributes, and every section can be replaced through render props:

```tsx
import { HeadlessDrawer } from '@jslibkit/react-common-drawer/headless'

<HeadlessDrawer
  ref={drawer.ref}
  renderPanel={({ dialogProps, panelRef, visible, children }) => (
    <aside {...dialogProps} ref={panelRef} data-open={visible} className="my-panel">
      {children}
    </aside>
  )}
/>
```

Available render props: `renderBackdrop`, `renderPanel`, `renderHeader`, `renderBreadcrumb`, `renderContent`, `renderFooter`, plus `BackIcon`, `CloseIcon`, and `BreadcrumbSeparator` overrides. `placement`, `closeOnEscape`, `closeOnBackdrop`, and `inertBackground` work the same as on `CommonDrawer`.

## Behavior details

### Focus handling

- opening moves focus into the drawer (honoring the layer's `initialFocus` selector when given)
- pushing, popping, and breadcrumb navigation move focus into the newly revealed top layer
- Tab navigation stays inside the drawer; when several drawers are mounted, only the top-most open one traps keys
- focus is restored to the original trigger when the drawer closes, after background `inert` has been lifted

### Close behavior

The drawer can close through:

- `close()`
- root-level `pop()`
- backdrop click (unless `closeOnBackdrop={false}`)
- `Escape` (unless `closeOnEscape={false}`)

`onClose` is a per-layer dismissal callback: every layer receives it exactly once when it leaves the stack, whatever the reason (pop, breadcrumb navigation, replacement via `open()`, or full close). When several layers are dismissed at once they fire top-most first.

### Scroll locking

The drawer locks `document.body` scroll while open, compensates `padding-right` for the removed scrollbar so the page does not shift, and restores the previous inline values when closing. Locking is refcounted across drawer instances.

### Background isolation

While open, sibling elements of the drawer (inside the portal target) get the `inert` attribute, so background content is unreachable by keyboard, screen readers, and clicks. Disable with `inertBackground={false}`. The bookkeeping is refcounted, so overlapping drawers restore state correctly.

### State in lower layers

Only the top layer's content is mounted. When you `push()`, the layer below unmounts, and its local component state is gone by the time you `pop()` back. Keep form state that must survive stacking outside the layer content (a store, context, or the `meta` slot).

### Animation

Both modes animate; both respect `prefers-reduced-motion` and skip transitions for users who ask for that.

Pure mode:

- uses the packaged CSS transitions, keyed off `data-placement` and `data-visible`

Tailwind mode:

- backdrop fades using `transition-opacity`
- panel slides using placement-aware `data-[placement=...]` translate utilities
- duration follows `transitionMs`

## Common patterns

### A simple form drawer

```tsx
drawer.open({
  title: 'Edit profile',
  content: <ProfileForm />,
  footer: <SaveActions />,
})
```

### A nested workflow

```tsx
drawer.open({
  title: 'Team',
  content: (
    <TeamView
      onEditMember={(member) => {
        drawer.push({
          title: 'Edit member',
          content: <MemberForm member={member} />,
          footer: <MemberActions member={member} />,
        })
      }}
    />
  ),
})
```

### A content-only screen with no header

```tsx
drawer.open({
  title: 'Preview', // still used as the dialog's accessible name
  showHeader: false,
  content: <ImageViewer />,
})
```

### A bottom sheet

```tsx
<CommonDrawer ref={drawer.ref} placement="bottom" />
```

### A bigger Tailwind panel

```ts
import { createDrawerClasses } from '@jslibkit/react-common-drawer'

export const drawerTheme = createDrawerClasses('tailwind', {
  panelLg: 'max-w-4xl',
  panelXl: 'max-w-6xl',
})
```

## Example folders

The repository includes example folders for all supported combinations:

- [examples/react18-pure/README.md](examples/react18-pure/README.md)
- [examples/react18-tailwind/README.md](examples/react18-tailwind/README.md)
- [examples/react19-pure/README.md](examples/react19-pure/README.md)
- [examples/react19-tailwind/README.md](examples/react19-tailwind/README.md)

These are intentionally small reference examples, not a festival of clever abstractions.

## Migrating from 1.x

- The package README previously referred to a `theme` prop; the real prop is `classNames` and the docs now agree.
- `onClose` now fires for every dismissed layer (pop, breadcrumb navigation, replacement, full close), not just for whichever layer was on top when the drawer closed. If you relied on lower layers being skipped, gate on your own state.
- The drawer applies `inert` to background content by default; pass `inertBackground={false}` for the old behavior.
- Root and panel elements now carry `data-placement`; custom CSS written against v1 selectors keeps working for the default right-side placement as long as it does not assume the old fixed `translate` values on the bare `.common-drawer__panel` class.
- New `use client` banners mean the package works out of the box in RSC environments.

## Development notes

Local checks:

```bash
npm run build
npm test
npm pack
```

If your app consumes a local tarball, rebuild and reinstall after changing exports. Otherwise you end up debugging yesterday's package and blaming today's code, which is a very efficient way to waste an afternoon.
