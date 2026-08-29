# Upgrade Guide: 1.x → 2.0.0

Version 2.0.0 fixes real bugs and adds features, but it has **three breaking changes**. This guide walks you through the whole upgrade, in order. Budget about 15 minutes.

## Step 1 — Check what you have now

1. Open your terminal in your app folder.
2. Run:

   ```bash
   npm ls @jslibkit/react-common-drawer
   ```

3. If it prints `1.x.x`, this guide is for you. If it prints `2.x.x`, you are already upgraded — stop here.
4. Make sure your work is saved before touching anything:

   ```bash
   git status
   ```

   Commit or stash anything pending, so you can undo the upgrade easily if needed.

## Step 2 — Install the new version

1. Run:

   ```bash
   npm install @jslibkit/react-common-drawer@2
   ```

2. Wait for it to finish.
3. Confirm it worked:

   ```bash
   npm ls @jslibkit/react-common-drawer
   ```

   It should now print `2.0.0` (or higher).

## Step 3 — Fix the `theme` prop (if you used it)

The 1.x README documented a `theme` prop that never actually existed — the real prop was always `classNames`. If you copied code from the old README, it silently did nothing.

1. Search your whole project for `theme={` on the drawer component:

   ```bash
   git grep -n "CommonDrawer"
   ```

2. Anywhere you see this:

   ```tsx
   <CommonDrawer ref={drawer.ref} cssMode="tailwind" theme={drawerTheme} />
   ```

   change it to this:

   ```tsx
   <CommonDrawer ref={drawer.ref} cssMode="tailwind" classNames={drawerTheme} />
   ```

3. If you never passed `theme`, skip this step.

## Step 4 — Review every `onClose` you pass (breaking change 1)

**What changed:** in 1.x, only the layer on top when the drawer closed got its `onClose` called. In 2.0, **every** layer fires `onClose` exactly once when it leaves the stack — whether it was popped, removed by breadcrumb navigation, replaced by `open()`, or the whole drawer closed.

1. Search for every `onClose` you pass in a layer:

   ```bash
   git grep -n "onClose"
   ```

2. For each one, ask: "Is it OK if this also runs when the layer is popped or replaced, not only on full close?"
   - **Usually yes** — cleanup callbacks want exactly this. Do nothing.
   - **If no** — for example, it navigates away or shows a toast that should only happen on full close — track that yourself:

     ```tsx
     drawer.open({
       title: 'Settings',
       content: <Settings />,
       onClose: () => {
         // getHandle() is null-safe; the drawer is fully closed
         // when your own app state says nothing re-opened it.
         onSettingsDismissed()
       },
     })
     ```

     In practice: move "only on final close" logic into the place that calls `drawer.close()`, instead of the layer callback.

## Step 5 — Decide about `inert` (breaking change 2)

**What changed:** while the drawer is open, everything behind it now gets the `inert` attribute by default. That means background content cannot be clicked, tabbed to, or read by screen readers — which is what a modal drawer should do.

1. Run your app and open the drawer.
2. Does everything still look and behave right? For almost everyone: **yes, do nothing.** This is the correct accessible behavior.
3. Only if something behind the drawer must stay interactive (unusual), turn it off:

   ```tsx
   <CommonDrawer ref={drawer.ref} inertBackground={false} />
   ```

## Step 6 — Check custom CSS overrides (breaking change 3)

Skip this step if you never wrote your own CSS against `.common-drawer__panel`.

**What changed:** the panel's slide transform is now keyed on a `data-placement` attribute (because the drawer supports left/right/top/bottom now). The bare class no longer carries `translate: 100%`.

1. Search your CSS for the panel class:

   ```bash
   git grep -n "common-drawer__panel" -- "*.css" "*.scss"
   ```

2. If any rule of yours sets `translate` or `transform` on `.common-drawer__panel`, add the placement attribute to the selector:

   ```css
   /* before */
   .common-drawer__panel { translate: 100%; }

   /* after */
   .common-drawer__panel[data-placement='right'] { translate: 100% 0; }
   ```

3. Colors, padding, fonts, shadows — all untouched. Only the slide transform moved.

## Step 7 — Run and test

1. Start the app:

   ```bash
   npm run dev
   ```

2. Walk through this checklist:
   - [ ] Drawer opens.
   - [ ] `Escape` closes it.
   - [ ] Clicking the backdrop closes it.
   - [ ] `Tab` stays inside the drawer.
   - [ ] Closing returns focus to the button that opened it.
   - [ ] If you use `push()`: open → push → pop → close works, and breadcrumbs show.
   - [ ] Your `onClose` callbacks fire when you expect (Step 4).
3. All checked? Commit:

   ```bash
   git add -A
   git commit -m "Upgrade @jslibkit/react-common-drawer to 2.0.0"
   ```

## Step 8 (optional) — Use the new features

None of these are required. They are just now available:

- **Placement** — slide from any edge; `start`/`end` follow RTL automatically:

  ```tsx
  <CommonDrawer ref={drawer.ref} placement="bottom" />
  ```

- **Keep it open on Escape / backdrop click** (dirty forms):

  ```tsx
  <CommonDrawer ref={drawer.ref} closeOnEscape={false} closeOnBackdrop={false} />
  ```

- **Focus a specific element when a layer opens**:

  ```tsx
  drawer.open({ title: 'Search', initialFocus: 'input[name=q]', content: <Search /> })
  ```

- **Headless build** — same engine, zero styling, render props:

  ```tsx
  import { HeadlessDrawer } from '@jslibkit/react-common-drawer/headless'
  ```

- **Rapid calls are now safe** — `open()` then `push()` in the same click handler stacks correctly; pushing while the drawer is closing reopens it instead of freezing the page.

## If something breaks

1. Read the error — the most common upgrade mistake is a leftover `theme={...}` (Step 3).
2. Compare your code against the `examples/` folder in the repository; every supported combination has a working example.
3. To undo the whole upgrade:

   ```bash
   npm install @jslibkit/react-common-drawer@1.0.2
   git checkout -- .
   ```

4. File an issue with the error message and your React version.
