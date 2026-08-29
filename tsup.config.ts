import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'Drawer.tsx', 'Drawer.react19.tsx', 'DrawerHeadless.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  outDir: 'dist',
  banner: {
    // Required so the components work when imported from React Server
    // Components environments (Next.js App Router etc.).
    js: '"use client"',
  },
})
