# @jslibkit/common-drawer

Imperative drawer components for React with two React variants and two built-in styling modes.

## Variants

- `@jslibkit/common-drawer/react18`: React 18 version using `forwardRef`
- `@jslibkit/common-drawer/react19`: React 19 version using `ref` as a prop

## Styling modes

Both React variants accept the same styling prop:

- `cssMode="pure"`: uses the package's generated CSS class contract. This is the default mode.
- `cssMode="tailwind"`: uses built-in Tailwind utility classes with slide/fade animation included.

There is no headless mode and no unstyled mode. The component is always styled.

## Install

```bash
npm install @jslibkit/common-drawer react react-dom
```

If you use `cssMode="pure"`, import the packaged CSS once near the app root:

```tsx
import '@jslibkit/common-drawer/drawer.css'
```

If you use `cssMode="tailwind"`, you do not need `drawer.css`, but your app must compile Tailwind classes from the installed package or from your own targeted class module if you override them.

## Root-mounted usage from anywhere

Mount the drawer once near the root and store its reference through the registry helper.

```tsx
// drawerRegistry.ts
import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/common-drawer'

export const appDrawer = createDrawerRegistry<DrawerLayer>()
```

```tsx
// App.tsx (React 18)
import '@jslibkit/common-drawer/drawer.css'
import { CommonDrawer } from '@jslibkit/common-drawer/react18'
import { appDrawer } from './drawerRegistry'

export function App() {
  return (
    <>
      <Routes />
      <CommonDrawer ref={appDrawer.ref} cssMode="pure" />
    </>
  )
}
```

```tsx
// anywhere
import { appDrawer } from './drawerRegistry'

appDrawer.open({
  title: 'Global drawer',
  content: <UserProfile />,
})
```

The registry exposes `ref`, `getHandle`, `open`, `push`, `pop`, and `close`.

Each layer can also hide the entire header by setting `showHeader: false`.

## React 18 usage

```tsx
import '@jslibkit/common-drawer/drawer.css'
import { CommonDrawer, type DrawerLayer } from '@jslibkit/common-drawer/react18'
import { createDrawerRegistry } from '@jslibkit/common-drawer'

const drawer = createDrawerRegistry<DrawerLayer>()

export function App() {
  return <CommonDrawer ref={drawer.ref} cssMode="pure" />
}
```

## React 19 usage

```tsx
import { CommonDrawer, type DrawerLayer } from '@jslibkit/common-drawer/react19'
import { createDrawerRegistry } from '@jslibkit/common-drawer'

const drawer = createDrawerRegistry<DrawerLayer>()

export function App() {
  return <CommonDrawer ref={drawer.ref} cssMode="tailwind" />
}
```

## Styling API

### `cssMode`

| Value | Meaning |
| --- | --- |
| `pure` | Uses the package CSS class system and `drawer.css`. |
| `tailwind` | Uses built-in Tailwind utility classes, including animation. |

### `classNames`

You can override any slot by defining a targeted classes module in your own codebase.

```ts
// drawerTheme.ts
import {
  createDrawerClasses,
  type CommonDrawerClassNames,
} from '@jslibkit/common-drawer'

export const drawerTheme: Partial<CommonDrawerClassNames> = createDrawerClasses('tailwind', {
  panel: 'relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl outline-none translate-x-full transition-transform ease-out data-[visible=true]:translate-x-0',
  panelLg: 'max-w-3xl',
  header: 'flex items-center gap-3 border-b border-zinc-200 px-6 py-5',
  title: 'm-0 flex-1 text-lg font-semibold text-zinc-950',
  content: 'flex-1 overflow-y-auto px-6 py-5',
  footer: 'border-t border-zinc-200 bg-zinc-50 px-6 py-4',
})
```

```tsx
<CommonDrawer ref={drawer.ref} cssMode="tailwind" classNames={drawerTheme} />
```

Available class slots:

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

### Built-in presets

The package exports these helpers:

- `PURE_DRAWER_CLASS_NAMES`
- `TAILWIND_DRAWER_CLASS_NAMES`
- `createDrawerClasses(mode, overrides)`

## Tailwind animation

The built-in Tailwind mode includes animation by default:

- backdrop: opacity fade using `transition-opacity`
- panel: slide-in/out using `translate-x-full` and `data-[visible=true]:translate-x-0`
- duration: controlled by the component's `transitionMs` prop via inline `transitionDuration`

## Layer options

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `title` | `string` | required | Title used for labeling and the default header. |
| `content` | `ReactNode` | required | Main drawer content. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Drawer width preset. |
| `footer` | `ReactNode` | `undefined` | Optional footer region. |
| `showHeader` | `boolean` | `true` | Hides the full header when set to `false`. |
| `onClose` | `() => void` | `undefined` | Runs once when the drawer fully closes. |

## Optional header

If a screen should render content only, without the title row/back button/close button:

```tsx
drawer.open({
  title: 'Media preview',
  showHeader: false,
  content: <ImageViewer />,
})
```

## Behavior guarantees

Both React variants provide:

- imperative API through `open`, `push`, `pop`, `close`
- one mounted drawer at the root controlled from anywhere through the registry helper
- consistent `onClose` handling
- focus trapping and focus restore
- keyboard-operable breadcrumbs
- body scroll lock with restore-safe cleanup
- cleanup for pending timers and animation frames during rapid transitions

## Build and test

```bash
npm run build
npm test
npm pack
```
