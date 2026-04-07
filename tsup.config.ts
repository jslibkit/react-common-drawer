import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'Drawer.tsx', 'Drawer.react19.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  outDir: 'dist',
})
