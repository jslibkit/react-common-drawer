# @jslibkit/common-drawer

A practical drawer library for React with one job: mount once, keep a ref somewhere sensible, and open drawers from wherever you need them.

It supports:

- React 18 via `@jslibkit/common-drawer/react18`
- React 19 via `@jslibkit/common-drawer/react19`
- `pure` styling mode backed by the package CSS file
- `tailwind` styling mode backed by a theme object you create in your app
- nested drawer layers through `open`, `push`, `pop`, and `close`
- optional footer and optional header per layer
- root-level mounting with a shared registry helper

This README is intentionally detailed. It is written for the future when we forget how this worked after two weeks, not for internet applause.

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

- `@jslibkit/common-drawer`
  Exposes shared types, theme helpers, and the drawer registry helper.
- `@jslibkit/common-drawer/react18`
  Exposes the React 18 drawer component.
- `@jslibkit/common-drawer/react19`
  Exposes the React 19 drawer component.
- `@jslibkit/common-drawer/drawer.css`
  CSS file used by `cssMode="pure"`.

Useful exports from the root package:

- `createDrawerRegistry`
- `createDrawerClasses`
- `PURE_DRAWER_CLASS_NAMES`
- `TAILWIND_DRAWER_CLASS_NAMES`
- `DrawerHandle`
- `DrawerSize`

## Installation

```bash
npm install @jslibkit/common-drawer react react-dom
```

If you use `cssMode="pure"`, import the CSS once:

```tsx
import '@jslibkit/common-drawer/drawer.css'
```

If you use `cssMode="tailwind"`, do not import `drawer.css`. Instead, create a Tailwind theme object in your application source and pass it to the component.

## Quick start

### React 18 + pure mode

```tsx
import '@jslibkit/common-drawer/drawer.css'
import { CommonDrawer } from '@jslibkit/common-drawer/react18'
import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/common-drawer'

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
import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/common-drawer'

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
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Width preset. |
| `footer` | `ReactNode` | `undefined` | Optional footer section. |
| `showHeader` | `boolean` | `true` | Hides the entire header when `false`. |
| `onClose` | `() => void` | `undefined` | Runs once when the drawer fully closes. |

### `DrawerHandle<TLayer>`

| Method | Signature | Meaning |
| --- | --- | --- |
| `open` | `(layer: TLayer) => void` | Replace the entire stack. |
| `push` | `(layer: TLayer) => void` | Add a nested layer on top. |
| `pop` | `() => void` | Remove one layer, or close at root. |
| `close` | `() => void` | Close the whole drawer. |

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
import '@jslibkit/common-drawer/drawer.css'
```

Optional override path:

You can still pass `theme` in pure mode if you want to replace specific class names with your own CSS module or CSS class contract.

### `cssMode="tailwind"`

Use this when you want the structure and behavior from the component, but want Tailwind utility classes for styling.

Important:

Tailwind mode should be paired with a theme object created in your own app source. That is the safest way to ensure Tailwind sees the classes during scanning.

```ts
import { createDrawerClasses } from '@jslibkit/common-drawer'

export const drawerTheme = createDrawerClasses('tailwind')
```

Then:

```tsx
<CommonDrawer ref={drawer.ref} cssMode="tailwind" theme={drawerTheme} />
```

## Theme system

### Built-in presets

The package exports two preset objects:

- `PURE_DRAWER_CLASS_NAMES`
- `TAILWIND_DRAWER_CLASS_NAMES`

These are useful as references, or as a base when you want to inspect or extend the default slot map.

### `createDrawerClasses(mode, overrides)`

This helper returns a complete theme object.

```ts
import { createDrawerClasses } from '@jslibkit/common-drawer'

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

## Tailwind setup

Tailwind mode only works when Tailwind scans the drawer class strings.

### Tailwind v4

Dependencies in `node_modules` are ignored by default. Add the package as a source in your main stylesheet:

```css
@import "tailwindcss";
@source "../node_modules/@jslibkit/common-drawer";
```

Adjust the relative path to match your project.

If you create your `drawerTheme` in your own app source, Tailwind will see those classes there as well, which is why that path is recommended.

### Tailwind v3

Add the package build output to the `content` array in `tailwind.config.js` or `tailwind.config.ts`:

```ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@jslibkit/common-drawer/dist/**/*.{js,mjs}',
  ],
}
```

Again, if your local `drawerTheme.ts` file lives inside your app source, Tailwind will also detect the classes there.

## Behavior details

### Focus handling

When the drawer opens:

- focus moves into the drawer
- Tab navigation stays inside the drawer
- focus is restored when the drawer closes

### Close behavior

The drawer can close through:

- `close()`
- root-level `pop()`
- backdrop click
- `Escape`

`onClose` runs once when the drawer fully closes.

### Scroll locking

The drawer locks `document.body` scroll while open and restores the previous inline value when closing.

### Animation

Both modes animate.

Pure mode:

- uses the packaged CSS transitions

Tailwind mode:

- backdrop fades using `transition-opacity`
- panel slides using `translate-x-full` and `data-[visible=true]:translate-x-0`
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
  title: 'Preview',
  showHeader: false,
  content: <ImageViewer />,
})
```

### A bigger Tailwind panel

```ts
import { createDrawerClasses } from '@jslibkit/common-drawer'

export const drawerTheme = createDrawerClasses('tailwind', {
  panelLg: 'max-w-4xl',
  panelXl: 'max-w-6xl',
})
```

## Example folders

The repository includes example folders for all supported combinations:

- [examples/react18-pure/README.md](/D:/Projects/Bun/drawer/examples/react18-pure/README.md)
- [examples/react18-tailwind/README.md](/D:/Projects/Bun/drawer/examples/react18-tailwind/README.md)
- [examples/react19-pure/README.md](/D:/Projects/Bun/drawer/examples/react19-pure/README.md)
- [examples/react19-tailwind/README.md](/D:/Projects/Bun/drawer/examples/react19-tailwind/README.md)

These are intentionally small reference examples, not a festival of clever abstractions.

## Development notes

Local checks:

```bash
npm run build
npm test
npm pack
```

If your app consumes a local tarball, rebuild and reinstall after changing exports. Otherwise you end up debugging yesterday's package and blaming today's code, which is a very efficient way to waste an afternoon.
