# Installation Guide (New Project)

This guide takes you from "nothing" to "a working drawer on screen". Follow the steps in order. Do not skip steps.

## Step 0 — Check what you have

1. Open your terminal.
2. Type this and press Enter:

   ```bash
   node -v
   ```

3. You need version **18.0.0 or higher**. If the number is lower (or you get an error), install Node.js from [nodejs.org](https://nodejs.org) first, then come back.
4. Type this and press Enter:

   ```bash
   npm -v
   ```

5. Any version 9 or higher is fine. npm comes with Node.js, so if step 2 worked, this will too.

## Step 1 — Have a React app

- **Already have a React app?** Skip to Step 2.
- **Don't have one?** Create one:

  1. In your terminal, go to the folder where you keep projects:

     ```bash
     cd path/to/your/projects
     ```

  2. Create a new React app with Vite:

     ```bash
     npm create vite@latest my-app -- --template react-ts
     ```

  3. Go into the new folder:

     ```bash
     cd my-app
     ```

  4. Install its starting packages:

     ```bash
     npm install
     ```

## Step 2 — Install the drawer package

1. Make sure your terminal is inside your app folder (the folder that has a `package.json` file).
2. Run:

   ```bash
   npm install @jslibkit/react-common-drawer
   ```

3. Wait for it to finish. No errors = success.

## Step 3 — Find out which React you have

1. Run:

   ```bash
   npm ls react
   ```

2. Look at the number it prints:
   - Starts with `18` → you will import from `@jslibkit/react-common-drawer/react18`
   - Starts with `19` → you will import from `@jslibkit/react-common-drawer/react19`
3. Remember your answer. You need it in Step 5.

## Step 4 — Create the registry file

The registry is a tiny object that lets you open the drawer from anywhere in your app.

1. In your `src` folder, create a new file called `drawerRegistry.ts` (or `.js` if you don't use TypeScript).
2. Put exactly this inside it:

   ```ts
   import { createDrawerRegistry, type DrawerLayer } from '@jslibkit/react-common-drawer'

   export const drawer = createDrawerRegistry<DrawerLayer>()
   ```

3. Save the file.

## Step 5 — Mount the drawer once, at the root

1. Open your root component (usually `src/App.tsx`).
2. Add these imports at the top. **Use the line that matches your React version from Step 3** (the example below is React 18):

   ```tsx
   import '@jslibkit/react-common-drawer/drawer.css'
   import { CommonDrawer } from '@jslibkit/react-common-drawer/react18'
   import { drawer } from './drawerRegistry'
   ```

3. Put `<CommonDrawer />` at the end of what your App returns:

   ```tsx
   export function App() {
     return (
       <>
         {/* ...the rest of your app... */}
         <CommonDrawer ref={drawer.ref} cssMode="pure" />
       </>
     )
   }
   ```

4. Save the file.
5. Important rules:
   - Mount it **once**. Not once per page. Once for the whole app.
   - The CSS import (`drawer.css`) is needed only for `cssMode="pure"` (the default look).

## Step 6 — Open the drawer from anywhere

1. In any component, import the registry and call `open`:

   ```tsx
   import { drawer } from './drawerRegistry'

   function ProfileButton() {
     return (
       <button
         type="button"
         onClick={() => {
           drawer.open({
             title: 'Edit profile',
             content: <p>Hello from the drawer!</p>,
           })
         }}
       >
         Open drawer
       </button>
     )
   }
   ```

2. Save the file.

## Step 7 — Run it and check

1. Start your app:

   ```bash
   npm run dev
   ```

2. Open the printed URL in your browser.
3. Click your button. A panel should slide in from the right.
4. Check these four things work:
   - Pressing `Escape` closes it.
   - Clicking the dark background closes it.
   - Pressing `Tab` keeps focus inside the drawer.
   - After closing, focus goes back to the button you clicked.
5. If all four work: you are done. 🎉

## Optional — Tailwind styling instead of the package CSS

Only do this if your app already uses Tailwind.

1. **Delete** the `import '@jslibkit/react-common-drawer/drawer.css'` line — Tailwind mode does not use it.
2. Create a file `src/drawerTheme.ts` with:

   ```ts
   import { createDrawerClasses } from '@jslibkit/react-common-drawer'

   export const drawerTheme = createDrawerClasses('tailwind')
   ```

3. Change the mounted component to:

   ```tsx
   <CommonDrawer ref={drawer.ref} cssMode="tailwind" classNames={drawerTheme} />
   ```

4. Tell Tailwind to scan the package, or the drawer will appear unstyled:
   - **Tailwind v4** — add this to your main CSS file, under `@import "tailwindcss";`:

     ```css
     @source "../node_modules/@jslibkit/react-common-drawer";
     ```

     (Adjust the `../` so the path really points at your `node_modules`.)
   - **Tailwind v3** — add this line to the `content` array in `tailwind.config.js`:

     ```js
     './node_modules/@jslibkit/react-common-drawer/dist/**/*.{js,mjs}',
     ```

5. Restart `npm run dev` and check the drawer again.

## Troubleshooting

- **"Cannot find module '@jslibkit/react-common-drawer'"** → Step 2 did not run in the right folder. `cd` into your app folder and run it again.
- **Drawer opens but has no styling** → In pure mode you forgot the `drawer.css` import (Step 5). In Tailwind mode you skipped the scanning setup (Optional section, step 4).
- **Drawer never appears** → Make sure `<CommonDrawer ref={drawer.ref} />` is actually mounted (Step 5), and that the registry file you import in your button is the **same file** you passed to `ref`.
- **Using Next.js App Router** → It works out of the box; the package ships with `"use client"` already. Mount `<CommonDrawer />` in a client component (for example, your root layout's providers component).
