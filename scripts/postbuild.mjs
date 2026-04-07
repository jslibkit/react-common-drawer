import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const targetDir = resolve(root, 'dist')

await mkdir(targetDir, { recursive: true })
await copyFile(resolve(root, 'drawer.css'), resolve(targetDir, 'drawer.css'))
