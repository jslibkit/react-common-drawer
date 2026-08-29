# Releasing (Maintainer Guide)

How to ship a new version of `@jslibkit/react-common-drawer` to GitHub and npm. Follow in order. Do not skip the checks — they exist because skipping them ships broken packages.

This file is for the maintainer; it is kept in git but not shipped in the npm package.

## Step 0 — One-time setup (only the first time ever)

1. Have an npm account: sign up at [npmjs.com](https://www.npmjs.com/signup) if you don't.
2. You need publish rights on the `@jslibkit` scope (you created it, so you have them).
3. Log in from your terminal:

   ```bash
   npm login
   ```

4. Check you are logged in as the right user:

   ```bash
   npm whoami
   ```

## Step 1 — Start clean

1. Open a terminal in the project folder (`drawer/`).
2. Make sure nothing is half-done:

   ```bash
   git status
   ```

3. If files are listed as modified, either commit them or stash them. Never release from a dirty tree.
4. Make sure dependencies are fresh:

   ```bash
   npm install
   ```

## Step 2 — Verify everything

Run these four commands, in order. **Every one must pass.** If one fails, fix it first — do not continue.

1. Tests:

   ```bash
   npm test
   ```

   Expected: all tests pass, zero failures.
2. Types:

   ```bash
   npx tsc --noEmit
   ```

   Expected: no output at all (silence = success).
3. Build:

   ```bash
   npm run build
   ```

   Expected: ends without errors; `dist/` is rebuilt.
4. Package sanity (checks the types/exports wiring consumers will see):

   ```bash
   npx --yes @arethetypeswrong/cli --pack .
   ```

   Expected: green checks everywhere. The only allowed ❌ is on the `./drawer.css` entry — the tool simply cannot model CSS files. Any other ❌ means the exports map is broken.

## Step 3 — Set the version

1. Decide the version number using [semver](https://semver.org):
   - Bug fix only → patch (`2.0.0` → `2.0.1`)
   - New feature, nothing breaks → minor (`2.0.0` → `2.1.0`)
   - Anything breaks for existing users → major (`2.0.0` → `3.0.0`)
2. Update the `"version"` field in `package.json` to that number.
3. Add a section for it at the **top** of `CHANGELOG.md` describing what changed (copy the style of the existing entries).
4. If the release has breaking changes, also update `UPGRADING.md`.

## Step 4 — Dry run (see exactly what will be published)

1. Run:

   ```bash
   npm pack --dry-run
   ```

2. Read the file list it prints. It must contain:
   - `dist/` files (`.js`, `.mjs`, `.d.ts`, `.d.mts`, maps, `drawer.css`)
   - `README.md`, `CHANGELOG.md`, `INSTALLATION.md`, `UPGRADING.md`, `package.json`
3. It must **not** contain: `node_modules`, tests, `examples/`, this file, or any `.tsx` source.
4. Something wrong in the list? Fix the `"files"` field in `package.json` and repeat this step.

## Step 5 — Commit and tag in git

1. Commit the release:

   ```bash
   git add -A
   git commit -m "Release v2.0.0"
   ```

   (Use the real version number everywhere you see `2.0.0`.)
2. Tag it:

   ```bash
   git tag v2.0.0
   ```

3. Push the commit **and** the tag:

   ```bash
   git push origin main
   git push origin v2.0.0
   ```

   (If your default branch is not `main`, use its real name.)

## Step 6 — Publish to npm

1. Publish (scoped packages need the access flag the first time):

   ```bash
   npm publish --access public
   ```

2. If npm asks for a one-time password, type the code from your authenticator app.
3. Verify it is live:

   ```bash
   npm view @jslibkit/react-common-drawer version
   ```

   Expected: it prints the version you just released.
4. Open the package page and eyeball the README rendering:
   `https://www.npmjs.com/package/@jslibkit/react-common-drawer`

## Step 7 — GitHub release (nice to have)

1. Go to the repository on GitHub → **Releases** → **Draft a new release**.
2. Pick the tag you pushed (`v2.0.0`).
3. Title: `v2.0.0`.
4. Body: paste that version's section from `CHANGELOG.md`.
5. Click **Publish release**.

## Step 8 — Prove it works from the outside

1. Somewhere **outside** this repo, make a scratch folder:

   ```bash
   mkdir /tmp/drawer-smoke && cd /tmp/drawer-smoke
   npm init -y
   npm install @jslibkit/react-common-drawer react react-dom
   ```

2. Check the install pulled the new version:

   ```bash
   npm ls @jslibkit/react-common-drawer
   ```

3. Optional but worth it: drop the Quick start from `INSTALLATION.md` into a Vite app and click the button once.

## If you published something broken

- You have **72 hours** to unpublish a version, but prefer not to. The cleaner fix:
  1. Fix the bug.
  2. Bump the patch version.
  3. Publish again (repeat Steps 2–6).
- To stop people from installing the bad one, deprecate it:

  ```bash
  npm deprecate @jslibkit/react-common-drawer@2.0.1 "Broken build, use 2.0.2"
  ```
